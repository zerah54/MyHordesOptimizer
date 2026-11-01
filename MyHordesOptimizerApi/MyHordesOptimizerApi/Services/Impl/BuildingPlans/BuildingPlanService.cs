using AutoMapper;
using Microsoft.EntityFrameworkCore;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.BuildingPlans;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.BuildingPlans.Request;
using MyHordesOptimizerApi.Exceptions;
using MyHordesOptimizerApi.Extensions;
using MyHordesOptimizerApi.Models;
using MyHordesOptimizerApi.Providers.Interfaces;
using MyHordesOptimizerApi.Services.Impl.Locking;
using MyHordesOptimizerApi.Services.Interfaces;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MyHordesOptimizerApi.Services.Impl.BuildingPlans
{
    /// <summary>
    /// Règles : lecture et écriture réservées aux citoyens de la ville, vivants ou morts
    /// (<see cref="ITownAccessService"/>) ; un non-citoyen ne reçoit rien. Écriture refusée si la ville est terminée.
    /// </summary>
    public class BuildingPlanService : IBuildingPlanService
    {
        protected MhoContext DbContext { get; init; }
        protected IUserInfoProvider UserInfoProvider { get; init; }
        protected ITownAccessService TownAccessService { get; init; }
        protected TownSyncLock TownSyncLock { get; init; }
        protected IMapper Mapper { get; init; }

        public BuildingPlanService(MhoContext dbContext, IUserInfoProvider userInfoProvider, ITownAccessService townAccessService, TownSyncLock townSyncLock, IMapper mapper)
        {
            DbContext = dbContext;
            UserInfoProvider = userInfoProvider;
            TownAccessService = townAccessService;
            TownSyncLock = townSyncLock;
            Mapper = mapper;
        }

        private sealed record TownInfo(int IdTown, int Day, bool IsFinished);

        public async Task<BuildingPlansDto> GetPlansAsync(int mapId)
        {
            var town = await LoadTownAsync(mapId);
            if (town is null)
            {
                return new BuildingPlansDto();
            }
            var isCitizen = await TownAccessService.CanWriteTownAsync(town.IdTown, mapId);
            var result = new BuildingPlansDto { Access = new BuildingPlanAccessDto { IsCitizen = isCitizen, CanEdit = isCitizen && !town.IsFinished } };
            if (!isCitizen)
            {
                return result;
            }
            var plans = await PlansQuery()
                .Where(plan => plan.IdTown == town.IdTown)
                .OrderBy(plan => plan.Day).ThenBy(plan => plan.IdTownBuildingPlan)
                .ToListAsync();
            var authorNames = await LoadUserNamesAsync(plans.Select(plan => plan.IdAuthor));
            result.Plans = plans.Select(plan => ToDto(plan, authorNames)).ToList();
            var settings = await DbContext.TownBuildingPlanSettings.AsNoTracking().SingleOrDefaultAsync(row => row.IdTown == town.IdTown);
            if (settings is not null)
            {
                result.ItemValues = settings.ItemValues.FromJson<Dictionary<int, int>>() ?? new Dictionary<int, int>();
                result.SettingsVersion = settings.Version;
            }
            return result;
        }

        public async Task<BuildingPlanStateDto> GetStateAsync(int mapId)
        {
            var town = await LoadTownAsync(mapId);
            if (town is null || !await TownAccessService.CanWriteTownAsync(town.IdTown, mapId))
            {
                return new BuildingPlanStateDto();
            }
            var rows = await DbContext.TownBuildings.AsNoTracking().Where(row => row.IdTown == town.IdTown).ToListAsync();
            var defense = await DbContext.TownDefenses.AsNoTracking().SingleOrDefaultAsync(row => row.IdTown == town.IdTown);
            return new BuildingPlanStateDto
            {
                Buildings = rows.Select(ToStateDto).ToList(),
                Defense = defense is null ? null : new TownDefenseStateDto
                {
                    Total = defense.Total, Base = defense.Base, Buildings = defense.Buildings, Upgrades = defense.Upgrades,
                    Items = defense.Items, ItemsMul = defense.ItemsMul, CitizenHomes = defense.CitizenHomes,
                    CitizenGuardians = defense.CitizenGuardians, Watchmen = defense.Watchmen, Souls = defense.Souls,
                    Temp = defense.Temp, Cadavers = defense.Cadavers, Bonus = defense.Bonus
                }
            };
        }

        public async Task<BuildingPlanDto> SavePlanAsync(int mapId, BuildingPlanRequestDto request)
        {
            if (request is null)
            {
                throw new MhoTechnicalException("Proposition absente.");
            }
            await using var townLock = await TownSyncLock.AcquireTownAsync(-mapId);
            var town = await LoadTownOrThrowAsync(mapId);
            await EnsureCanEditAsync(town, mapId);
            var name = BuildingPlanValidator.NormalizeName(request.Name);
            var content = BuildingPlanValidator.SerializeContent(request.Content);
            if (request.Day < 1)
            {
                throw new MhoTechnicalException($"Jour {request.Day} invalide : le premier jour est le 1.");
            }

            await using var transaction = await DbContext.Database.BeginTransactionAsync();
            var newLastUpdate = await NewLastUpdateAsync();
            TownBuildingPlan plan;
            if (request.Id.HasValue)
            {
                plan = await DbContext.TownBuildingPlans.SingleOrDefaultAsync(row => row.IdTownBuildingPlan == request.Id.Value && row.IdTown == town.IdTown)
                    ?? throw new MhoForbiddenException($"La proposition {request.Id} n'appartient pas à la ville {mapId}.");
                if (!request.Version.HasValue)
                {
                    throw new MhoTechnicalException("Version de la proposition absente.");
                }
                if (request.Version.Value != plan.Version)
                {
                    throw new MhoConflictException($"La proposition {plan.IdTownBuildingPlan} a été modifiée entre-temps (version {plan.Version}).");
                }
                if (request.Day != plan.Day)
                {
                    throw new MhoTechnicalException("Le jour d'une proposition existante ne se modifie pas : dupliquer la proposition sur le nouveau jour.");
                }
                plan.Version++;
            }
            else
            {
                var hasEffective = await DbContext.TownBuildingPlans.AnyAsync(row => row.IdTown == town.IdTown && row.Day == request.Day && row.IsEffective);
                plan = new TownBuildingPlan { IdTown = town.IdTown, Day = request.Day, IdAuthor = UserInfoProvider.UserId, IsEffective = !hasEffective };
                DbContext.TownBuildingPlans.Add(plan);
            }
            plan.Name = name;
            plan.Content = content;
            plan.IdLastUpdateInfo = newLastUpdate.IdLastUpdateInfo;
            await SaveOrConflictAsync($"La proposition {request.Id} a été modifiée entre-temps.");
            await transaction.CommitAsync();

            return await LoadPlanDtoAsync(plan.IdTownBuildingPlan);
        }

        public async Task DeletePlanAsync(int mapId, int planId)
        {
            await using var townLock = await TownSyncLock.AcquireTownAsync(-mapId);
            var town = await LoadTownOrThrowAsync(mapId);
            await EnsureCanEditAsync(town, mapId);
            var plan = await DbContext.TownBuildingPlans.SingleOrDefaultAsync(row => row.IdTownBuildingPlan == planId && row.IdTown == town.IdTown)
                ?? throw new MhoForbiddenException($"La proposition {planId} n'appartient pas à la ville {mapId}.");
            DbContext.TownBuildingPlans.Remove(plan);
            await DbContext.SaveChangesAsync();
        }

        public async Task<BuildingPlanDto> SetEffectiveAsync(int mapId, int planId)
        {
            await using var townLock = await TownSyncLock.AcquireTownAsync(-mapId);
            var town = await LoadTownOrThrowAsync(mapId);
            await EnsureCanEditAsync(town, mapId);
            await using var transaction = await DbContext.Database.BeginTransactionAsync();
            var target = await DbContext.TownBuildingPlans.SingleOrDefaultAsync(row => row.IdTownBuildingPlan == planId && row.IdTown == town.IdTown)
                ?? throw new MhoForbiddenException($"La proposition {planId} n'appartient pas à la ville {mapId}.");
            var sameDay = await DbContext.TownBuildingPlans.Where(row => row.IdTown == town.IdTown && row.Day == target.Day).ToListAsync();
            var newLastUpdate = await NewLastUpdateAsync();
            foreach (var plan in sameDay.Where(plan => plan.IsEffective != (plan.IdTownBuildingPlan == planId)))
            {
                // La Version ne bouge pas : seul le contenu est versionné, l'étoile ne doit pas mettre un éditeur en conflit.
                plan.IsEffective = plan.IdTownBuildingPlan == planId;
                plan.IdLastUpdateInfo = newLastUpdate.IdLastUpdateInfo;
            }
            await SaveOrConflictAsync($"Les propositions du jour {target.Day} ont été modifiées entre-temps.");
            await transaction.CommitAsync();
            return await LoadPlanDtoAsync(planId);
        }

        public async Task<BuildingPlansDto> SaveSettingsAsync(int mapId, BuildingPlanSettingsRequestDto request)
        {
            if (request is null)
            {
                throw new MhoTechnicalException("Réglages absents.");
            }
            await using var townLock = await TownSyncLock.AcquireTownAsync(-mapId);
            var town = await LoadTownOrThrowAsync(mapId);
            await EnsureCanEditAsync(town, mapId);
            BuildingPlanValidator.ValidateItemValues(request.ItemValues);

            await using var transaction = await DbContext.Database.BeginTransactionAsync();
            var newLastUpdate = await NewLastUpdateAsync();
            var settings = await DbContext.TownBuildingPlanSettings.SingleOrDefaultAsync(row => row.IdTown == town.IdTown);
            if (settings is null)
            {
                // Version 0 = « aucune ligne » côté client : une ligne créée commence à 1.
                if (request.Version.HasValue && request.Version.Value != 0)
                {
                    throw new MhoConflictException($"Les réglages de la ville {mapId} n'existent pas à la version {request.Version}.");
                }
                settings = new TownBuildingPlanSettings { IdTown = town.IdTown, Version = 1 };
                DbContext.TownBuildingPlanSettings.Add(settings);
            }
            else
            {
                if (request.Version != settings.Version)
                {
                    throw new MhoConflictException($"Les réglages de la ville {mapId} ont été modifiés entre-temps (version {settings.Version}).");
                }
                settings.Version++;
            }
            settings.ItemValues = request.ItemValues.ToJson();
            settings.IdLastUpdateInfo = newLastUpdate.IdLastUpdateInfo;
            await SaveOrConflictAsync($"Les réglages de la ville {mapId} ont été modifiés entre-temps.");
            await transaction.CommitAsync();
            return await GetPlansAsync(mapId);
        }

        private IQueryable<TownBuildingPlan> PlansQuery()
        {
            return DbContext.TownBuildingPlans.AsNoTracking()
                .Include(plan => plan.IdLastUpdateInfoNavigation)
                    .ThenInclude(lastUpdateInfo => lastUpdateInfo!.IdUserNavigation);
        }

        private async Task<TownInfo?> LoadTownAsync(int mapId)
        {
            var idTown = DbContext.ResolveTownId(mapId);
            return await DbContext.Towns.AsNoTracking()
                .Where(town => town.IdTown == idTown)
                .Select(town => new TownInfo(town.IdTown, town.Day, town.IsFinished))
                .SingleOrDefaultAsync();
        }

        private async Task<TownInfo> LoadTownOrThrowAsync(int mapId)
        {
            return await LoadTownAsync(mapId) ?? throw new MhoTechnicalException($"Ville {mapId} inconnue.");
        }

        private async Task EnsureCanEditAsync(TownInfo town, int mapId)
        {
            await TownAccessService.EnsureCanWriteTownAsync(town.IdTown, mapId);
            if (town.IsFinished)
            {
                throw new MhoForbiddenException($"La ville {mapId} est terminée : ses plans ne sont plus modifiables.");
            }
        }

        private async Task<LastUpdateInfo> NewLastUpdateAsync()
        {
            LastUpdateInfoDto dto = UserInfoProvider.GenerateLastUpdateInfo();
            var entity = DbContext.LastUpdateInfos.Update(Mapper.Map<LastUpdateInfo>(dto, opt => opt.SetDbContext(DbContext))).Entity;
            await DbContext.SaveChangesAsync();
            return entity;
        }

        private async Task SaveOrConflictAsync(string conflictMessage)
        {
            try
            {
                await DbContext.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                // Autre instance de l'API : le verrou par ville n'est que local au processus.
                throw new MhoConflictException(conflictMessage);
            }
        }

        private async Task<BuildingPlanDto> LoadPlanDtoAsync(int planId)
        {
            var plan = await PlansQuery().SingleAsync(row => row.IdTownBuildingPlan == planId);
            return ToDto(plan, await LoadUserNamesAsync(new[] { plan.IdAuthor }));
        }

        private async Task<Dictionary<int, string>> LoadUserNamesAsync(IEnumerable<int> userIds)
        {
            var ids = userIds.Distinct().ToList();
            if (ids.Count == 0)
            {
                return new Dictionary<int, string>();
            }
            return await DbContext.Users.AsNoTracking().Where(user => ids.Contains(user.IdUser))
                .ToDictionaryAsync(user => user.IdUser, user => user.Name);
        }

        private BuildingPlanDto ToDto(TownBuildingPlan plan, Dictionary<int, string> authorNames) => new()
        {
            Id = plan.IdTownBuildingPlan,
            Day = plan.Day,
            Name = plan.Name,
            IsEffective = plan.IsEffective,
            Version = plan.Version,
            AuthorId = plan.IdAuthor,
            AuthorName = authorNames.TryGetValue(plan.IdAuthor, out var name) ? name : null,
            Content = plan.Content.FromJson<BuildingPlanContentDto>() ?? new BuildingPlanContentDto(),
            LastUpdateInfo = plan.IdLastUpdateInfoNavigation is null ? null : Mapper.Map<LastUpdateInfoDto>(plan.IdLastUpdateInfoNavigation)
        };

        private static TownBuildingStateDto ToStateDto(TownBuilding row) => new()
        {
            BuildingId = row.IdBuilding,
            IsBuilt = row.IsBuilt,
            PaCurrent = row.PaCurrent,
            ApRemaining = row.ApRemaining,
            Life = row.Life,
            MaxLife = row.MaxLife,
            Def = row.Def,
            Level = row.Level,
            Difficulty = row.Difficulty,
            Resources = string.IsNullOrEmpty(row.ResourcesCurrent)
                ? new List<TownBuildingResourceDto>()
                : row.ResourcesCurrent.FromJson<List<TownBuildingResourceDto>>() ?? new List<TownBuildingResourceDto>()
        };
    }
}
