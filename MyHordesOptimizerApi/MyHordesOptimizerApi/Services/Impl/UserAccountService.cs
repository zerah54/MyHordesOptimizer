using System.Collections.Generic;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Models;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.UserAccount;
using MyHordesOptimizerApi.Exceptions;
using MyHordesOptimizerApi.Services.Interfaces;

namespace MyHordesOptimizerApi.Services.Impl;

public class UserAccountService : IUserAccountService
{
    protected ILogger<UserAccountService> Logger { get; init; }
    protected MhoContext DbContext { get; init; }

    public UserAccountService(ILogger<UserAccountService> logger, MhoContext dbContext)
    {
        Logger = logger;
        DbContext = dbContext;
    }

    /// <summary>
    /// Annuaire des citoyens. Lecture pure : aucun appel MyHordes ici, la table est peuplée par les
    /// imports et les synchros. Les compteurs lus sont dénormalisés sur Users
    /// (RecomputeUserDirectoryStats) : un COUNT/MAX joint par page ne tiendrait pas à l'échelle.
    /// </summary>
    public CitizenListPageResultDto GetCitizens(CitizenListQueryDto query)
    {
        var filtered = DbContext.Users.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(query.Name))
        {
            var name = query.Name.Trim();
            filtered = filtered.Where(user => EF.Functions.Like(user.Name, $"%{name}%"));
        }
        if (query.SharedWithPlayerId.HasValue)
        {
            var playerId = query.SharedWithPlayerId.Value;
            filtered = filtered.Where(user => user.IdUser != playerId
                && user.TownCitizens.Any(citizen =>
                    citizen.IdTownNavigation.TownCitizens.Any(other => other.IdUser == playerId)));
        }

        var totalCount = filtered.Count();

        var page = query.Page < 1 ? 1 : query.Page;
        var pageSize = query.PageSize is < 1 or > 500 ? 50 : query.PageSize;

        var citizens = ApplySort(filtered, query.SortColumn, query.SortDirection)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(user => new CitizenListItemDto
            {
                Id = user.IdUser,
                Name = user.Name,
                Avatar = user.Avatar,
                NbTownsPlayed = user.NbTownsPlayed,
                BestSurvival = user.BestSurvival,
                LastTownId = user.LastTownId
            })
            .ToList();

        // Dernière ville chargée à part puis composée en mémoire (limitée à la page) : lastTownId n'a
        // pas de FK vers Town, une projection corrélée coûterait une sous-requête par ligne.
        var lastTownIds = citizens
            .Where(citizen => citizen.LastTownId.HasValue)
            .Select(citizen => citizen.LastTownId!.Value)
            .Distinct()
            .ToList();
        if (lastTownIds.Count > 0)
        {
            var towns = DbContext.Towns
                .Where(town => lastTownIds.Contains(town.IdTown))
                .Select(town => new { town.IdTown, town.Name, town.Season })
                .ToDictionary(town => town.IdTown);
            foreach (var citizen in citizens.Where(citizen => citizen.LastTownId.HasValue))
            {
                if (towns.TryGetValue(citizen.LastTownId!.Value, out var town))
                {
                    citizen.LastTownName = town.Name;
                    citizen.LastTownSeason = town.Season;
                }
            }
        }

        return new CitizenListPageResultDto { Items = citizens, TotalCount = totalCount };
    }

    // Le tri se limite aux colonnes indexées/dénormalisées : trier sur un agrégat calculé à la volée
    // ferait s'effondrer la pagination. Défaut : les joueurs les plus actifs d'abord.
    private static IQueryable<User> ApplySort(IQueryable<User> query, string? column, string? direction)
    {
        // Départage stable en ThenBy : sans second critère, la pagination peut répéter ou sauter des
        // lignes, les valeurs dénormalisées étant très souvent à égalité (beaucoup de joueurs à 1 ville).
        if (string.IsNullOrWhiteSpace(column))
        {
            return query.OrderByDescending(user => user.NbTownsPlayed).ThenBy(user => user.IdUser);
        }

        var desc = string.Equals(direction, "desc", System.StringComparison.OrdinalIgnoreCase);
        IOrderedQueryable<User> ordered = column.ToLowerInvariant() switch
        {
            "name" => desc ? query.OrderByDescending(user => user.Name) : query.OrderBy(user => user.Name),
            "bestsurvival" => desc ? query.OrderByDescending(user => user.BestSurvival) : query.OrderBy(user => user.BestSurvival),
            "lasttown" => desc ? query.OrderByDescending(user => user.LastTownId) : query.OrderBy(user => user.LastTownId),
            "nbtownsplayed" => desc ? query.OrderByDescending(user => user.NbTownsPlayed) : query.OrderBy(user => user.NbTownsPlayed),
            _ => query.OrderByDescending(user => user.NbTownsPlayed),
        };
        return ordered.ThenBy(user => user.IdUser);
    }

    public UserAccountPublicDto GetPublicProfile(int userId)
    {
        var user = DbContext.Users
            .Where(u => u.IdUser == userId)
            .Select(u => new UserAccountPublicDto
            {
                Id = u.IdUser,
                UserName = u.Name,
                Avatar = u.Avatar,
                ImportedAt = u.PictosHistoryImportedAt
            })
            .SingleOrDefault();

        if (user is null)
        {
            throw new MhoTechnicalException($"Utilisateur introuvable : {userId}");
        }

        return user;
    }

    /// <summary>
    /// Pictos d'un joueur, lus uniquement en base : aucun appel à MyHordes ici, l'affichage doit
    /// rester disponible quand leur API ne l'est pas (attaque).
    /// Sans <paramref name="townId"/>, renvoie le total du joueur (UserPicto). Avec, se restreint
    /// aux pictos gagnés dans cette ville (TownCitizenPicto) en conservant le total de chacun.
    /// <paramref name="townId"/> est un mapId, comme partout depuis le client : il doit passer par
    /// ResolveTownId pour retrouver la ligne Town, provisoire (-mapId) ou migrée.
    /// </summary>
    public UserPictosDto GetPictos(int userId, int? townId)
    {
        var user = DbContext.Users
            .Where(u => u.IdUser == userId)
            .Select(u => new { u.IdUser, u.PictosHistoryImportedAt })
            .SingleOrDefault();

        if (user is null)
        {
            throw new MhoTechnicalException($"Utilisateur introuvable : {userId}");
        }

        var totalByPictoId = DbContext.UserPictos
            .Where(userPicto => userPicto.IdUser == userId)
            .ToDictionary(userPicto => userPicto.IdPicto, userPicto => userPicto.Count);

        var resolvedTownId = townId.HasValue ? DbContext.ResolveTownId(townId.Value) : (int?)null;
        var countInTownByPictoId = resolvedTownId.HasValue
            ? DbContext.TownCitizenPictos
                .Where(townPicto => townPicto.IdUser == userId && townPicto.IdTown == resolvedTownId.Value)
                .ToDictionary(townPicto => townPicto.IdPicto, townPicto => townPicto.Count)
            : new Dictionary<int, int>();

        // Une ville peut contenir un picto absent du total (total jamais importé) et le total peut
        // contenir des pictos gagnés dans des villes qu'on n'a jamais vues : on part de l'union.
        var pictoIds = townId.HasValue
            ? countInTownByPictoId.Keys.ToList()
            : totalByPictoId.Keys.ToList();

        var pictos = DbContext.Pictos
            .Where(picto => pictoIds.Contains(picto.IdPicto))
            .ToList()
            .Select(picto => new UserPictoDto()
            {
                Id = picto.IdPicto,
                Img = picto.Img,
                Rare = picto.Rare,
                Label = new Dictionary<string, string?>()
                {
                    { "fr", picto.NameFr },
                    { "en", picto.NameEn },
                    { "es", picto.NameEs },
                    { "de", picto.NameDe }
                },
                Description = new Dictionary<string, string?>()
                {
                    { "fr", picto.DescFr },
                    { "en", picto.DescEn },
                    { "es", picto.DescEs },
                    { "de", picto.DescDe }
                },
                Count = totalByPictoId.TryGetValue(picto.IdPicto, out var total) ? total : 0,
                CountInTown = townId.HasValue
                    ? countInTownByPictoId.TryGetValue(picto.IdPicto, out var inTown) ? inTown : 0
                    : null
            })
            .OrderByDescending(picto => townId.HasValue ? picto.CountInTown : picto.Count)
            .ThenBy(picto => picto.Id)
            .ToList();

        return new UserPictosDto()
        {
            HistoryImportedAt = user.PictosHistoryImportedAt,
            Pictos = pictos
        };
    }
}
