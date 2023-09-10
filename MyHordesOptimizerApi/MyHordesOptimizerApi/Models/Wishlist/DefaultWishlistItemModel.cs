using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace MyHordesOptimizerApi.Models.Wishlist
{
    [Table("DefaultWishlistItem")]
    public class DefaultWishlistItemModel
    {
        public int IdDefaultWishlist { get; set; }
        public int IdItem { get; set; }
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
        public int Count { get; set; }
        public int Priority { get; set; }
        public int ZoneXPa { get; set; }
        [Column("depot")]
        public int Depot { get; set; }
        [Column("shouldSignal")]
        public bool ShouldSignal { get; set; }
    }
}
