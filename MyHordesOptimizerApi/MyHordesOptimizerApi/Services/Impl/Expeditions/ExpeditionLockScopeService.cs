using Microsoft.EntityFrameworkCore;
using MyHordesOptimizerApi.Services.Interfaces;
using MyHordesOptimizerApi.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Threading.Tasks;

namespace MyHordesOptimizerApi.Services.Impl.Expeditions
{
    public class ExpeditionLockScopeService : IExpeditionLockScopeService
    {
        private readonly MhoContext _dbContext;

        public ExpeditionLockScopeService(MhoContext dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task<IReadOnlyList<ExpeditionLockRef>> OwnersOfOrderAsync(int orderId)
        {
            var order = await _dbContext.ExpeditionOrders.AsNoTracking()
                .Where(o => o.IdExpeditionOrder == orderId)
                .Select(o => new { o.IdExpeditionCitizen, PartIds = o.IdExpeditionParts.Select(p => p.IdExpeditionPart).ToList() })
                .FirstOrDefaultAsync();
            if (order is null)
            {
                return new List<ExpeditionLockRef>();
            }
            if (order.IdExpeditionCitizen.HasValue)
            {
                return new[] { new ExpeditionLockRef(ExpeditionLockKind.CitizenOrders, order.IdExpeditionCitizen.Value) };
            }
            return order.PartIds.Select(id => new ExpeditionLockRef(ExpeditionLockKind.PartOrders, id)).ToList();
        }

        public async Task<IReadOnlyList<ExpeditionLockRef>> OwnersOfBagAsync(int bagId)
        {
            var citizenIds = await _dbContext.ExpeditionCitizens.AsNoTracking()
                .Where(c => c.IdExpeditionBag == bagId)
                .Select(c => c.IdExpeditionCitizen)
                .ToListAsync();
            return citizenIds.Select(id => new ExpeditionLockRef(ExpeditionLockKind.Bag, id)).ToList();
        }

        public Task<IReadOnlyList<ExpeditionLockRef>> WithDescendantsOfCitizenAsync(int citizenId)
        {
            return Task.FromResult<IReadOnlyList<ExpeditionLockRef>>(CitizenRefs(citizenId).ToList());
        }

        public async Task<IReadOnlyList<ExpeditionLockRef>> WithDescendantsOfPartAsync(int partId)
        {
            var citizenIds = await _dbContext.ExpeditionCitizens.AsNoTracking()
                .Where(c => c.IdExpeditionPart == partId)
                .Select(c => c.IdExpeditionCitizen)
                .ToListAsync();
            return PartRefs(partId, citizenIds).ToList();
        }

        public Task<IReadOnlyList<ExpeditionLockRef>> WithDescendantsOfExpeditionAsync(int expeditionId)
        {
            return ScopeOfExpeditionsAsync(e => e.IdExpedition == expeditionId);
        }

        public Task<IReadOnlyList<ExpeditionLockRef>> OfDayAsync(int mapId, int day)
        {
            var townId = _dbContext.ResolveTownId(mapId);
            return ScopeOfExpeditionsAsync(e => e.IdTown == townId && e.Day == day);
        }

        private async Task<IReadOnlyList<ExpeditionLockRef>> ScopeOfExpeditionsAsync(Expression<Func<Expedition, bool>> filter)
        {
            var expeditions = await _dbContext.Expeditions.AsNoTracking()
                .Where(filter)
                .OrderBy(e => e.Position).ThenBy(e => e.IdExpedition)
                .Select(e => new
                {
                    e.IdExpedition,
                    Parts = e.ExpeditionParts.OrderBy(p => p.Position).ThenBy(p => p.IdExpeditionPart).Select(p => new
                    {
                        p.IdExpeditionPart,
                        CitizenIds = p.ExpeditionCitizens.Select(c => c.IdExpeditionCitizen).ToList()
                    }).ToList()
                })
                .ToListAsync();
            var result = new List<ExpeditionLockRef>();
            foreach (var e in expeditions)
            {
                result.Add(new ExpeditionLockRef(ExpeditionLockKind.Expedition, e.IdExpedition));
                foreach (var p in e.Parts)
                {
                    result.AddRange(PartRefs(p.IdExpeditionPart, p.CitizenIds));
                }
            }
            return result;
        }

        private static IEnumerable<ExpeditionLockRef> PartRefs(int partId, IEnumerable<int> citizenIds)
        {
            yield return new ExpeditionLockRef(ExpeditionLockKind.Part, partId);
            yield return new ExpeditionLockRef(ExpeditionLockKind.PartOrders, partId);
            foreach (var citizenId in citizenIds)
            {
                foreach (var r in CitizenRefs(citizenId))
                {
                    yield return r;
                }
            }
        }

        private static IEnumerable<ExpeditionLockRef> CitizenRefs(int citizenId)
        {
            yield return new ExpeditionLockRef(ExpeditionLockKind.Citizen, citizenId);
            yield return new ExpeditionLockRef(ExpeditionLockKind.Bag, citizenId);
            yield return new ExpeditionLockRef(ExpeditionLockKind.CitizenOrders, citizenId);
        }
    }
}
