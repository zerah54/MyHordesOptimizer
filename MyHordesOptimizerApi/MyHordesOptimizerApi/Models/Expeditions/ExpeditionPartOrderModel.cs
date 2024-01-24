using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MyHordesOptimizerApi.Models.Expeditions
{
    [Table("ExpeditionPartOrder")]
    public class ExpeditionPartOrderModel
    {
        [Column("idExpeditionOrder")]
        [Key]
        public int IdExpeditionOrder { get; set; }

        [Column("idExpeditionPart")]
        public int IdExpeditionPart { get; set; }
    }
}
