using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.Map;
using MyHordesOptimizerApi.Models;
using MyHordesOptimizerApi.Services.Impl.Maps;
using System;
using System.Collections.Generic;
using System.Linq;

namespace MyHordesOptimizerApi.Extensions
{
    /// <summary>
    /// Application des informations relevées par les métiers Fouineur et Éclaireur.
    /// <para>
    /// Ces relevés portent à la fois sur la case où se trouve le joueur (niveau d'abondance
    /// et niveau d'exploration) et sur les quatre cases adjacentes (radars).
    /// La logique est partagée entre la mise à jour issue du script utilisateur et la
    /// saisie manuelle depuis la popup d'édition d'une cellule.
    /// </para>
    /// </summary>
    public static class MapCellRadarExtensions
    {
        /// <summary>
        /// Amplitude maximale du bruit appliqué par MyHordes à l'estimation de l'Éclaireur
        /// lorsque le niveau d'exploration de la zone est inconnu.
        /// </summary>
        public const int MaxScoutEstimationRange = 2;

        /// <summary>
        /// Amplitude du bruit de l'estimation pour un niveau d'exploration donné.
        /// MyHordes calcule <c>range = max(2 - scoutLevel, 0)</c> : une zone entièrement
        /// explorée donne une estimation exacte.
        /// </summary>
        public static int GetScoutEstimationRange(int? scoutZoneLevel)
        {
            if (!scoutZoneLevel.HasValue)
            {
                return MaxScoutEstimationRange;
            }
            return Math.Max(MaxScoutEstimationRange - scoutZoneLevel.Value, 0);
        }

        /// <summary>
        /// Applique à la carte les relevés effectués depuis la case (<paramref name="x"/>, <paramref name="y"/>),
        /// exprimée en coordonnées absolues de la base.
        /// </summary>
        /// <param name="townCells">Toutes les cases de la ville, suivies par le contexte.</param>
        /// <param name="observations">Observations de la mise à jour en cours : les relevés du Fouineur en sont.</param>
        /// <param name="scavZoneLevel">Niveau d'abondance de la case courante : <c>null</c> s'il n'a pas été relevé À L'INSTANT
        /// (une valeur ressaisie à l'identique ramènerait les fouilles restantes dans une fourchette périmée).</param>
        /// <param name="lastUpdateInfoId">Identifiant de mise à jour à porter sur les estimations d'Éclaireur.</param>
        /// <returns>La fourchette de fouilles restantes imposée à la case courante, <c>null</c> si aucune.</returns>
        public static DigBounds? ApplyJobRadars(this IEnumerable<MapCell> townCells,
            DigObservations observations,
            int x,
            int y,
            int? scavZoneLevel,
            int? scoutZoneLevel,
            ScavNextCellsDto? scavNextCells,
            ScoutNextCellsDto? scoutNextCells,
            int lastUpdateInfoId)
        {
            var cells = townCells as IList<MapCell> ?? townCells.ToList();

            MapCell? FindCell(int cellX, int cellY) => cells.FirstOrDefault(cell => cell.X == cellX && cell.Y == cellY);

            var currentCellBounds = ApplyCurrentCell(observations, FindCell(x, y), scavZoneLevel, scoutZoneLevel);

            // Le nord de la carte correspond aux ordonnées décroissantes en base
            // (cf. MapMappingProfile : displayY = town.Y - cell.Y)
            ApplyScavRadar(observations, FindCell(x, y - 1), scavNextCells?.North);
            ApplyScavRadar(observations, FindCell(x, y + 1), scavNextCells?.South);
            ApplyScavRadar(observations, FindCell(x + 1, y), scavNextCells?.East);
            ApplyScavRadar(observations, FindCell(x - 1, y), scavNextCells?.West);

            ApplyScoutRadar(FindCell(x, y - 1), scoutNextCells?.North, lastUpdateInfoId);
            ApplyScoutRadar(FindCell(x, y + 1), scoutNextCells?.South, lastUpdateInfoId);
            ApplyScoutRadar(FindCell(x + 1, y), scoutNextCells?.East, lastUpdateInfoId);
            ApplyScoutRadar(FindCell(x - 1, y), scoutNextCells?.West, lastUpdateInfoId);

            return currentCellBounds;
        }

        private static DigBounds? ApplyCurrentCell(DigObservations observations, MapCell? cell, int? scavZoneLevel, int? scoutZoneLevel)
        {
            if (cell == null)
            {
                return null;
            }
            DigBounds? bounds = null;
            if (scavZoneLevel.HasValue)
            {
                // Le niveau d'abondance est une information certaine sur la quantité : les fouilles
                // restantes sont ramenées dans sa fourchette (0 : zone épuisée). Ignoré s'il contredit
                // l'état natif, plus récent que la page.
                var scavBounds = DigBounds.ForScavLevel(scavZoneLevel.Value);
                if (observations.Observe(cell, scavBounds))
                {
                    cell.ScavZoneLevel = scavZoneLevel.Value;
                    bounds = scavBounds;
                }
            }
            if (scoutZoneLevel.HasValue)
            {
                cell.ScoutZoneLevel = scoutZoneLevel.Value;
            }
            return bounds;
        }

        /// <summary>
        /// Radar du Fouineur : <paramref name="isDepleted"/> vaut true quand la case voisine
        /// n'offre plus rien à fouiller. Il ne dit rien de la quantité, seulement « vide ou non »
        /// (<c>RenderMapAction</c> : <c>digs > 0 || ruinDigs > 0</c>).
        /// </summary>
        private static void ApplyScavRadar(DigObservations observations, MapCell? cell, bool? isDepleted)
        {
            if (cell == null || !isDepleted.HasValue)
            {
                return;
            }
            if (isDepleted.Value)
            {
                // Plus rien à fouiller : la zone et, le cas échéant, le bâtiment sont épuisés
                observations.Observe(cell, DigBounds.Depleted);
                if (cell.IdRuin.HasValue)
                {
                    cell.IsRuinDryed = true;
                }
            }
            else if (!cell.IdRuin.HasValue)
            {
                observations.Observe(cell, DigBounds.NotDepleted);
            }
            // Case avec bâtiment dont le radar signale qu'il reste quelque chose : impossible
            // de savoir si cela concerne la zone ou le bâtiment, on ne touche donc à rien.
        }

        /// <summary>
        /// Radar de l'Éclaireur : estimation bruitée du nombre de zombies sur la case voisine.
        /// Elle n'est jamais certaine, y compris lorsqu'elle vaut 0, et ne doit donc pas
        /// écraser <see cref="MapCell.NbZombie"/>.
        /// </summary>
        private static void ApplyScoutRadar(MapCell? cell, int? estimation, int lastUpdateInfoId)
        {
            if (cell == null || !estimation.HasValue)
            {
                return;
            }
            cell.ScoutEstimationZombie = estimation.Value;
            cell.IdScoutEstimationLastUpdateInfo = lastUpdateInfoId;
        }
    }
}
