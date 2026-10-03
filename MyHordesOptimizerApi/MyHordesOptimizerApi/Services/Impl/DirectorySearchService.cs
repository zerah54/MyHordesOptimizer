using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Search;
using MyHordesOptimizerApi.Models;
using MyHordesOptimizerApi.Services.Interfaces;

namespace MyHordesOptimizerApi.Services.Impl
{
    /// <summary>
    /// Recherche globale du site sur l'annuaire. Les tables sont trop grandes pour être envoyées au
    /// navigateur : la recherche se fait ici, sur un nombre borné de résultats. Le total n'est compté
    /// que si la page est pleine, sinon il est connu sans requête de plus.
    /// </summary>
    public class DirectorySearchService : IDirectorySearchService
    {
        public const int MinQueryLength = 2;
        public const int DefaultLimit = 5;
        public const int MaxLimit = 50;

        /// <summary>Caractère d'échappement des motifs LIKE : la saisie peut contenir « % » ou « _ ».</summary>
        private const string LikeEscape = "\\";

        private readonly MhoContext _dbContext;

        public DirectorySearchService(MhoContext dbContext)
        {
            _dbContext = dbContext;
        }

        public DirectorySearchResultDto Search(string? query, int? limit)
        {
            var result = new DirectorySearchResultDto();
            var term = query?.Trim() ?? string.Empty;
            if (term.Length < MinQueryLength)
            {
                return result;
            }

            var take = ClampLimit(limit);
            var escaped = EscapeLikePattern(term);
            var contains = $"%{escaped}%";
            var prefix = $"{escaped}%";
            var wordStart = $"% {escaped}%";

            // Interclassement utf8mb4_general_ci : LIKE ignore déjà la casse et les accents.
            var players = _dbContext.Users.AsNoTracking()
                .Where(user => EF.Functions.Like(user.Name, contains, LikeEscape));
            var playerItems = players
                .OrderBy(user => EF.Functions.Like(user.Name, prefix, LikeEscape) ? 0 : EF.Functions.Like(user.Name, wordStart, LikeEscape) ? 1 : 2)
                .ThenBy(user => user.Name.Length)
                .ThenBy(user => user.Name)
                .Take(take)
                .Select(user => new PlayerSearchItemDto { Id = user.IdUser, Name = user.Name, Avatar = user.Avatar })
                .ToList();
            result.Players = new DirectorySearchGroupDto<PlayerSearchItemDto>
            {
                Items = playerItems,
                Total = playerItems.Count < take ? playerItems.Count : players.Count()
            };

            // Les noms de ville se répètent d'une saison à l'autre : à qualité égale, les plus récentes d'abord.
            var towns = _dbContext.Towns.AsNoTracking()
                .Where(town => town.MapId != null && town.Name != null && EF.Functions.Like(town.Name, contains, LikeEscape));
            var townItems = towns
                .OrderBy(town => EF.Functions.Like(town.Name!, prefix, LikeEscape) ? 0 : EF.Functions.Like(town.Name!, wordStart, LikeEscape) ? 1 : 2)
                .ThenByDescending(town => town.Season)
                .ThenByDescending(town => town.IdTown)
                .Take(take)
                .Select(town => new TownSearchItemDto
                {
                    Id = town.IdTown,
                    MapId = town.MapId!.Value,
                    Name = town.Name!,
                    TownType = town.TownTypeId.HasValue ? (TownType)town.TownTypeId.Value : (TownType?)null,
                    Season = town.Season,
                    Phase = town.PhaseId.HasValue ? (TownPhase)town.PhaseId.Value : (TownPhase?)null,
                    Language = town.Language,
                    IsChaos = town.IsChaos,
                    IsDevasted = town.IsDevasted,
                    IsFinished = town.IsFinished
                })
                .ToList();
            result.Towns = new DirectorySearchGroupDto<TownSearchItemDto>
            {
                Items = townItems,
                Total = townItems.Count < take ? townItems.Count : towns.Count()
            };

            return result;
        }

        /// <summary>Nombre de résultats par groupe : <see cref="DefaultLimit"/> par défaut, au plus <see cref="MaxLimit"/>.</summary>
        public static int ClampLimit(int? limit)
        {
            return limit is null or < 1 ? DefaultLimit : Math.Min(limit.Value, MaxLimit);
        }

        /// <summary>Échappe les jokers de LIKE : la saisie est cherchée telle quelle.</summary>
        public static string EscapeLikePattern(string term)
        {
            return term.Replace(LikeEscape, LikeEscape + LikeEscape)
                .Replace("%", LikeEscape + "%")
                .Replace("_", LikeEscape + "_");
        }
    }
}
