using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MyHordesOptimizerApi.Models.Expeditions
{
    [Table("ExpeditionCitizenOrder")]
    public class ExpeditionCitizenOrderModel
    {
        [Column("idExpeditionOrder")]
        [Key]
        public int IdExpeditionOrder { get; set; }

        [Column("idExpeditionCitizen")]
        public int IdExpeditionCitizen { get; set; }
    }
}
