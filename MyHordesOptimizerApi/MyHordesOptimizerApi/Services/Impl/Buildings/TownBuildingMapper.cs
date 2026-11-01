using MyHordesOptimizerApi.Dtos.MyHordes;
using MyHordesOptimizerApi.Models;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;

namespace MyHordesOptimizerApi.Services.Impl.Buildings
{
    /// <summary>Convertit <c>city.chantiers</c> et <c>city.buildings</c> en lignes <see cref="TownBuilding"/>.</summary>
    public static class TownBuildingMapper
    {
        /// <param name="idBuildingByMhId">Id MyHordes du chantier → <c>Building.IdBuilding</c>.</param>
        /// <param name="idItemByMhId">Id MyHordes de l'objet → <c>Item.IdItem</c>.</param>
        /// <param name="onUnknownBuilding">Appelé pour chaque id de chantier absent du référentiel.</param>
        public static List<TownBuilding> Map(
            MyHordesCity? city,
            IReadOnlyDictionary<int, int> idBuildingByMhId,
            IReadOnlyDictionary<int, int> idItemByMhId,
            Action<int> onUnknownBuilding)
        {
            var rows = new List<TownBuilding>();
            if (city is null)
            {
                return rows;
            }
            AddRows(rows, city.Chantiers, false, idBuildingByMhId, idItemByMhId, onUnknownBuilding);
            AddRows(rows, city.Buildings, true, idBuildingByMhId, idItemByMhId, onUnknownBuilding);
            return rows;
        }

        /// <summary>
        /// Table « id MyHordes → clé MHO » sans exception de clé dupliquée. Pendant le découplage un <c>MhId</c> peut
        /// égaler la clé d'une autre ligne : le <c>MhId</c> explicite prime, le premier gagne, la collision est signalée.
        /// </summary>
        public static Dictionary<int, int> BuildLookup(IEnumerable<(int? MhId, int Id)> rows, Action<int> onCollision)
        {
            var lookup = new Dictionary<int, int>();
            var materialized = rows.ToList();
            foreach (var row in materialized.Where(row => row.MhId.HasValue))
            {
                if (!lookup.TryAdd(row.MhId!.Value, row.Id))
                {
                    onCollision(row.MhId.Value);
                }
            }
            foreach (var row in materialized.Where(row => !row.MhId.HasValue))
            {
                if (!lookup.TryAdd(row.Id, row.Id))
                {
                    onCollision(row.Id);
                }
            }
            return lookup;
        }

        private static void AddRows(
            List<TownBuilding> rows,
            List<MyHordesBuildingDto>? source,
            bool isBuilt,
            IReadOnlyDictionary<int, int> idBuildingByMhId,
            IReadOnlyDictionary<int, int> idItemByMhId,
            Action<int> onUnknownBuilding)
        {
            foreach (var dto in source ?? new List<MyHordesBuildingDto>())
            {
                if (!dto.Id.HasValue)
                {
                    continue;
                }
                if (!idBuildingByMhId.TryGetValue(dto.Id.Value, out var idBuilding))
                {
                    onUnknownBuilding(dto.Id.Value);
                    continue;
                }
                rows.Add(new TownBuilding
                {
                    IdBuilding = idBuilding,
                    IsBuilt = isBuilt,
                    PaCurrent = dto.PaCurrent,
                    ApRemaining = dto.Actions,
                    Life = dto.Life,
                    MaxLife = dto.MaxLife,
                    Def = dto.Def,
                    Level = dto.HasLevels,
                    Difficulty = dto.Difficulty,
                    ResourcesCurrent = SerializeResources(dto.ResourcesCurrent, idItemByMhId)
                });
            }
        }

        private static string? SerializeResources(List<MyHordesResourceRoot>? resources, IReadOnlyDictionary<int, int> idItemByMhId)
        {
            if (resources is null)
            {
                return null;
            }
            var known = resources
                .Where(resource => resource.Amount.HasValue && resource.Rsc?.Id is not null && idItemByMhId.ContainsKey(resource.Rsc.Id.Value))
                .Select(resource => new { itemId = idItemByMhId[resource.Rsc!.Id!.Value], count = resource.Amount!.Value })
                .ToList();
            return JsonConvert.SerializeObject(known);
        }
    }
}
