using System.ComponentModel.DataAnnotations.Schema;

namespace MyHordesOptimizerApi.Models.Wishlist
{
    [Table("Category")]
    public class WishlistCategorieModel
    {
        public int IdCategory { get; set; }
        public int? IdUserAuthor { get; set; }
        public string Name { get; set; }
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
