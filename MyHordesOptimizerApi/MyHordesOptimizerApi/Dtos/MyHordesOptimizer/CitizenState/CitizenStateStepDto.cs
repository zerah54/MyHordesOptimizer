namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.CitizenState
{
    public class CitizenStateStepDto
    {
        /// <summary>"item", "move", "equip_shoes", "mount_bike", "dismount_bike", "pickup_defence_cp_item" ou "become_ghoul".</summary>
        public string Type { get; set; } = null!;
        public int? ItemId { get; set; }
        public bool? IsNearZone { get; set; }
    }
}
