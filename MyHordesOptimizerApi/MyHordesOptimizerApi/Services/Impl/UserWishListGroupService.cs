using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.WishList;
using MyHordesOptimizerApi.Exceptions;
using MyHordesOptimizerApi.Models;
using MyHordesOptimizerApi.Services.Interfaces;

namespace MyHordesOptimizerApi.Services.Impl;

public class UserWishListGroupService : IUserWishListGroupService
{
    private const int MaxNameLength = 64;

    private readonly MhoContext _dbContext;

    public UserWishListGroupService(MhoContext dbContext)
    {
        _dbContext = dbContext;
    }

    public List<UserWishListGroupDto> GetMine(int userId)
    {
        return _dbContext.UserWishListGroups
            .Where(g => g.IdUser == userId)
            .OrderBy(g => g.Name)
            .AsEnumerable()
            .Select(ToDto)
            .ToList();
    }

    public UserWishListGroupDto Create(int userId, UpsertUserWishListGroupRequestDto request)
    {
        var (name, uids) = Validate(request);
        EnsureNameFree(userId, name, null);

        var group = new UserWishListGroup
        {
            IdUser = userId,
            Name = name,
            ItemUids = JsonSerializer.Serialize(uids),
            UpdatedAt = DateTime.UtcNow
        };
        _dbContext.UserWishListGroups.Add(group);
        _dbContext.SaveChanges();
        return ToDto(group);
    }

    public UserWishListGroupDto Update(int userId, int groupId, UpsertUserWishListGroupRequestDto request)
    {
        var group = FindOwned(userId, groupId);
        var (name, uids) = Validate(request);
        EnsureNameFree(userId, name, groupId);

        group.Name = name;
        group.ItemUids = JsonSerializer.Serialize(uids);
        group.UpdatedAt = DateTime.UtcNow;
        _dbContext.SaveChanges();
        return ToDto(group);
    }

    public void Delete(int userId, int groupId)
    {
        _dbContext.UserWishListGroups.Remove(FindOwned(userId, groupId));
        _dbContext.SaveChanges();
    }

    /// <summary>Valide nom et uid ; renvoie le nom sans espaces de bord et les uid dédoublonnés.</summary>
    private (string name, List<string> uids) Validate(UpsertUserWishListGroupRequestDto request)
    {
        var name = request.Name?.Trim() ?? string.Empty;
        if (name.Length is 0 or > MaxNameLength)
        {
            throw new MhoBadRequestException($"Le nom doit contenir de 1 à {MaxNameLength} caractères.");
        }
        var uids = (request.ItemUids ?? new List<string>()).Distinct().ToList();
        if (uids.Count == 0)
        {
            throw new MhoBadRequestException("Un groupe doit contenir au moins un objet.");
        }
        var known = _dbContext.Items.Where(i => i.Uid != null && uids.Contains(i.Uid)).Select(i => i.Uid!).ToHashSet();
        var unknown = uids.Where(u => !known.Contains(u)).ToList();
        if (unknown.Count > 0)
        {
            throw new MhoBadRequestException($"Objets inconnus : {string.Join(", ", unknown)}.");
        }
        return (name, uids);
    }

    private void EnsureNameFree(int userId, string name, int? exceptGroupId)
    {
        if (_dbContext.UserWishListGroups.Any(g => g.IdUser == userId && g.Name == name && g.IdUserWishListGroup != exceptGroupId))
        {
            throw new MhoConflictException("Un groupe porte déjà ce nom.");
        }
    }

    private UserWishListGroup FindOwned(int userId, int groupId)
    {
        return _dbContext.UserWishListGroups.SingleOrDefault(g => g.IdUserWishListGroup == groupId && g.IdUser == userId)
            ?? throw new MhoNotFoundException("Groupe introuvable.");
    }

    private static UserWishListGroupDto ToDto(UserWishListGroup g) => new()
    {
        Id = g.IdUserWishListGroup,
        Name = g.Name,
        ItemUids = JsonSerializer.Deserialize<List<string>>(g.ItemUids) ?? new(),
        UpdatedAt = g.UpdatedAt
    };
}
