namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.CitizenState
{
    public class CitizenStateStepDto
    {
        /// <summary>"item", "move", "equip_shoes", "mount_bike", "dismount_bike", "pickup_defence_cp_item", "become_ghoul" ou "second_wind".</summary>
        public string Type { get; set; } = null!;
        public int? ItemId { get; set; }
        public bool? IsNearZone { get; set; }
        /// <summary>Niveau du Second Souffle (0-3, arbre Endurant) — requis avec Type == "second_wind".</summary>
        public int? Level { get; set; }
    }
}
