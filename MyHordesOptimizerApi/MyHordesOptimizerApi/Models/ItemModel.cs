using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MyHordesOptimizerApi.Models
{
    [Table("Item")]
    public class ItemModel
    {
        [Key]
        [Column("idItem")]
        public int IdItem { get; set; }
        [Column("idCategory")]
        public int IdCategory { get; set; }
        [Column("uid")]
        public string Uid { get; set; }
        [Column("deco")]
        public int Deco { get; set; }
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
        [Column("guard")]
        public int Guard { get; set; }
        [Column("img")]
        public string Img { get; set; }
        [Column("isHeaver")]
        public bool IsHeaver { get; set; }

    }
}
