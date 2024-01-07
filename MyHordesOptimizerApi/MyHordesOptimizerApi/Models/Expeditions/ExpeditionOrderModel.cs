using System.ComponentModel.DataAnnotations.Schema;

namespace MyHordesOptimizerApi.Models.Expeditions
{
    [Table("ExpeditionOrder")]
    public class ExpeditionOrderModel
    {
        [Column("idExpeditionOrder")]
        public int idExpeditionOrder { get; set; }

        [Column("type")]
        public string Type { get; set; }

        [Column("text")]
        public string Text { get; set; }

        [Column("isDone")]
        public bool IsDone { get; set; }

        [Column("position")]
        public int Position { get; set; }
    }
}
