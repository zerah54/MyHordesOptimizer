using System;
using System.Collections.Generic;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.WishList;

public class UserWishListGroupDto
{
    public int Id { get; set; }
    public string Name { get; set; } = null!;
    public List<string> ItemUids { get; set; } = new();
    public DateTime UpdatedAt { get; set; }
}

public class UpsertUserWishListGroupRequestDto
{
    public string Name { get; set; } = null!;
    public List<string> ItemUids { get; set; } = null!;
}
