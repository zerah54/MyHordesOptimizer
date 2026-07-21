using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.Bags;
using System.Collections.Generic;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Map
{
    public class MyHordesOptimizerCellDto
    {
        public int CellId { get; set; }
        public int X { get; set; }
        public int Y { get; set; }
        public int DisplayX { get; set; }
        public int DisplayY { get; set; }
        public bool IsTown { get; set; }
        public bool IsVisitedToday { get; set; }
        public bool IsNeverVisited { get; set; }
        public int DangerLevel { get; set; }
        public int? IdRuin { get; set; }
        public bool IsDryed { get; set; }
        public int? NbZombie { get; set; }
        public int? NbZombieKilled { get; set; }
        public int? NbHero { get; set; }
        public bool? IsRuinCamped { get; set; }
        public bool? IsRuinDryed { get; set; }
        public int? NbRuinDig { get; set; }
        public int? TotalSucces { get; set; }
        public double? AveragePotentialRemainingDig { get; set; }
        public int? MaxPotentialRemainingDig { get; set; }
        public int NbKm { get; set; }
        public int NbPa { get; set; }
        public string ZoneRegen { get; set; }
        public string? Note { get; set; }

        /// <summary>Niveau d'abondance de la zone (0-3) relevé par un Fouineur. 0 = zone épuisée.</summary>
        public int? ScavZoneLevel { get; set; }

        /// <summary>Niveau d'exploration de la zone (0-3) relevé par un Éclaireur.</summary>
        public int? ScoutZoneLevel { get; set; }

        /// <summary>Estimation bruitée du nombre de zombies, issue du radar d'un Éclaireur voisin.</summary>
        public int? ScoutEstimationZombie { get; set; }

        /// <summary>Borne basse du nombre réel de zombies déduite de l'estimation.</summary>
        public int? ScoutEstimationMin { get; set; }

        /// <summary>Borne haute du nombre réel de zombies déduite de l'estimation.</summary>
        public int? ScoutEstimationMax { get; set; }

        public LastUpdateInfoDto? LastUpdateInfo { get; set; }

        /// <summary>
        /// Fraîcheur propre à l'estimation d'Éclaireur. L'estimation ne prime sur
        /// <see cref="NbZombie"/> que si elle est postérieure à <see cref="LastUpdateInfo"/>.
        /// </summary>
        public LastUpdateInfoDto? ScoutEstimationLastUpdateInfo { get; set; }

        public List<UpdateObjectDto> Items { get; set; }
        public List<CellCitizenDto> Citizens { get; set; }

        public MyHordesOptimizerCellDto()
        {
            Items = new List<UpdateObjectDto>();
            Citizens = new List<CellCitizenDto>();
        }

    }
}
