using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MyHordesOptimizerApi.Models.Expeditions
{
    [Table("ExpeditionCitizenPart")]
    public class ExpeditionCitizenPartModel
    {
        [Column("idExpeditionOrder")]
        [Key]
        public int IdExpeditionOrder { get; set; }

        [Column("idExpeditionPart")]
        public int IdExpeditionPart { get; set; }
    }
}
