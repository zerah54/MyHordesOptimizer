using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Citizens;
using MyHordesOptimizerApi.Exceptions;
using MyHordesOptimizerApi.Extensions;
using MyHordesOptimizerApi.Models;
using MyHordesOptimizerApi.Providers.Interfaces;
using MyHordesOptimizerApi.Repository.Interfaces;
using MyHordesOptimizerApi.Services.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;

namespace MyHordesOptimizerApi.Services.Impl
{
    public class TownService : ITownService
    {
        protected ILogger<TownService> Logger { get; init; }
        protected IMapper Mapper { get; init; }
        protected IUserInfoProvider UserInfoProvider { get; init; }
        protected MhoContext DbContext { get; init; }
        protected IMyHordesApiRepository MyHordesApiRepository { get; init; }

        public TownService(ILogger<TownService> logger,
            IMapper mapper,
            IUserInfoProvider userInfoProvider,
            MhoContext dbContext,
            IMyHordesApiRepository myHordesApiRepository)
        {
            Logger = logger;
            Mapper = mapper;
            UserInfoProvider = userInfoProvider;
            DbContext = dbContext;
            MyHordesApiRepository = myHordesApiRepository;
        }

        public CitizenDto GetTownCitizen(int townId, int userId)
        {
            townId = DbContext.ResolveTownId(townId);
            var citizen = DbContext.GetTownCitizen(townId)
                .Where(townCitizen => townCitizen.IdUser == userId)
                .SingleOrDefault();
            if (citizen == null)
            {
                var cadaver = DbContext.TownCadavers.Where(cadaver => cadaver.IdTown == townId)
                    .Where(cadaver => cadaver.IdUser == userId)
                    .Include(cadaver => cadaver.IdUserNavigation)
                    .FirstOrDefault();
                if (cadaver is null)
                {
                    throw new MhoTechnicalException($"Aucun citizen ou cadavre trouvé pour la ville {townId} et l'utilisateur {userId}");
                }
                else
                {
                    throw new MhoFunctionalException($"Le citoyen {cadaver.IdUserNavigation.Name} est décédé !", FunctionErrorCode.DeadCitizen);
                }
            }
            if (citizen.Dead == true)
            {
                // Le TownCitizen d'un mort est conservé en base (historique) : même réponse
                // que lorsqu'on ne trouve que le cadavre
                throw new MhoFunctionalException($"Le citoyen {citizen.IdUserNavigation.Name} est décédé !", FunctionErrorCode.DeadCitizen);
            }
            var citizenDto = Mapper.Map<CitizenDto>(citizen);
            return citizenDto;
        }

        public LastUpdateInfoDto AddCitizenBath(int townId, int userId, int day)
        {
            townId = DbContext.ResolveTownId(townId);
            var bath = DbContext.TownCitizenBaths
                .Where(townCitizenBath => townCitizenBath.IdTown == townId)
                .Where(townCitizenBath => townCitizenBath.IdUser == userId)
                .Where(townCitizenBath => townCitizenBath.Day == day)
                .Include(townCitizenBath => townCitizenBath.IdLastUpdateInfoNavigation)
                    .ThenInclude(lastUpdateInfo => lastUpdateInfo.IdUserNavigation)
                .FirstOrDefault();
            LastUpdateInfoDto result;
            if (bath == null)
            {
                DbContext.ChangeTracker.Clear();
                using var transaction = DbContext.Database.BeginTransaction();
                var lastUpdateInfoDto = UserInfoProvider.GenerateLastUpdateInfo();
                result = lastUpdateInfoDto;
                var newLastUpdate = DbContext.LastUpdateInfos.Update(Mapper.Map<LastUpdateInfo>(lastUpdateInfoDto, opt => opt.SetDbContext(DbContext))).Entity;
                DbContext.SaveChanges();
                DbContext.ChangeTracker.Clear();
                bath = new TownCitizenBath()
                {
                    Day = day,
                    IdUser = userId,
                    IdTown = townId,
                    IdLastUpdateInfo = newLastUpdate.IdLastUpdateInfo
                };
                DbContext.Add(bath);
                DbContext.SaveChanges();
                transaction.Commit();
            }
            else
            {
                result = Mapper.Map<LastUpdateInfoDto>(bath.IdLastUpdateInfoNavigation);
            }
            return result;
        }

        public CitizenDto DeleteCitizenBath(int townId, int userId, int day)
        {
            townId = DbContext.ResolveTownId(townId);
            var bath = DbContext.TownCitizenBaths
               .Where(townCitizenBath => townCitizenBath.IdTown == townId)
               .Where(townCitizenBath => townCitizenBath.IdUser == userId)
               .Where(townCitizenBath => townCitizenBath.Day == day)
               .FirstOrDefault();
            if (bath != null)
            {
                DbContext.Remove(bath);
                DbContext.SaveChanges();
            }
            return GetTownCitizen(townId, userId);
        }

        public LastUpdateInfoDto UpdateCitizenChamanicDetail(int townId, int userId, CitizenChamanicDetailDto chamanicDetailDto)
        {
            townId = DbContext.ResolveTownId(townId);
            var citizen = DbContext.TownCitizens.Where(townCitizen => townCitizen.IdTown == townId)
                 .Where(townCitizen => townCitizen.IdUser == userId)
                 .Include(townCitizen => townCitizen.IdLastUpdateChamanicNavigation)
                 .ThenInclude(lastUpdate => lastUpdate.IdUserNavigation)
                 .Single();
            DbContext.ChangeTracker.Clear();

            using var transaction = DbContext.Database.BeginTransaction();
            LastUpdateInfoDto lastUpdateInfoDto = UserInfoProvider.GenerateLastUpdateInfo();
            var newLastUpdate = DbContext.LastUpdateInfos.Update(Mapper.Map<LastUpdateInfo>(lastUpdateInfoDto, opt => opt.SetDbContext(DbContext))).Entity;
            DbContext.SaveChanges();
            DbContext.ChangeTracker.Clear();

            citizen.IsImmuneToSoul = chamanicDetailDto.IsImmuneToSoul;
            citizen.NbPotionChamanique = chamanicDetailDto.NbPotionChaman;
            citizen.IdLastUpdateChamanic = newLastUpdate.IdLastUpdateInfo;
            DbContext.Update(citizen);
            DbContext.SaveChanges();
            transaction.Commit();

            return lastUpdateInfoDto;
        }

        public List<SeasonDto> GetSeasons()
        {
            var townSeasons = DbContext.Towns
                .Where(t => t.Season.HasValue)
                .Select(t => t.Season!.Value)
                .Distinct()
                .ToList();

            var seasonEntities = DbContext.Seasons
                .Where(s => townSeasons.Contains(s.IdSeason))
                .ToList();

            return townSeasons
                .OrderByDescending(s => s)
                .Select(s => new SeasonDto
                {
                    Id = s,
                    IsFinished = seasonEntities.FirstOrDefault(se => se.IdSeason == s)?.IsFinished ?? false
                })
                .ToList();
        }

        public List<SeasonPhaseDto> GetSeasonPhases()
        {
            var nativeId = (int)TownPhase.NATIVE;

            var combos = DbContext.Towns
                .Where(t => t.Season.HasValue)
                .Select(t => new { Season = t.Season!.Value, t.PhaseId })
                .Distinct()
                .ToList();

            var finishedSeasons = DbContext.Seasons
                .Where(s => s.IsFinished)
                .Select(s => s.IdSeason)
                .ToHashSet();

            return combos
                // Coalescence null -> NATIVE : phase inconnue et native forment une seule combinaison « SX »
                .Select(c => new { c.Season, Phase = (TownPhase)(c.PhaseId ?? nativeId) })
                .GroupBy(c => new { c.Season, c.Phase })
                .Select(g => new SeasonPhaseDto
                {
                    Season = g.Key.Season,
                    Phase = g.Key.Phase,
                    IsFinished = finishedSeasons.Contains(g.Key.Season)
                })
                .OrderByDescending(sp => sp.Season)
                .ThenBy(sp => sp.Phase == TownPhase.NATIVE ? 0 : 1)
                .ThenBy(sp => sp.Phase)
                .ToList();
        }

        public void DeleteTown(int townId)
        {
            using var transaction = DbContext.Database.BeginTransaction();
            DbContext.Database.ExecuteSqlRaw("SET FOREIGN_KEY_CHECKS = 0");

            DbContext.Database.ExecuteSqlRaw("DELETE FROM TownEstimation WHERE idTown = {0}", townId);
            DbContext.Database.ExecuteSqlRaw("DELETE FROM TownWishListItem WHERE idTown = {0}", townId);
            DbContext.Database.ExecuteSqlRaw("DELETE FROM TownBankItem WHERE idTown = {0}", townId);
            DbContext.Database.ExecuteSqlRaw("DELETE FROM TownCitizenBath WHERE idTown = {0}", townId);
            DbContext.Database.ExecuteSqlRaw("DELETE FROM TownCadaver WHERE idTown = {0}", townId);
            DbContext.Database.ExecuteSqlRaw("DELETE FROM TownCitizen WHERE idTown = {0}", townId);
            DbContext.Database.ExecuteSqlRaw("DELETE FROM MapCellDigUpdate WHERE idTown = {0}", townId);
            DbContext.Database.ExecuteSqlRaw("DELETE FROM MapCellDig WHERE idCell IN (SELECT idCell FROM MapCell WHERE idTown = {0})", townId);
            DbContext.Database.ExecuteSqlRaw("DELETE FROM MapCellItem WHERE idCell IN (SELECT idCell FROM MapCell WHERE idTown = {0})", townId);
            DbContext.Database.ExecuteSqlRaw("DELETE FROM MapCell WHERE idTown = {0}", townId);
            DbContext.Database.ExecuteSqlRaw("DELETE FROM ExpeditionOrder WHERE idExpeditionCitizen IN (SELECT idExpeditionCitizen FROM ExpeditionCitizen WHERE idExpeditionPart IN (SELECT idExpeditionPart FROM ExpeditionPart WHERE idExpedition IN (SELECT idExpedition FROM Expedition WHERE idTown = {0})))", townId);
            DbContext.Database.ExecuteSqlRaw("DELETE FROM ExpeditionBagItem WHERE idExpeditionBag IN (SELECT idExpeditionBag FROM ExpeditionCitizen WHERE idExpeditionPart IN (SELECT idExpeditionPart FROM ExpeditionPart WHERE idExpedition IN (SELECT idExpedition FROM Expedition WHERE idTown = {0})))", townId);
            DbContext.Database.ExecuteSqlRaw("DELETE FROM ExpeditionBag WHERE idExpeditionBag IN (SELECT idExpeditionBag FROM ExpeditionCitizen WHERE idExpeditionPart IN (SELECT idExpeditionPart FROM ExpeditionPart WHERE idExpedition IN (SELECT idExpedition FROM Expedition WHERE idTown = {0})))", townId);
            DbContext.Database.ExecuteSqlRaw("DELETE FROM ExpeditionCitizen WHERE idExpeditionPart IN (SELECT idExpeditionPart FROM ExpeditionPart WHERE idExpedition IN (SELECT idExpedition FROM Expedition WHERE idTown = {0}))", townId);
            DbContext.Database.ExecuteSqlRaw("DELETE FROM ExpeditionPart WHERE idExpedition IN (SELECT idExpedition FROM Expedition WHERE idTown = {0})", townId);
            DbContext.Database.ExecuteSqlRaw("DELETE FROM Expedition WHERE idTown = {0}", townId);
            DbContext.Database.ExecuteSqlRaw("DELETE FROM Town WHERE idTown = {0}", townId);

            DbContext.Database.ExecuteSqlRaw("SET FOREIGN_KEY_CHECKS = 1");
            transaction.Commit();
        }

        public void FinishSeason(int season)
        {
            var existing = DbContext.Seasons.Find(season);
            if (existing == null)
            {
                DbContext.Seasons.Add(new Season { IdSeason = season, IsFinished = true });
            }
            else
            {
                existing.IsFinished = true;
            }
            DbContext.SaveChanges();
        }

        public void UnfinishSeason(int season)
        {
            var existing = DbContext.Seasons.Find(season);
            if (existing == null)
            {
                DbContext.Seasons.Add(new Season { IdSeason = season, IsFinished = false });
            }
            else
            {
                existing.IsFinished = false;
            }
            DbContext.SaveChanges();
        }

        public TownListPageResultDto GetTowns(TownListQueryDto query)
        {
            // Lecture pure : aucune récupération MyHordes ici. Le peuplement des villes est fait
            // explicitement (import) ou par les synchros /me des joueurs, jamais sur ce GET.
            var nativeId = (int)TownPhase.NATIVE;

            // Base = combinaison saison/phase. Sert aussi de référence aux options de filtres disponibles.
            var baseQuery = DbContext.Towns.AsQueryable();
            if (query.PlayerId.HasValue)
            {
                var playerId = query.PlayerId.Value;
                baseQuery = baseQuery.Where(town => town.TownCitizens.Any(citizen => citizen.IdUser == playerId));
            }
            if (query.Season.HasValue)
            {
                baseQuery = baseQuery.Where(town => town.Season == query.Season.Value);
            }
            if (query.Phase.HasValue)
            {
                var phaseId = (int)query.Phase.Value;
                // Coalescence null -> NATIVE : une phase inconnue est regroupée avec les villes natives
                baseQuery = phaseId == nativeId
                    ? baseQuery.Where(town => town.PhaseId == null || town.PhaseId == nativeId)
                    : baseQuery.Where(town => town.PhaseId == phaseId);
            }

            // Options disponibles calculées sur toute la combinaison (indépendamment des autres filtres)
            var availableTypes = baseQuery
                .Where(town => town.TownTypeId != null)
                .Select(town => town.TownTypeId!.Value)
                .Distinct()
                .ToList()
                .Select(id => (TownType)id)
                .OrderBy(type => type)
                .ToList();
            var availableLanguages = baseQuery
                .Where(town => town.Language != null)
                .Select(town => town.Language!)
                .Distinct()
                .OrderBy(language => language)
                .ToList();

            // Filtres serveur
            var filtered = baseQuery;
            if (!string.IsNullOrWhiteSpace(query.Name))
            {
                var name = query.Name.Trim();
                filtered = filtered.Where(town => town.Name != null && EF.Functions.Like(town.Name, $"%{name}%"));
            }
            if (!string.IsNullOrWhiteSpace(query.Id))
            {
                var id = query.Id.Trim();
                filtered = filtered.Where(town =>
                    EF.Functions.Like(town.IdTown.ToString(), $"%{id}%")
                    || (town.MapId != null && EF.Functions.Like(town.MapId.Value.ToString(), $"%{id}%")));
            }
            if (query.Types != null && query.Types.Count > 0)
            {
                var typeIds = query.Types.Select(type => (int)type).ToList();
                filtered = filtered.Where(town => town.TownTypeId != null && typeIds.Contains(town.TownTypeId.Value));
            }
            if (query.Languages != null && query.Languages.Count > 0)
            {
                var languages = query.Languages;
                filtered = filtered.Where(town => town.Language != null && languages.Contains(town.Language));
            }
            if (query.States != null && query.States.Count > 0)
            {
                var wantNormal = query.States.Contains("NORMAL");
                var wantChaos = query.States.Contains("CHAOS");
                var wantDevasted = query.States.Contains("DEVASTED");
                var wantFinished = query.States.Contains("FINISHED");
                // Une ville terminée n'expose que l'état « Terminée » : son chaos/dévastation figé
                // au dernier passage n'est plus significatif, elle ne matche donc pas les autres états
                filtered = filtered.Where(town =>
                    (wantFinished && town.IsFinished)
                    || (!town.IsFinished && (
                        (wantDevasted && town.IsDevasted)
                        || (wantChaos && !town.IsDevasted && town.IsChaos)
                        || (wantNormal && !town.IsDevasted && !town.IsChaos))));
            }

            var totalCount = filtered.Count();

            var page = query.Page < 1 ? 1 : query.Page;
            var pageSize = query.PageSize is < 1 or > 500 ? 50 : query.PageSize;

            var towns = ApplySort(filtered, query.SortColumn, query.SortDirection)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(town => new TownListItemDto
                {
                    Id = town.IdTown,
                    MapId = town.MapId,
                    Name = town.Name,
                    Width = town.Width > 0 ? town.Width : (int?)null,
                    Height = town.Height > 0 ? town.Height : (int?)null,
                    TownType = town.TownTypeId.HasValue ? (TownType)town.TownTypeId.Value : (TownType?)null,
                    Season = town.Season,
                    Phase = town.PhaseId.HasValue ? (TownPhase)town.PhaseId.Value : (TownPhase?)null,
                    Language = town.Language,
                    Score = town.Score,
                    IsChaos = town.IsChaos,
                    IsDevasted = town.IsDevasted,
                    IsFinished = town.IsFinished
                })
                .ToList();

            var townIds = towns.Select(t => t.Id).ToList();

            // Citoyens et causes de décès chargés à part puis composés en mémoire (limités à la page) :
            // la projection corrélée (join Users + sous-requête TownCadaver par citoyen)
            // n'est pas traduisible en SQL par Pomelo (OUTER APPLY)
            var citizens = DbContext.TownCitizens
                .Where(c => townIds.Contains(c.IdTown))
                .Select(c => new { c.IdTown, c.IdUser, c.IdUserNavigation.Name, Dead = c.Dead == true })
                .ToList();
            var causesOfDeath = DbContext.TownCadavers
                .Where(c => townIds.Contains(c.IdTown))
                .Select(c => new { c.IdTown, c.IdUser, c.CauseOfDeath })
                .ToDictionary(c => (c.IdTown, c.IdUser), c => c.CauseOfDeath);

            var citizensByTown = citizens.GroupBy(c => c.IdTown).ToDictionary(g => g.Key, g => g.ToList());
            foreach (var town in towns)
            {
                if (citizensByTown.TryGetValue(town.Id, out var townCitizens))
                {
                    town.Citizens = townCitizens.Select(c => new TownPublicCitizenSimpleDto
                    {
                        Id = c.IdUser,
                        Name = c.Name,
                        // Mort sans cadavre connu → 0 : le front interprète tout non-null comme décédé
                        DeathTypeId = c.Dead
                            ? (causesOfDeath.TryGetValue((c.IdTown, c.IdUser), out var cause) ? cause ?? 0 : 0)
                            : (int?)null
                    }).ToList();
                }
            }

            return new TownListPageResultDto
            {
                Items = towns,
                TotalCount = totalCount,
                AvailableTypes = availableTypes,
                AvailableLanguages = availableLanguages
            };
        }

        // Tri serveur avec départage déterministe (idTown) indispensable à une pagination stable
        private static IQueryable<Town> ApplySort(IQueryable<Town> query, string? column, string? direction)
        {
            var desc = string.Equals(direction, "desc", System.StringComparison.OrdinalIgnoreCase);
            IOrderedQueryable<Town> ordered = (column ?? "id").ToLowerInvariant() switch
            {
                "name" => desc ? query.OrderByDescending(t => t.Name) : query.OrderBy(t => t.Name),
                "size" => desc ? query.OrderByDescending(t => t.Width * t.Height) : query.OrderBy(t => t.Width * t.Height),
                "type" => desc ? query.OrderByDescending(t => t.TownTypeId) : query.OrderBy(t => t.TownTypeId),
                "language" => desc ? query.OrderByDescending(t => t.Language) : query.OrderBy(t => t.Language),
                "score" => desc ? query.OrderByDescending(t => t.Score) : query.OrderBy(t => t.Score),
                "citizens" => desc ? query.OrderByDescending(t => t.TownCitizens.Count) : query.OrderBy(t => t.TownCitizens.Count),
                "state" => desc
                    ? query.OrderByDescending(t => t.IsFinished ? 3 : (t.IsDevasted ? 2 : (t.IsChaos ? 1 : 0)))
                    : query.OrderBy(t => t.IsFinished ? 3 : (t.IsDevasted ? 2 : (t.IsChaos ? 1 : 0))),
                _ => desc ? query.OrderByDescending(t => t.MapId ?? t.IdTown) : query.OrderBy(t => t.MapId ?? t.IdTown),
            };
            return ordered.ThenBy(t => t.IdTown);
        }
    }
}
