using AutoMapper;
using Microsoft.EntityFrameworkCore;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Services.Impl.Bank;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Nightwatch;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Nightwatch.Request;
using MyHordesOptimizerApi.Exceptions;
using MyHordesOptimizerApi.Extensions;
using MyHordesOptimizerApi.Models;
using MyHordesOptimizerApi.Providers.Interfaces;
using MyHordesOptimizerApi.Services.Impl.Locking;
using MyHordesOptimizerApi.Services.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MyHordesOptimizerApi.Services.Impl.Nightwatch
{
    /// <summary>
    /// Règles : lecture et écriture réservées aux citoyens de la ville, vivants ou morts
    /// (<see cref="ITownAccessService"/>) ; un non-citoyen ne reçoit rien. Écriture refusée si la ville est terminée.
    /// </summary>
    public class NightwatchPlanService : INightwatchPlanService
    {
        protected MhoContext DbContext { get; init; }
        protected IUserInfoProvider UserInfoProvider { get; init; }
        protected ITownAccessService TownAccessService { get; init; }
        protected TownSyncLock TownSyncLock { get; init; }
        protected IMapper Mapper { get; init; }

        public NightwatchPlanService(MhoContext dbContext, IUserInfoProvider userInfoProvider, ITownAccessService townAccessService, TownSyncLock townSyncLock, IMapper mapper)
        {
            DbContext = dbContext;
            UserInfoProvider = userInfoProvider;
            TownAccessService = townAccessService;
            TownSyncLock = townSyncLock;
            Mapper = mapper;
        }

        private sealed record TownInfo(int IdTown, bool IsFinished, int Day);

        public async Task<NightwatchPlansDto> GetPlansAsync(int mapId)
        {
            var town = await LoadTownAsync(mapId);
            if (town is null)
            {
                return new NightwatchPlansDto();
            }
            var isCitizen = await TownAccessService.CanWriteTownAsync(town.IdTown, mapId);
            var result = new NightwatchPlansDto { Access = new NightwatchPlanAccessDto { IsCitizen = isCitizen, CanEdit = isCitizen && !town.IsFinished } };
            if (!isCitizen)
            {
                return result;
            }
            var plans = await PlansQuery()
                .Where(plan => plan.IdTown == town.IdTown)
                .OrderBy(plan => plan.Day).ThenBy(plan => plan.IdTownNightwatchPlan)
                .ToListAsync();
            var authorNames = await LoadUserNamesAsync(plans.Select(plan => plan.IdAuthor));
            result.Plans = plans.Select(plan => ToDto(plan, authorNames)).ToList();
            var simulations = await SimulationsQuery()
                .Where(simulation => simulation.IdTown == town.IdTown)
                .OrderBy(simulation => simulation.IdTownNightwatchSimulation)
                .ToListAsync();
            result.Simulations = simulations.Select(ToDto).ToList();
            return result;
        }

        public async Task<NightwatchStateDto> GetStateAsync(int mapId, int day)
        {
            var town = await LoadTownAsync(mapId);
            if (town is null || !await TownAccessService.CanWriteTownAsync(town.IdTown, mapId))
            {
                return new NightwatchStateDto();
            }
            var state = new NightwatchStateDto();

            var citizens = await DbContext.TownCitizens.AsNoTracking()
                .Where(row => row.IdTown == town.IdTown && row.Dead != true)
                .Select(row => new
                {
                    row.IdUser, row.NameInTown, UserName = row.IdUserNavigation.Name, row.JobUid, row.IsShunned, row.IsGhoul, row.IsDrugged,
                    row.IsDrunk, row.IsThirsty, row.IsImmune, row.IdBag, row.IdChest,
                    BagUpdatedAt = (DateTime?)row.IdBagNavigation!.IdLastUpdateInfoNavigation!.DateUpdate,
                    ChestUpdatedAt = (DateTime?)row.IdLastUpdateInfoChestNavigation!.DateUpdate
                })
                .ToListAsync();
            var bagIds = citizens.Where(row => row.IdBag.HasValue).Select(row => row.IdBag!.Value).ToList();
            var chestIds = citizens.Where(row => row.IdChest.HasValue).Select(row => row.IdChest!.Value).ToList();
            var bagRows = await DbContext.BagItems.AsNoTracking().Where(row => bagIds.Contains(row.IdBag)).ToListAsync();
            var chestRows = await DbContext.ChestItems.AsNoTracking().Where(row => chestIds.Contains(row.IdChest)).ToListAsync();
            state.Citizens = citizens.Select(row =>
            {
                var (bag, bagBroken) = Aggregate(bagRows.Where(item => item.IdBag == row.IdBag).Select(item => (item.IdItem, item.Count, item.IsBroken)));
                var (chest, chestBroken) = Aggregate(chestRows.Where(item => item.IdChest == row.IdChest).Select(item => (item.IdItem, item.Count, item.IsBroken)));
                return new NightwatchCitizenStateDto
                {
                    UserId = row.IdUser, Name = row.NameInTown ?? row.UserName, JobUid = row.JobUid,
                    IsShunned = row.IsShunned == true, IsGhoul = row.IsGhoul == true, IsDrugged = row.IsDrugged == true,
                    IsDrunk = row.IsDrunk == true, IsThirsty = row.IsThirsty == true, IsImmune = row.IsImmune == true,
                    Bag = bag, BagBroken = bagBroken, Chest = chest, ChestBroken = chestBroken,
                    BagUpdatedAt = row.BagUpdatedAt, ChestUpdatedAt = row.ChestUpdatedAt
                };
            }).ToList();

            var latestBankId = TownBankHistory.LatestSnapshotId(DbContext, town.IdTown);
            var bankRows = await DbContext.TownBankItems.AsNoTracking().Where(row => row.IdTown == town.IdTown && row.IdLastUpdateInfo == latestBankId)
                .Select(row => new { row.IdItem, row.Count, row.IsBroken }).ToListAsync();
            (state.Bank, state.BankBroken) = Aggregate(bankRows.Select(row => (row.IdItem, row.Count, row.IsBroken)));
            var desertRows = await DbContext.MapCellItems.AsNoTracking()
                .Where(row => row.IdCellNavigation.IdTown == town.IdTown && row.IdCellNavigation.IsTown != true)
                .Select(row => new { row.IdItem, row.Count, row.IsBroken }).ToListAsync();
            (state.Desert, state.DesertBroken) = Aggregate(desertRows.Select(row => (row.IdItem, row.Count, row.IsBroken)));

            var built = await DbContext.TownBuildings.AsNoTracking()
                .Where(row => row.IdTown == town.IdTown && row.IsBuilt)
                .Join(DbContext.Buildings, row => row.IdBuilding, building => building.IdBuilding, (row, building) => new { building.Uid, row.Level })
                .ToListAsync();
            state.BuiltBuildingUids = built.Select(row => row.Uid).Distinct().ToList();
            state.RoundPathLevel = built.FirstOrDefault(row => row.Uid == RoundPathUid)?.Level ?? 0;
            state.HasGuardRoom = state.BuiltBuildingUids.Contains(GuardRoomUid);
            state.HasSprinkler = state.BuiltBuildingUids.Contains(SprinklerUid);

            var townTypeId = await DbContext.Towns.AsNoTracking().Where(row => row.IdTown == town.IdTown).Select(row => row.TownTypeId).SingleOrDefaultAsync();
            state.TownIsPanda = townTypeId == (int)TownType.PANDE;
            state.PastWatches = await LoadPastWatchesAsync(town.IdTown, day);
            return state;
        }

        private const string RoundPathUid = "small_round_path_#00";
        private const string GuardRoomUid = "small_watchmen_#02";
        private const string SprinklerUid = "small_sprinkler_#00";

        /// <summary>Quantité totale par objet, et part cassée (lignes <c>IsBroken</c>).</summary>
        private static (Dictionary<int, int> Total, Dictionary<int, int> Broken) Aggregate(IEnumerable<(int IdItem, int? Count, bool? IsBroken)> rows)
        {
            var list = rows.ToList();
            return (
                list.GroupBy(row => row.IdItem).ToDictionary(group => group.Key, group => group.Sum(row => row.Count ?? 0)),
                list.Where(row => row.IsBroken == true).GroupBy(row => row.IdItem).ToDictionary(group => group.Key, group => group.Sum(row => row.Count ?? 0)));
        }

        /// <summary>userId → nombre de plans effectifs de jours antérieurs à <paramref name="day"/> où le citoyen figure.</summary>
        private async Task<Dictionary<int, int>> LoadPastWatchesAsync(int idTown, int day)
        {
            var contents = await DbContext.TownNightwatchPlans.AsNoTracking()
                .Where(plan => plan.IdTown == idTown && plan.IsEffective && plan.Day < day)
                .Select(plan => plan.Content).ToListAsync();
            return contents
                .SelectMany(content => (content.FromJson<NightwatchPlanContentDto>()?.Watchers ?? new List<NightwatchWatcherDto>()).Select(watcher => watcher.UserId).Distinct())
                .GroupBy(userId => userId).ToDictionary(group => group.Key, group => group.Count());
        }

        public async Task<NightwatchPlanDto> SavePlanAsync(int mapId, NightwatchPlanRequestDto request)
        {
            if (request is null)
            {
                throw new MhoTechnicalException("Proposition absente.");
            }
            await using var townLock = await TownSyncLock.AcquireTownAsync(-mapId);
            var town = await LoadTownOrThrowAsync(mapId);
            await EnsureCanEditAsync(town, mapId);
            var name = NightwatchPlanValidator.NormalizeName(request.Name);
            var content = NightwatchPlanValidator.SerializeContent(request.Content);
            NightwatchPlanValidator.ValidateDay(request.Day);

            await using var transaction = await DbContext.Database.BeginTransactionAsync();
            var newLastUpdate = await NewLastUpdateAsync();
            TownNightwatchPlan plan;
            if (request.Id.HasValue)
            {
                plan = await DbContext.TownNightwatchPlans.SingleOrDefaultAsync(row => row.IdTownNightwatchPlan == request.Id.Value && row.IdTown == town.IdTown)
                    ?? throw new MhoForbiddenException($"La proposition {request.Id} n'appartient pas à la ville {mapId}.");
                if (!request.Version.HasValue)
                {
                    throw new MhoTechnicalException("Version de la proposition absente.");
                }
                if (request.Version.Value != plan.Version)
                {
                    throw new MhoConflictException($"La proposition {plan.IdTownNightwatchPlan} a été modifiée entre-temps (version {plan.Version}).");
                }
                if (request.Day != plan.Day)
                {
                    throw new MhoTechnicalException("Le jour d'une proposition existante ne se modifie pas : dupliquer la proposition sur le nouveau jour.");
                }
                plan.Version++;
            }
            else
            {
                bool isEffective;
                if (request.SimulationId.HasValue)
                {
                    var simulation = await FindSimulationOrThrowAsync(town, mapId, request.SimulationId.Value);
                    if (request.Day < town.Day || request.Day > simulation.LastDay)
                    {
                        throw new MhoTechnicalException($"Le jour {request.Day} est hors de la simulation {request.SimulationId} (jour {town.Day} à {simulation.LastDay}).");
                    }
                    if (await DbContext.TownNightwatchPlans.AnyAsync(row => row.IdTownNightwatchSimulation == request.SimulationId.Value && row.Day == request.Day))
                    {
                        throw new MhoTechnicalException($"La simulation {request.SimulationId} a déjà une proposition le jour {request.Day}.");
                    }
                    isEffective = false;
                }
                else
                {
                    isEffective = !await DbContext.TownNightwatchPlans.AnyAsync(row => row.IdTown == town.IdTown && row.Day == request.Day && row.IsEffective);
                }
                plan = new TownNightwatchPlan
                {
                    IdTown = town.IdTown, Day = request.Day, IdAuthor = UserInfoProvider.UserId, IsEffective = isEffective,
                    IdTownNightwatchSimulation = request.SimulationId
                };
                DbContext.TownNightwatchPlans.Add(plan);
            }
            plan.Name = name;
            plan.Content = content;
            plan.IdLastUpdateInfo = newLastUpdate.IdLastUpdateInfo;
            await SaveOrConflictAsync($"La proposition {request.Id} a été modifiée entre-temps.");
            await transaction.CommitAsync();

            return await LoadPlanDtoAsync(plan.IdTownNightwatchPlan);
        }

        public async Task DeletePlanAsync(int mapId, int planId)
        {
            await using var townLock = await TownSyncLock.AcquireTownAsync(-mapId);
            var town = await LoadTownOrThrowAsync(mapId);
            await EnsureCanEditAsync(town, mapId);
            var plan = await DbContext.TownNightwatchPlans.SingleOrDefaultAsync(row => row.IdTownNightwatchPlan == planId && row.IdTown == town.IdTown)
                ?? throw new MhoForbiddenException($"La proposition {planId} n'appartient pas à la ville {mapId}.");
            DbContext.TownNightwatchPlans.Remove(plan);
            await DbContext.SaveChangesAsync();
        }

        public async Task<NightwatchPlanDto> SetEffectiveAsync(int mapId, int planId)
        {
            await using var townLock = await TownSyncLock.AcquireTownAsync(-mapId);
            var town = await LoadTownOrThrowAsync(mapId);
            await EnsureCanEditAsync(town, mapId);
            await using var transaction = await DbContext.Database.BeginTransactionAsync();
            var target = await DbContext.TownNightwatchPlans.SingleOrDefaultAsync(row => row.IdTownNightwatchPlan == planId && row.IdTown == town.IdTown)
                ?? throw new MhoForbiddenException($"La proposition {planId} n'appartient pas à la ville {mapId}.");
            var sameDay = await DbContext.TownNightwatchPlans.Where(row => row.IdTown == town.IdTown && row.Day == target.Day).ToListAsync();
            var newLastUpdate = await NewLastUpdateAsync();
            foreach (var plan in sameDay.Where(plan => plan.IsEffective != (plan.IdTownNightwatchPlan == planId)))
            {
                // La Version ne bouge pas : seul le contenu est versionné, l'étoile ne doit pas mettre un éditeur en conflit.
                plan.IsEffective = plan.IdTownNightwatchPlan == planId;
                plan.IdLastUpdateInfo = newLastUpdate.IdLastUpdateInfo;
            }
            await SaveOrConflictAsync($"Les propositions du jour {target.Day} ont été modifiées entre-temps.");
            await transaction.CommitAsync();
            return await LoadPlanDtoAsync(planId);
        }

        public async Task<NightwatchSimulationDto> SaveSimulationAsync(int mapId, NightwatchSimulationRequestDto request)
        {
            if (request is null)
            {
                throw new MhoTechnicalException("Simulation absente.");
            }
            await using var townLock = await TownSyncLock.AcquireTownAsync(-mapId);
            var town = await LoadTownOrThrowAsync(mapId);
            await EnsureCanEditAsync(town, mapId);
            var name = NightwatchPlanValidator.ValidateSimulation(request, town.Day);

            await using var transaction = await DbContext.Database.BeginTransactionAsync();
            var newLastUpdate = await NewLastUpdateAsync();
            TownNightwatchSimulation simulation;
            var firstNewDay = town.Day;
            if (request.Id.HasValue)
            {
                simulation = await FindSimulationOrThrowAsync(town, mapId, request.Id.Value);
                if (!request.Version.HasValue)
                {
                    throw new MhoTechnicalException("Version de la simulation absente.");
                }
                if (request.Version.Value != simulation.Version)
                {
                    throw new MhoConflictException($"La simulation {simulation.IdTownNightwatchSimulation} a été modifiée entre-temps (version {simulation.Version}).");
                }
                if (request.LastDay < simulation.LastDay)
                {
                    var beyond = await DbContext.TownNightwatchPlans
                        .Where(plan => plan.IdTownNightwatchSimulation == simulation.IdTownNightwatchSimulation && plan.Day > request.LastDay)
                        .ToListAsync();
                    DetachEffectiveRemoveOthers(beyond, newLastUpdate);
                }
                // Allonger : seuls les jours au-delà de l'ancien dernier jour sont créés, une proposition supprimée à la main n'est pas recréée.
                firstNewDay = Math.Max(town.Day, simulation.LastDay + 1);
                simulation.Version++;
            }
            else
            {
                simulation = new TownNightwatchSimulation { IdTown = town.IdTown, IdAuthor = UserInfoProvider.UserId };
                DbContext.TownNightwatchSimulations.Add(simulation);
            }
            simulation.Name = name;
            simulation.LastDay = request.LastDay;
            simulation.Stock = request.Stock.ToJson();
            simulation.IdLastUpdateInfo = newLastUpdate.IdLastUpdateInfo;
            await SaveOrConflictAsync($"La simulation {request.Id} a été modifiée entre-temps.");

            var emptyContent = NightwatchPlanValidator.SerializeContent(new NightwatchPlanContentDto());
            for (var day = firstNewDay; day <= simulation.LastDay; day++)
            {
                DbContext.TownNightwatchPlans.Add(NewSimulationPlan(simulation, day, emptyContent, newLastUpdate));
            }
            await DbContext.SaveChangesAsync();
            await transaction.CommitAsync();
            return await LoadSimulationDtoAsync(simulation.IdTownNightwatchSimulation);
        }

        public async Task<NightwatchSimulationDto> DuplicateSimulationAsync(int mapId, int simulationId, string name)
        {
            var normalizedName = NightwatchPlanValidator.NormalizeName(name);
            await using var townLock = await TownSyncLock.AcquireTownAsync(-mapId);
            var town = await LoadTownOrThrowAsync(mapId);
            await EnsureCanEditAsync(town, mapId);

            await using var transaction = await DbContext.Database.BeginTransactionAsync();
            var source = await FindSimulationOrThrowAsync(town, mapId, simulationId);
            var sourcePlans = await DbContext.TownNightwatchPlans.AsNoTracking()
                .Where(plan => plan.IdTownNightwatchSimulation == simulationId && plan.Day >= town.Day)
                .ToListAsync();
            var newLastUpdate = await NewLastUpdateAsync();
            var copy = new TownNightwatchSimulation
            {
                IdTown = town.IdTown, IdAuthor = UserInfoProvider.UserId, Name = normalizedName, LastDay = source.LastDay,
                Stock = source.Stock, IdLastUpdateInfo = newLastUpdate.IdLastUpdateInfo
            };
            DbContext.TownNightwatchSimulations.Add(copy);
            await DbContext.SaveChangesAsync();
            foreach (var plan in sourcePlans)
            {
                DbContext.TownNightwatchPlans.Add(NewSimulationPlan(copy, plan.Day, plan.Content, newLastUpdate));
            }
            await DbContext.SaveChangesAsync();
            await transaction.CommitAsync();
            return await LoadSimulationDtoAsync(copy.IdTownNightwatchSimulation);
        }

        public async Task DeleteSimulationAsync(int mapId, int simulationId)
        {
            await using var townLock = await TownSyncLock.AcquireTownAsync(-mapId);
            var town = await LoadTownOrThrowAsync(mapId);
            await EnsureCanEditAsync(town, mapId);

            await using var transaction = await DbContext.Database.BeginTransactionAsync();
            var simulation = await FindSimulationOrThrowAsync(town, mapId, simulationId);
            var plans = await DbContext.TownNightwatchPlans.Where(plan => plan.IdTownNightwatchSimulation == simulationId).ToListAsync();
            DetachEffectiveRemoveOthers(plans, await NewLastUpdateAsync());
            DbContext.TownNightwatchSimulations.Remove(simulation);
            await SaveOrConflictAsync($"La simulation {simulationId} a été modifiée entre-temps.");
            await transaction.CommitAsync();
        }

        /// <summary>Propositions effectives détachées de leur simulation (historique conservé), les autres supprimées.</summary>
        private void DetachEffectiveRemoveOthers(IEnumerable<TownNightwatchPlan> plans, LastUpdateInfo lastUpdate)
        {
            foreach (var plan in plans)
            {
                if (plan.IsEffective)
                {
                    plan.IdTownNightwatchSimulation = null;
                    plan.IdLastUpdateInfo = lastUpdate.IdLastUpdateInfo;
                }
                else
                {
                    DbContext.TownNightwatchPlans.Remove(plan);
                }
            }
        }

        private TownNightwatchPlan NewSimulationPlan(TownNightwatchSimulation simulation, int day, string content, LastUpdateInfo lastUpdate) => new()
        {
            IdTown = simulation.IdTown, Day = day, Name = simulation.Name, Content = content, IsEffective = false,
            IdTownNightwatchSimulation = simulation.IdTownNightwatchSimulation, IdAuthor = UserInfoProvider.UserId,
            IdLastUpdateInfo = lastUpdate.IdLastUpdateInfo
        };

        private async Task<TownNightwatchSimulation> FindSimulationOrThrowAsync(TownInfo town, int mapId, int simulationId)
        {
            return await DbContext.TownNightwatchSimulations.SingleOrDefaultAsync(row => row.IdTownNightwatchSimulation == simulationId && row.IdTown == town.IdTown)
                ?? throw new MhoForbiddenException($"La simulation {simulationId} n'appartient pas à la ville {mapId}.");
        }

        private IQueryable<TownNightwatchSimulation> SimulationsQuery()
        {
            return DbContext.TownNightwatchSimulations.AsNoTracking()
                .Include(simulation => simulation.IdLastUpdateInfoNavigation)
                    .ThenInclude(lastUpdateInfo => lastUpdateInfo!.IdUserNavigation);
        }

        private async Task<NightwatchSimulationDto> LoadSimulationDtoAsync(int simulationId)
        {
            return ToDto(await SimulationsQuery().SingleAsync(row => row.IdTownNightwatchSimulation == simulationId));
        }

        private NightwatchSimulationDto ToDto(TownNightwatchSimulation simulation) => new()
        {
            Id = simulation.IdTownNightwatchSimulation,
            Name = simulation.Name,
            LastDay = simulation.LastDay,
            Stock = simulation.Stock.FromJson<Dictionary<int, int>>() ?? new Dictionary<int, int>(),
            Version = simulation.Version,
            LastUpdateInfo = simulation.IdLastUpdateInfoNavigation is null ? null : Mapper.Map<LastUpdateInfoDto>(simulation.IdLastUpdateInfoNavigation)
        };

        private IQueryable<TownNightwatchPlan> PlansQuery()
        {
            return DbContext.TownNightwatchPlans.AsNoTracking()
                .Include(plan => plan.IdLastUpdateInfoNavigation)
                    .ThenInclude(lastUpdateInfo => lastUpdateInfo!.IdUserNavigation);
        }

        private async Task<TownInfo?> LoadTownAsync(int mapId)
        {
            var idTown = DbContext.ResolveTownId(mapId);
            return await DbContext.Towns.AsNoTracking()
                .Where(town => town.IdTown == idTown)
                .Select(town => new TownInfo(town.IdTown, town.IsFinished, town.Day))
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

        private async Task<NightwatchPlanDto> LoadPlanDtoAsync(int planId)
        {
            var plan = await PlansQuery().SingleAsync(row => row.IdTownNightwatchPlan == planId);
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

        private NightwatchPlanDto ToDto(TownNightwatchPlan plan, Dictionary<int, string> authorNames) => new()
        {
            Id = plan.IdTownNightwatchPlan,
            Day = plan.Day,
            Name = plan.Name,
            IsEffective = plan.IsEffective,
            SimulationId = plan.IdTownNightwatchSimulation,
            Version = plan.Version,
            AuthorId = plan.IdAuthor,
            AuthorName = authorNames.TryGetValue(plan.IdAuthor, out var name) ? name : null,
            Content = plan.Content.FromJson<NightwatchPlanContentDto>() ?? new NightwatchPlanContentDto(),
            LastUpdateInfo = plan.IdLastUpdateInfoNavigation is null ? null : Mapper.Map<LastUpdateInfoDto>(plan.IdLastUpdateInfoNavigation)
        };
    }
}
