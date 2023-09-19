using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MyHordesOptimizerApi.Models
{
    [Table("CauseOfDeath")]
    public class CauseOfDeathModel
    {
        [Key]
        [Column("dtype")]
        public int Dtype { get; set; }
        [Column("ref")]
        public string Ref { get; set; }
        [Column("description_fr")]
        public string DescriptionFr { get; set; }
        [Column("description_en")]
        public string DescriptionEn { get; set; }
        [Column("description_es")]
        public string DescriptionEs { get; set; }
        [Column("description_de")]
        public string DescriptionDe { get; set; }
        [Column("icon")]
        public string Icon { get; set; }
        [Column("label_fr")]
        public string LabelFr { get; set; }
        [Column("label_en")]
        public string LabelEn { get; set; }
        [Column("label_es")]
        public string LabelEs { get; set; }
        [Column("label_de")]
        public string LabelDe { get; set; }
    }
}
