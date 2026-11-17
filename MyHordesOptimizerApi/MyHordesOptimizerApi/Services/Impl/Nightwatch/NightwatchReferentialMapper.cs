using MyHordesOptimizerApi.Data.Nightwatch;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Nightwatch;
using System.Collections.Generic;
using System.Linq;

namespace MyHordesOptimizerApi.Services.Impl.Nightwatch
{
    /// <summary>Convertit le fichier de référence en DTO ; les objets sont clés par IdItem, les uids inconnus du catalogue sont ignorés.</summary>
    public static class NightwatchReferentialMapper
    {
        public static NightwatchReferentialDto Map(NightwatchReferentialCodeModel code, IReadOnlyDictionary<string, int> idItemByUid)
        {
            return new NightwatchReferentialDto
            {
                BaseRisk = code.BaseRisk,
                Fatigue = code.Fatigue,
                FatiguePro = code.FatiguePro,
                Statuses = code.Statuses.ToDictionary(pair => pair.Key, pair => new NightwatchStatusDefDto
                {
                    Defense = pair.Value.Defense, DeathRisk = pair.Value.DeathRisk, Source = pair.Value.Source
                }),
                Items = code.Items
                    .Where(pair => idItemByUid.ContainsKey(pair.Key))
                    .ToDictionary(pair => idItemByUid[pair.Key], pair => new NightwatchItemDefDto
                    {
                        Defense = pair.Value.Defense, Usage = pair.Value.Usage, RepairPa = pair.Value.RepairPa, RepairPaSource = pair.Value.RepairPaSource, IsEssential = pair.Value.IsEssential,
                        Batteries = pair.Value.Batteries, Water = pair.Value.Water, WatchImpact = pair.Value.WatchImpact,
                        Cumulative = pair.Value.Cumulative, Source = pair.Value.Source
                    }),
                WatcherCapByRoundPathLevel = new Dictionary<int, int>(code.WatcherCapByRoundPathLevel),
                RoundPathLevel3Bonus = code.RoundPathLevel3Bonus,
                GuardRoomBonus = code.GuardRoomBonus,
                SprinklerMalus = code.SprinklerMalus,
                BathBonus = code.BathBonus,
                DiscourseDefense = code.DiscourseDefense,
                ItemDefenseRequiresBuildingUid = code.ItemDefenseRequiresBuildingUid,
                DefenseBonuses = code.DefenseBonuses.Select(bonus => new NightwatchDefenseBonusDto
                {
                    BuildingUid = bonus.BuildingUid,
                    Factor = bonus.Factor,
                    IdItems = bonus.ItemUids.Where(idItemByUid.ContainsKey).Select(uid => idItemByUid[uid]).ToList()
                }).ToList()
            };
        }
    }
}
