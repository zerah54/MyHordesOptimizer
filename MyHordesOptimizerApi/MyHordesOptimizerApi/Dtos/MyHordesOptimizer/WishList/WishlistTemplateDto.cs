using System.Collections.Generic;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.WishList
{
    public class WishlistTemplateDto
    {
        public int IdTemplate { get; set; }
        public int? IdUserAuthor { get; set; }
        public string Name { get; set; }
        public Dictionary<string, string> Labels { get; set; }
        public List<WishListItemDto> Items { get; set; }

        public WishlistTemplateDto()
        {
            Labels = new Dictionary<string, string>();
            Items = new List<WishListItemDto>();
        }
    }
}
