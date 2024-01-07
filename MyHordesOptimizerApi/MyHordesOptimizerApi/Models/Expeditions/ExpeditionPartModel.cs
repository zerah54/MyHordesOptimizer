using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MyHordesOptimizerApi.Models.Expeditions
{
    [Table("ExpeditionPart")]
    public class ExpeditionPartModel
    {
        [Key]
        [Column("idExpeditionPart")]
        public int IdExpeditionPart { get; set; }

        [Column("idExpedition")]
        public int IdExpedition { get; set; }

        [Column("path")]
        public string Path { get; set; }

        [Column("direction")]
        public string Direction { get; set; }

        [Column("label")]
        public string Label { get; set; }

    }
}
