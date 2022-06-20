using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MyHordesOptimizerApi.Models
{
    [Table("Ruin")]
    public class RuinModel
    {
        [Key]
        [Column("idRuin")]
        public int IdRuin { get; set; }
        [Column("label_fr")]
        public string LabelFr { get; set; }
        [Column("label_en")]
        public string LabelEn { get; set; }
        [Column("label_es")]
        public string LabelEs { get; set; }
        [Column("label_de")]
        public string LabelDe { get; set; }
        [Column("description_fr")]
        public string DescriptionFr { get; set; }
        [Column("description_en")]
        public string DescriptionEn { get; set; }
        [Column("description_es")]
        public string DescriptionEs { get; set; }
        [Column("description_de")]
        public string DescriptionDe { get; set; }
        [Column("explorable")]
        public bool Explorable { get; set; }
        [Column("img")]
        public string Img { get; set; }
        [Column("camping")]
        public int Camping { get; set; }
        [Column("minDist")]
        public int MinDist { get; set; }
        [Column("maxDist")]
        public int MaxDist { get; set; }
        [Column("chance")]
        public int Chance { get; set; }
    }
}
