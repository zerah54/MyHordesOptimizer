using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MyHordesOptimizerApi.Models.Expeditions
{
    [Table("ExpeditionBag")]
    public class ExpeditionBagItemModel
    {
        [Key]
        [Column("idExpeditionBag")]
        public int IdExpeditionBag { get; set; }

        [Column("idItem")]
        public int IdItem { get; set; }

        [Column("count")]
        public int Count { get; set; }

        [Column("isBroken")]
        public bool IsBroken { get; set; }
    }
}
