using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MyHordesOptimizerApi.Models
{
    [Table("Recipe")]
    public class RecipeModel
    {
        [Column("name")]
        [Key]
        public string Name { get; set; }
        [Column("action_fr")]
        public string ActionFr { get; set; }
        [Column("action_en")]
        public string ActionEn { get; set; }
        [Column("action_de")]
        public string ActionDe { get; set; }
        [Column("action_es")]
        public string ActionEs { get; set; }
        [Column("type")]
        public string Type { get; set; }
        [Column("pictoUid")]
        public string PictoUid { get; set; }
        [Column("stealthy")]
        public bool Stealthy { get; set; }
    }
}
