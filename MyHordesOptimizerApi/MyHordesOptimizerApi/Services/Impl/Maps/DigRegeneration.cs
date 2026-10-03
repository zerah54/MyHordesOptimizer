using MyHordesOptimizerApi.Configuration.Interfaces;
using MyHordesOptimizerApi.Dtos.MyHordes;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Map;
using MyHordesOptimizerApi.Extensions;
using MyHordesOptimizerApi.Models;
using System;
using System.Collections.Generic;
using System.Linq;

namespace MyHordesOptimizerApi.Services.Impl.Maps
{
    /// <summary>
    /// Une nuit de régénération, telle que MHO peut la connaître.
    /// </summary>
    /// <param name="Day">Jour de la gazette qui suit la nuit.</param>
    /// <param name="HasNight">Faux au jour 1 : aucune nuit ne l'a précédé.</param>
    /// <param name="Wind">Direction du vent, <c>null</c> quand elle est inconnue (pas de Tour de guet avancée, nuit manquée).</param>
    /// <param name="ScrutateurLevel">Niveau de la Tour de guet avancée.</param>
    /// <param name="ChancePercent">Chance de régénération d'une zone touchée par le vent.</param>
    /// <param name="WindDistance">Seules les zones strictement au-delà de cette distance (km) sont régénérées.</param>
    /// <param name="AverageAmount">Nombre moyen d'objets ajoutés à une zone régénérée.</param>
    /// <param name="MaximumAmount">Nombre maximal d'objets ajoutés à une zone régénérée.</param>
    /// <param name="CrowdThreshold">À partir de ce nombre d'objets, la chance de régénération est réduite.</param>
    /// <param name="MaxItemPerCell">Plafond d'objets par zone, <c>null</c> sans plafond.</param>
    public sealed record RegenerationNight(
        int Day,
        bool HasNight,
        DirectionEnum? Wind,
        int ScrutateurLevel,
        int ChancePercent,
        int WindDistance,
        double AverageAmount,
        int MaximumAmount,
        int CrowdThreshold,
        int? MaxItemPerCell);

    /// <summary>
    /// Régénération nocturne des zones, alignée sur MyHordes (<c>NightlyHandler</c>, <c>RegenerateZoneAction</c>) :
    /// <list type="bullet">
    /// <item>le vent souffle dans UNE des huit directions ; seules les zones de cet octant, au-delà de la
    /// distance du vent (2 km, toutes distances en petite carte), peuvent être régénérées ;</item>
    /// <item>chacune l'est avec la chance de la Tour de guet avancée (25 % à 85 %), multipliée par 0,33
    /// si elle compte déjà au moins 10 objets ;</item>
    /// <item>une zone régénérée reçoit 8 à 15 objets.</item>
    /// </list>
    /// Direction inconnue : chaque zone a une chance sur huit d'être dans le vent. Les fouilles restantes
    /// moyennes reçoivent l'espérance du gain, les fouilles maximales le gain maximal possible. Une
    /// régénération n'est jamais certaine (la chance plafonne à 85 %) : une case vue épuisée le reste
    /// jusqu'à la prochaine observation (voir <see cref="DigObservations"/>).
    /// </summary>
    public static class DigRegeneration
    {
        /// <summary>Facteur de chance d'une zone déjà bien remplie (<c>RegenerateZoneAction</c>).</summary>
        public const double CrowdedZoneChanceFactor = 0.33;

        /// <summary>Nombre d'octants, donc de directions possibles pour le vent.</summary>
        public const int WindDirectionCount = 8;

        /// <summary>
        /// Identifiant du Scrutateur dans le jeu (<c>BuildingQueryListener</c> : chance de régénération,
        /// enregistrement du vent dans la gazette). Son identifiant numérique, un auto-incrément de
        /// fixtures MyHordes, se lit dans le référentiel des bâtiments.
        /// </summary>
        public const string ScrutateurUid = "small_gather_#02";

        /// <summary>
        /// Applique les nuits pas encore traitées pour la ville, jusqu'au jour courant inclus, et les
        /// enregistre (<see cref="MapCellDigUpdate"/>). Les nuits sautées (aucune synchronisation ce
        /// jour-là) sont appliquées avec une direction inconnue : la gazette ne donne que la dernière.
        /// Idempotent pour un même jour. À appeler sous le verrou de la ville, AVANT d'appliquer les
        /// observations du jour, qui décrivent l'état d'après la nuit.
        /// </summary>
        /// <param name="loadTownCells">Cases de la ville, suivies par le contexte ; appelé seulement s'il y a une nuit à appliquer.</param>
        public static void ApplyPendingNights(MhoContext dbContext,
            Town town,
            Func<IEnumerable<MapCell>> loadTownCells,
            MyHordesMap? map,
            IMyHordesScrutateurConfiguration configuration)
        {
            int day = map?.Days ?? town.Day;
            if (day < 1)
            {
                return;
            }

            var recordedDays = dbContext.MapCellDigUpdates
                .Where(update => update.IdTown == town.IdTown)
                .Select(update => update.Day)
                .ToList();
            if (recordedDays.Contains(day))
            {
                return;
            }

            int level = ReadScrutateurLevel(dbContext, map, configuration);
            var template = new RegenerationNight(
                Day: day,
                HasNight: true,
                Wind: null,
                ScrutateurLevel: level,
                ChancePercent: ChancePercent(level, configuration),
                WindDistance: WindDistanceFor(town, configuration),
                AverageAmount: (configuration.MinItemAdd + configuration.MaxItemAdd) / 2.0,
                MaximumAmount: configuration.MaxItemAdd,
                CrowdThreshold: configuration.DigThrottle,
                MaxItemPerCell: configuration.MaxItemPerCell);

            var nights = new List<RegenerationNight>();
            // Pas de rattrapage avant la première nuit enregistrée : les cases sont créées avec la
            // dotation initiale au moment où MHO découvre la ville.
            if (recordedDays.Count > 0)
            {
                for (int missingDay = Math.Max(recordedDays.Max() + 1, 2); missingDay < day; missingDay++)
                {
                    nights.Add(template with { Day = missingDay });
                }
            }
            nights.Add(template with { Day = day, HasNight = day > 1, Wind = day > 1 ? ReadWind(map) : null });

            int townX = map?.City?.X ?? town.X;
            int townY = map?.City?.Y ?? town.Y;
            var townCells = loadTownCells();
            var cells = townCells as IList<MapCell> ?? townCells.ToList();
            foreach (var night in nights)
            {
                foreach (var cell in cells)
                {
                    ApplyNight(cell, townX, townY, night);
                }
                dbContext.Add(new MapCellDigUpdate
                {
                    Day = night.Day,
                    IdTown = town.IdTown,
                    DirectionRegen = (int)(night.Wind ?? DirectionEnum.All),
                    LevelRegen = night.ScrutateurLevel,
                    TauxRegen = night.HasNight ? night.ChancePercent : 0
                });
            }
        }

        /// <summary>
        /// Effet d'une nuit sur une case. Complète au passage la distance et l'octant quand ils manquent.
        /// </summary>
        public static void ApplyNight(MapCell cell, int townX, int townY, RegenerationNight night)
        {
            if (cell.IsTown == true)
            {
                return;
            }
            int x = cell.X - townX;
            int y = townY - cell.Y;
            if (x == 0 && y == 0)
            {
                return;
            }

            cell.NbKm ??= ZoneGeometry.DistanceKm(x, y);
            cell.NbPa ??= ZoneGeometry.DistanceAp(x, y);
            cell.ZoneRegen ??= (int)ZoneGeometry.Direction(x, y);

            if (!night.HasNight || cell.NbKm.Value <= night.WindDistance)
            {
                return;
            }

            double directionShare;
            if (night.Wind.HasValue)
            {
                if ((DirectionEnum)cell.ZoneRegen.Value != night.Wind.Value)
                {
                    return;
                }
                directionShare = 1;
            }
            else
            {
                directionShare = 1.0 / WindDirectionCount;
            }

            double crowdFactor = (cell.AveragePotentialRemainingDig ?? 0) >= night.CrowdThreshold ? CrowdedZoneChanceFactor : 1;
            double averageGain = directionShare * (night.ChancePercent / 100.0) * crowdFactor * night.AverageAmount;
            // Le marqueur « épuisée » n'est pas touché : même dans le vent, la régénération n'est qu'une
            // chance. Seule une observation (ou une excavation) dit si elle a eu lieu.
            cell.AddDigs(averageGain, night.MaximumAmount, night.MaxItemPerCell);
        }

        /// <summary>
        /// Distance du vent de la ville : seules les zones strictement au-delà sont régénérées
        /// (<c>modifiers.wind_distance</c> : 2 km, toutes distances en petite carte).
        /// </summary>
        public static int WindDistanceFor(Town town, IMyHordesScrutateurConfiguration configuration)
        {
            return town.TownTypeId == (int)TownType.RNE ? configuration.WindDistanceSmallMap : configuration.WindDistance;
        }

        /// <summary>
        /// Probabilité qu'une nuit enregistrée ait régénéré une case jusque-là vide : chance de la nuit
        /// si le vent connu souffle dans son octant, un huitième de cette chance si le vent est inconnu,
        /// 0 hors du vent, en deçà de sa distance, ou sans nuit (jour 1). Une case vide n'a pas le malus
        /// des zones déjà remplies.
        /// </summary>
        public static double RegenerationProbability(MapCell cell, MapCellDigUpdate night, int windDistance)
        {
            double chance = (night.TauxRegen ?? 0) / 100.0;
            if (chance <= 0 || cell.IsTown == true || !cell.NbKm.HasValue || cell.NbKm.Value <= windDistance)
            {
                return 0;
            }
            if (IsWindUnknown(night))
            {
                return chance / WindDirectionCount;
            }
            return cell.ZoneRegen == night.DirectionRegen ? chance : 0;
        }

        /// <summary>Vent de la nuit inconnu : pas de Scrutateur, gazette non lue ce jour-là, nuit rattrapée.</summary>
        public static bool IsWindUnknown(MapCellDigUpdate night)
        {
            return !night.DirectionRegen.HasValue || night.DirectionRegen.Value == (int)DirectionEnum.All;
        }

        /// <summary>
        /// Niveau du Scrutateur (0 s'il n'est pas construit : le jeu applique alors 25 %). Son identifiant
        /// MyHordes vient du référentiel ; l'identifiant configuré ne sert qu'à défaut.
        /// </summary>
        private static int ReadScrutateurLevel(MhoContext dbContext, MyHordesMap? map, IMyHordesScrutateurConfiguration configuration)
        {
            var buildings = map?.City?.Buildings;
            if (buildings == null || buildings.Count == 0)
            {
                return 0;
            }
            int scrutateurId = dbContext.Buildings
                .Where(building => building.Uid == ScrutateurUid)
                .Select(building => (int?)(building.MhId ?? building.IdBuilding))
                .FirstOrDefault() ?? configuration.Id;
            var scrutateur = buildings.FirstOrDefault(building => building.Id == scrutateurId);
            return scrutateur?.HasLevels ?? 0;
        }

        private static int ChancePercent(int level, IMyHordesScrutateurConfiguration configuration)
        {
            return level switch
            {
                <= 0 => configuration.Level0,
                1 => configuration.Level1,
                2 => configuration.Level2,
                3 => configuration.Level3,
                4 => configuration.Level4,
                _ => configuration.Level5
            };
        }

        /// <summary>
        /// Direction du vent de la gazette. Absente sans Tour de guet avancée ; un libellé inconnu est
        /// traité comme une direction inconnue plutôt que de faire échouer la synchronisation.
        /// </summary>
        private static DirectionEnum? ReadWind(MyHordesMap? map)
        {
            string? label = map?.City?.News?.RegenDir?.De;
            if (string.IsNullOrEmpty(label))
            {
                return null;
            }
            try
            {
                var wind = label.GetEnumFromDescription<DirectionEnum>();
                return wind == DirectionEnum.All ? null : wind;
            }
            catch (ArgumentException)
            {
                return null;
            }
        }
    }
}
