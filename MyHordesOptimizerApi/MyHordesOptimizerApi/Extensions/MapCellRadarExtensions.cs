using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.Map;
using MyHordesOptimizerApi.Models;
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
        /// <param name="lastUpdateInfoId">Identifiant de mise à jour à porter sur les estimations d'Éclaireur.</param>
        public static void ApplyJobRadars(this IEnumerable<MapCell> townCells,
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

            ApplyCurrentCell(FindCell(x, y), scavZoneLevel, scoutZoneLevel);

            // Le nord de la carte correspond aux ordonnées décroissantes en base
            // (cf. MapMappingProfile : displayY = town.Y - cell.Y)
            ApplyScavRadar(FindCell(x, y - 1), scavNextCells?.North);
            ApplyScavRadar(FindCell(x, y + 1), scavNextCells?.South);
            ApplyScavRadar(FindCell(x + 1, y), scavNextCells?.East);
            ApplyScavRadar(FindCell(x - 1, y), scavNextCells?.West);

            ApplyScoutRadar(FindCell(x, y - 1), scoutNextCells?.North, lastUpdateInfoId);
            ApplyScoutRadar(FindCell(x, y + 1), scoutNextCells?.South, lastUpdateInfoId);
            ApplyScoutRadar(FindCell(x + 1, y), scoutNextCells?.East, lastUpdateInfoId);
            ApplyScoutRadar(FindCell(x - 1, y), scoutNextCells?.West, lastUpdateInfoId);
        }

        private static void ApplyCurrentCell(MapCell? cell, int? scavZoneLevel, int? scoutZoneLevel)
        {
            if (cell == null)
            {
                return;
            }
            if (scavZoneLevel.HasValue)
            {
                cell.ScavZoneLevel = scavZoneLevel.Value;
                // Le niveau d'abondance est une information certaine sur la zone :
                // 0 correspond exactement à l'état « zone épuisée » du jeu.
                SetDryed(cell, scavZoneLevel.Value == 0);
            }
            if (scoutZoneLevel.HasValue)
            {
                cell.ScoutZoneLevel = scoutZoneLevel.Value;
            }
        }

        /// <summary>
        /// Radar du Fouineur : <paramref name="isDepleted"/> vaut true quand la case voisine
        /// n'offre plus rien à fouiller.
        /// </summary>
        private static void ApplyScavRadar(MapCell? cell, bool? isDepleted)
        {
            if (cell == null || !isDepleted.HasValue)
            {
                return;
            }
            if (isDepleted.Value)
            {
                // Plus rien à fouiller : la zone et, le cas échéant, le bâtiment sont épuisés
                SetDryed(cell, true);
                if (cell.IdRuin.HasValue)
                {
                    cell.IsRuinDryed = true;
                }
            }
            else if (!cell.IdRuin.HasValue)
            {
                SetDryed(cell, false);
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

        private static void SetDryed(MapCell cell, bool isDryed)
        {
            cell.IsDryed = isDryed;
            if (isDryed)
            {
                cell.AveragePotentialRemainingDig = 0;
                cell.MaxPotentialRemainingDig = 0;
            }
        }
    }
}
