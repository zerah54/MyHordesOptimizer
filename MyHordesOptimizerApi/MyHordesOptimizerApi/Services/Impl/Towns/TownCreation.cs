using AutoMapper;
using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.Configuration.Interfaces;
using MyHordesOptimizerApi.Dtos.MyHordes;
using MyHordesOptimizerApi.Extensions;
using MyHordesOptimizerApi.Models;
using MyHordesOptimizerApi.Services.Impl.Bank;
using System;
using System.Collections.Generic;
using System.Linq;

namespace MyHordesOptimizerApi.Services.Impl.Towns
{
    /// <summary>
    /// Création d'une ville que MHO ne connaît pas encore, depuis le /json/me du joueur qui s'y trouve
    /// (login ou MAJ des outils externes). L'appelant tient le verrou de la ville et fait le SaveChanges.
    /// </summary>
    public static class TownCreation
    {
        /// <summary>
        /// Une ligne provisoire (pas encore migrée vers son townId stable) vit sous IdTown = -mapId,
        /// un espace qui ne peut jamais entrer en collision avec un vrai townId (toujours positif).
        /// Le seul risque résiduel : un mapId recyclé d'une saison à l'autre retombant sur une ancienne
        /// ligne provisoire jamais migrée. On la détecte via la saison et on refuse de la réutiliser.
        /// </summary>
        public static bool HasTownIdCollision(MhoContext db, MyHordesUserDetailsDto me, ILogger logger)
        {
            var mapId = me.MapId;
            var season = me.Map?.Season;
            var existing = db.Towns.FirstOrDefault(t => t.IdTown == -mapId);
            if (existing == null) return false;
            if (!existing.Season.HasValue || !season.HasValue || existing.Season.Value == season.Value) return false;

            logger.LogError(
                "mapId {MapId} recyclé — ligne provisoire existante (saison={ExistingSeason}) incompatible avec la ville actuelle (saison={CurrentSeason}). Synchronisation ignorée pour ne pas écraser une ville différente.",
                mapId, existing.Season, season);
            return true;
        }

        /// <summary>
        /// Ajoute au contexte la ville (IdTown provisoire -mapId), ses citoyens, ses cadavres, sa banque et
        /// ses cases vides. Pas de SaveChanges ; <paramref name="lastUpdate"/> doit être suivi par <paramref name="db"/>.
        /// </summary>
        public static Town Create(MhoContext db, IMapper mapper, MyHordesUserDetailsDto me, LastUpdateInfo lastUpdate, IMyHordesScrutateurConfiguration scrutateur)
        {
            var town = MapTown(db, mapper, me, lastUpdate);
            // Garde-fou : cette ville est celle où le citoyen se trouve actuellement,
            // elle ne peut donc pas être terminée, même si l'import global l'a marquée à tort
            // (le endpoint /json/towns en bulk ne remonte parfois que des citoyens déjà morts).
            town.IsFinished = false;
            var citizens = town.TownCitizens;
            town.TownCitizens = null!;
            var bankItems = town.TownBankItems;
            town.TownBankItems = null!;
            var cadavers = town.TownCadavers;
            town.TownCadavers = null!;
            db.Add(town);
            // Lignes filles déjà présentes en base pour cette ville provisoire (orphelines :
            // la ligne Towns manque mais pas ses TownCitizen/TownCadaver). On exclut leurs clés
            // pour n'insérer que ce qui manque, sinon violation de la PK (IdTown, IdUser).
            HashSet<int> existingCitizenUserIds = db.TownCitizens
                .Where(citizen => citizen.IdTown == town.IdTown)
                .Select(citizen => citizen.IdUser)
                .ToHashSet();
            HashSet<int> existingCadaverUserIds = db.TownCadavers
                .Where(cadaver => cadaver.IdTown == town.IdTown)
                .Select(cadaver => cadaver.IdUser)
                .ToHashSet();
            // Citoyens manquants (dédoublonnage + exclusion des existants ; PK (IdTown, IdUser))
            List<TownCitizen> distinctCitizens = citizens
                .GroupBy(citizen => citizen.IdUser)
                .Select(group => group.First())
                .Where(citizen => !existingCitizenUserIds.Contains(citizen.IdUser))
                .ToList();
            db.AddRange(distinctCitizens);
            TownBankHistory.Record(db, town.IdTown, me.Map!.Days ?? town.Day, lastUpdate.IdLastUpdateInfo, bankItems);
            // Cadavres manquants (dédoublonnage + exclusion des existants ; PK (IdTown, IdUser))
            List<TownCadaver> distinctCadavers = cadavers
                .GroupBy(cadaver => cadaver.IdUser)
                .Select(group => group.First())
                .Where(cadaver => !existingCadaverUserIds.Contains(cadaver.IdUser))
                .ToList();
            db.AddRange(distinctCadavers);
            db.AddRange(CreateCellsForTown(xVille: me.Map.City!.X!.Value,
                yVille: me.Map.City.Y!.Value,
                mapWid: me.Map.Wid!.Value,
                mapHei: me.Map.Hei!.Value,
                townId: town.IdTown,
                lastUpdate,
                scrutateur));
            return town;
        }

        /// <summary>
        /// Ville mappée depuis /json/me, rattachée à <paramref name="lastUpdate"/> (suivi par <paramref name="db"/>).
        /// Le référentiel d'objets est indispensable : sans lui, la banque mappée est vide.
        /// </summary>
        public static Town MapTown(MhoContext db, IMapper mapper, MyHordesUserDetailsDto me, LastUpdateInfo lastUpdate)
        {
            me.Map!.LastUpdateInfo = lastUpdate;
            return mapper.Map<Town>(me, opts => { opts.SetDbContext(db); opts.SetAllItems(db.Items.ToList()); });
        }

        private static List<MapCell> CreateCellsForTown(int xVille, int yVille, int mapWid, int mapHei, int townId, LastUpdateInfo lastUpdate, IMyHordesScrutateurConfiguration scrutateur)
        {
            var cells = new List<MapCell>();
            float averageStartingItem = (float)Math.Round((float)scrutateur.StartItemMin + (((float)scrutateur.StartItemMax - (float)scrutateur.StartItemMin) / 2), 3);
            for (var x = 0; x < mapWid; x++)
            {
                for (var y = 0; y < mapHei; y++)
                {
                    var xFromTown = x - xVille;
                    var yFromTown = yVille - y;
                    bool isTown = x == xVille && y == yVille;
                    float? averageStartingItemValue = averageStartingItem;
                    int? maxPotentialStartingItemValue = scrutateur.StartItemMax;
                    if (isTown)
                    {
                        averageStartingItemValue = null;
                        maxPotentialStartingItemValue = null;
                    }
                    int? zoneRegen = null;
                    // Toutes les cases hors ville ont un octant, celles des axes comprises.
                    if (!isTown)
                    {
                        zoneRegen = (int)ZoneGeometry.Direction(xFromTown, yFromTown);
                    }
                    var cell = new MapCell()
                    {
                        IdTown = townId,
                        IdLastUpdateInfo = lastUpdate.IdLastUpdateInfo,
                        X = x,
                        Y = y,
                        IsTown = isTown,
                        IsVisitedToday = false,
                        IsNeverVisited = true,
                        DangerLevel = null,
                        IsDryed = false,
                        IdRuin = null,
                        NbZombie = null,
                        NbZombieKilled = null,
                        NbHero = null,
                        IsRuinCamped = null,
                        IsRuinDryed = null,
                        NbRuinDig = null,
                        AveragePotentialRemainingDig = averageStartingItemValue,
                        MaxPotentialRemainingDig = maxPotentialStartingItemValue,
                        NbKm = ZoneGeometry.DistanceKm(xFromTown, yFromTown),
                        NbPa = ZoneGeometry.DistanceAp(xFromTown, yFromTown),
                        ZoneRegen = zoneRegen
                    };
                    cells.Add(cell);
                }
            }

            return cells;
        }
    }
}
