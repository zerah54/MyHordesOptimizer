using System.Collections.Generic;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.WishList
{
    /// <summary>Corps du PUT /WishList : la liste complète, objets et groupes. Champs non nullables donc obligatoires.</summary>
    public class WishListPutBodyDto
    {
        public List<WishListPutResquestDto> Items { get; set; } = null!;
        public List<WishListGroupDto> Groups { get; set; } = null!;
    }
}
