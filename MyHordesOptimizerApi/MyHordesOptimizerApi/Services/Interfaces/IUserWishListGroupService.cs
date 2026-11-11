using System.Collections.Generic;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.WishList;

namespace MyHordesOptimizerApi.Services.Interfaces;

/// <summary>Groupes perso d'un utilisateur dans sa liste de courses : liste figée d'uid d'objets.</summary>
public interface IUserWishListGroupService
{
    List<UserWishListGroupDto> GetMine(int userId);
    UserWishListGroupDto Create(int userId, UpsertUserWishListGroupRequestDto request);
    UserWishListGroupDto Update(int userId, int groupId, UpsertUserWishListGroupRequestDto request);
    void Delete(int userId, int groupId);
}
