using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MyHordesOptimizerApi.Models
{
    [Table("Category")]
    public class CategoryModel
    {
        [Key]
        [Column("idCategory")]
        public int IdCategory { get; set; }
        [Column("name")]
        public string Name { get; set; }
        [Column("label_fr")]
        public string LabelFr { get; set; }
        [Column("label_en")]
        public string LabelEn { get; set; }
        [Column("label_es")]
        public string LabelEs { get; set; }
        [Column("label_de")]
        public string LabelDe { get; set; }
        [Column("ordering")]
        public int Ordering { get; set; }
    }
}
