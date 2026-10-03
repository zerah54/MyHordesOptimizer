using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using AutoMapper;
using Microsoft.EntityFrameworkCore;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Estimations;
using MyHordesOptimizerApi.Extensions;
using MyHordesOptimizerApi.Models;
using MyHordesOptimizerApi.Providers.Interfaces;
using MyHordesOptimizerApi.Services.Impl.Locking;
using MyHordesOptimizerApi.Services.Interfaces.Estimations;

namespace MyHordesOptimizerApi.Services.Impl.Estimations.Refinement
{
    /// <summary>
    /// Affinages partagés par ville : réception des seeds d'un scan client, refiltrage à la lecture quand les
    /// saisies ont bougé, invalidation si elles ont changé de façon non monotone, purge des seeds des jours passés.
    /// </summary>
    public class RefinementService : IRefinementService
    {
        private const string StatusValid = "Valid";
        private const string StatusInvalid = "Invalid";
        /// <summary>Un affinage sert au plus du début du jour D−1 (planif) à la fin du jour D : 3 jours couvrent ce cycle.</summary>
        private const int SeedRetentionDays = 3;
        private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

        private readonly MhoContext _dbContext;
        private readonly IMyHordesOptimizerEstimationService _estimationService;
        private readonly TownSyncLock _townSyncLock;
        private readonly IUserInfoProvider _userInfoProvider;
        private readonly IMapper _mapper;

        public RefinementService(MhoContext dbContext, IMyHordesOptimizerEstimationService estimationService, TownSyncLock townSyncLock,
            IUserInfoProvider userInfoProvider, IMapper mapper)
        {
            _dbContext = dbContext;
            _estimationService = estimationService;
            _townSyncLock = townSyncLock;
            _userInfoProvider = userInfoProvider;
            _mapper = mapper;
        }

        /// <summary>État courant de la ville pour un jour d'attaque.</summary>
        private sealed record CurrentState(int ResolvedTownId, int TownDay, RefinementInput? Input, double AttackFactor);

        public RefinementInput? GetInput(int townId, int day) => BuildCurrent(townId, day).Input;

        public RefinementViewDto Get(int townId, int day)
        {
            var current = BuildCurrent(townId, day);
            var row = _dbContext.TownAttackRefinements.AsNoTracking().SingleOrDefault(r => r.IdTown == current.ResolvedTownId && r.Day == day);
            // Lecture courante (chaque page, chaque tour de guet de l'addon) : jamais derrière le verrou de
            // synchro de la ville, sauf s'il y a réellement à écrire (recalcul ou purge).
            if ((row is null || !row.Stale) && !HasSeedsToPurge(current))
            {
                return ToView(row, current);
            }
            using var townLock = _townSyncLock.AcquireTownBlocking(-townId);
            current = BuildCurrent(townId, day);
            var tracked = _dbContext.TownAttackRefinements.SingleOrDefault(r => r.IdTown == current.ResolvedTownId && r.Day == day);
            if (tracked is not null && tracked.Stale)
            {
                Recompute(tracked, current.Input);
            }
            PurgePastSeeds(townId, current);
            return ToView(tracked, current);
        }

        public RefinementViewDto Upload(int townId, int day, RefinementInput uploaded, uint[] seeds)
        {
            var applied = BuildCurrent(townId, day);
            if (applied.Input is null || !RefinementEngine.IsCompatible(uploaded, applied.Input))
            {
                throw new RefinementConflictException();
            }
            // Rejeu (jusqu'à 65 536 seeds) HORS verrou : il ne bloque aucune synchro de la ville.
            var outcome = RefinementEngine.Process(applied.Input, seeds);

            using var townLock = _townSyncLock.AcquireTownBlocking(-townId);
            var current = BuildCurrent(townId, day);
            if (current.Input is null || !RefinementEngine.IsCompatible(applied.Input, current.Input))
            {
                throw new RefinementConflictException();
            }
            var lastUpdate = _dbContext.LastUpdateInfos.Update(_mapper.Map<LastUpdateInfo>(_userInfoProvider.GenerateLastUpdateInfo(), opt => opt.SetDbContext(_dbContext)));
            _dbContext.SaveChanges();
            var row = _dbContext.TownAttackRefinements.SingleOrDefault(r => r.IdTown == current.ResolvedTownId && r.Day == day);
            if (row is null)
            {
                row = new TownAttackRefinement { IdTown = current.ResolvedTownId, Day = day };
                _dbContext.TownAttackRefinements.Add(row);
            }
            // Entrées figées = celles appliquées aux couples stockés (ni celles du client, plus pauvres, ni
            // les courantes si un palier est arrivé pendant le rejeu : l'affinage est alors marqué périmé).
            row.Input = JsonSerializer.Serialize(applied.Input, JsonOptions);
            Apply(row, outcome, applied.Input);
            row.Stale = row.Input != JsonSerializer.Serialize(current.Input, JsonOptions);
            row.IdLastUpdateInfo = lastUpdate.Entity.IdLastUpdateInfo;
            _dbContext.SaveChanges();
            PurgePastSeeds(townId, current);
            PurgeExpiredSeeds();
            return ToView(row, current);
        }

        private bool HasSeedsToPurge(CurrentState current) =>
            _dbContext.TownAttackRefinements.Any(r => r.IdTown == current.ResolvedTownId && r.Day < current.TownDay && r.Candidates != null);

        private CurrentState BuildCurrent(int townId, int day)
        {
            int resolvedTownId = _dbContext.ResolveTownId(townId);
            var town = _dbContext.Towns.AsNoTracking().Where(t => t.IdTown == resolvedTownId).Select(t => new { t.Day, t.TownTypeId }).FirstOrDefault();
            var tdgDay = _estimationService.GetEstimations(townId, day);
            var planifDay = _estimationService.GetEstimations(townId, day - 1);
            var settings = _estimationService.GetAttackSettings(townId, day);
            var input = RefinementInputBuilder.Build(day, tdgDay.Estim, tdgDay.EstimSouls ?? new Dictionary<int, int>(), tdgDay.EstimSpaLevel ?? 0,
                day > 1 ? planifDay.Planif : null, planifDay.PlanifSouls ?? new Dictionary<int, int>(), planifDay.PlanifSpaLevel ?? 0, settings.Fireworks, town?.TownTypeId);
            var (attackSouls, attackSpaLevel) = AttackSoulsDefaults.Resolve(tdgDay, planifDay, settings);
            return new CurrentState(resolvedTownId, town?.Day ?? 0, input, RedSoulFactor.Compute(attackSouls, town?.TownTypeId, attackSpaLevel));
        }

        private void Recompute(TownAttackRefinement row, RefinementInput? current)
        {
            var frozen = JsonSerializer.Deserialize<RefinementInput>(row.Input, JsonOptions)!;
            if (row.Status == StatusValid && current is not null && row.Input == JsonSerializer.Serialize(current, JsonOptions))
            {
                // Entrées inchangées (enregistrement sans nouvelle valeur, âmes ou SPA à l'attaque) : seule la
                // conversion en attaque, faite à la lecture, bouge.
            }
            else if (current is null || !RefinementEngine.IsCompatible(frozen, current))
            {
                row.Status = StatusInvalid;
            }
            else if (row.Candidates is not null)
            {
                var previousRange = (row.ValueMin, row.ValueMax, row.ReductionMin, row.ReductionMax);
                Apply(row, RefinementEngine.Refilter(current, RefinementEngine.Decode(row.Candidates)), current);
                row.Input = JsonSerializer.Serialize(current, JsonOptions);
                if ((row.ValueMin, row.ValueMax, row.ReductionMin, row.ReductionMax) != previousRange)
                {
                    // La plage a bougé sans nouveau scan : l'affinage est crédité à la dernière saisie de ses entrées.
                    row.IdLastUpdateInfo = LatestInputUpdate(row.IdTown, row.Day) ?? row.IdLastUpdateInfo;
                }
            }
            else
            {
                // Seeds purgés et entrées de nouveau compatibles : la plage stockée reste un sur-ensemble exact.
                row.Status = StatusValid;
            }
            row.Stale = false;
            row.ComputedAt = DateTime.UtcNow;
            _dbContext.SaveChanges();
        }

        /// <summary>Dernière saisie des entrées du jour attaqué : tour du jour D, planificateur de D−1, réglages d'attaque de D.</summary>
        private int? LatestInputUpdate(int resolvedTownId, int day)
        {
            var estimationUpdates = _dbContext.TownEstimations
                .Where(e => e.IdTown == resolvedTownId && ((e.Day == day && !e.IsPlanif) || (e.Day == day - 1 && e.IsPlanif)))
                .Select(e => e.IdLastUpdateInfo);
            var settingUpdates = _dbContext.TownAttackSettings
                .Where(s => s.IdTown == resolvedTownId && s.Day == day)
                .Select(s => s.IdLastUpdateInfo);
            return _dbContext.LastUpdateInfos.AsNoTracking()
                .Where(info => estimationUpdates.Contains(info.IdLastUpdateInfo) || settingUpdates.Contains(info.IdLastUpdateInfo))
                .OrderByDescending(info => info.DateUpdate)
                .Select(info => (int?)info.IdLastUpdateInfo)
                .FirstOrDefault();
        }

        private static void Apply(TownAttackRefinement row, RefinementOutcome outcome, RefinementInput input)
        {
            row.Candidates = RefinementEngine.Encode(outcome.Triples);
            row.CandidateCount = outcome.SeedCount;
            row.Status = StatusValid;
            row.Stale = false;
            row.ValueMin = outcome.Values.Count > 0 ? outcome.Values.Min : null;
            row.ValueMax = outcome.Values.Count > 0 ? outcome.Values.Max : null;
            bool reported = input.ObservedPlanif is not null && outcome.Reductions.Count > 0;
            row.ReductionMin = reported ? outcome.Reductions.Min : null;
            row.ReductionMax = reported ? outcome.Reductions.Max : null;
            row.ComputedAt = DateTime.UtcNow;
        }

        /// <summary>
        /// Le seed d'un jour d'attaque passé ne vaut plus rien : on le jette, la plage reste. Un jour encore
        /// périmé est refiltré d'abord, pour que sa plage historique profite des dernières saisies.
        /// </summary>
        private void PurgePastSeeds(int townId, CurrentState current)
        {
            var stalePastDays = _dbContext.TownAttackRefinements
                .Where(r => r.IdTown == current.ResolvedTownId && r.Day < current.TownDay && r.Candidates != null && r.Stale)
                .ToList();
            foreach (var row in stalePastDays)
            {
                Recompute(row, BuildCurrent(townId, row.Day).Input);
            }
            _dbContext.TownAttackRefinements
                .Where(r => r.IdTown == current.ResolvedTownId && r.Day < current.TownDay && r.Candidates != null)
                .ExecuteUpdate(setters => setters.SetProperty(r => r.Candidates, (byte[]?)null));
        }

        /// <summary>
        /// Seeds de plus de <see cref="SeedRetentionDays"/> jours, toutes villes confondues : couvre les villes
        /// terminées ou supprimées, dont le jour n'avance plus. Sans refiltrage préalable.
        /// </summary>
        private void PurgeExpiredSeeds()
        {
            var threshold = DateTime.UtcNow.AddDays(-SeedRetentionDays);
            _dbContext.TownAttackRefinements
                .Where(r => r.Candidates != null && r.ComputedAt < threshold)
                .ExecuteUpdate(setters => setters.SetProperty(r => r.Candidates, (byte[]?)null));
        }

        private RefinementViewDto ToView(TownAttackRefinement? row, CurrentState current)
        {
            if (row is null)
            {
                return new RefinementViewDto { Status = RefinementStatus.None };
            }
            bool valid = row.Status == StatusValid;
            return new RefinementViewDto
            {
                Status = valid ? RefinementStatus.Valid : RefinementStatus.Invalid,
                AttackMin = valid && row.ValueMin is int min ? RefinementModel.AttackFromValue(min, current.AttackFactor) : null,
                AttackMax = valid && row.ValueMax is int max ? RefinementModel.AttackFromValue(max, current.AttackFactor) : null,
                ReductionMin = valid ? row.ReductionMin : null,
                ReductionMax = valid ? row.ReductionMax : null,
                NoCompatibleConfiguration = valid && row.ValueMin is null,
                LastUpdateInfo = _dbContext.LastUpdateInfos.AsNoTracking()
                    .Where(info => info.IdLastUpdateInfo == row.IdLastUpdateInfo)
                    .Select(info => new LastUpdateInfoDto { UserId = info.IdUser ?? 0, UserName = info.IdUserNavigation!.Name, UpdateTime = info.DateUpdate })
                    .FirstOrDefault()
            };
        }
    }
}
