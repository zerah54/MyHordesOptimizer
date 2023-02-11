using System.Collections.Generic;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.WishList
{
    public class WishlistCategorieDto
    {
        public int IdCategory { get; set; }
        public int? IdUserAuthor { get; set; }
        public string Name { get; set; }
        public Dictionary<string, string> Labels {get;set;}
        public List<int> Items { get; set; }

        public WishlistCategorieDto()
        {
            Labels = new Dictionary<string, string>();
            Items = new List<int>();
        }
    }
}
