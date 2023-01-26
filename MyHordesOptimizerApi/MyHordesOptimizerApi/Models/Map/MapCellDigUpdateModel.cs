using System.ComponentModel.DataAnnotations.Schema;

namespace MyHordesOptimizerApi.Models.Map
{
    [Table("MapCellDigUpdate")]
    public class MapCellDigUpdateModel
    {
        public int IdTown { get; set; }
        public int Day { get; set; }
        public int DirectionRegen { get; set; }
        public int LevelRegen { get; set; }
        public int TauxRegen { get; set; }
    }
}
