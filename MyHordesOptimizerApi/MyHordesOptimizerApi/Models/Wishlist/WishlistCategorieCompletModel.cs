using System.Collections.Generic;

namespace MyHordesOptimizerApi.Models.Wishlist
{
    public class WishlistCategorieCompletModel
    {
        public int IdCategory { get; set; }
        public int? IdUserAuthor { get; set; }
        public string Name { get; set; }
        public string LabelFr { get; set; }
        public string LabelEn { get; set; }
        public string LabelEs { get; set; }
        public string LabelDe { get; set; }
        public int IdItem { get; set; }
    }
}
