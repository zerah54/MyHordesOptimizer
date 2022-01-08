﻿using MyHordesOptimizerApi.Dtos.MyHordes.MyHordesOptimizer;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using System.Collections.Generic;

namespace MyHordesOptimizerApi.Repository.Interfaces
{
    public interface IMyHordesOptimizerFirebaseRepository
    {
        void PatchTown(Town town);
        Town GetTown(int townId);
        void PatchHeroSkill(IEnumerable<HeroSkill> heroSkills);
        Dictionary<string, HeroSkill> GetHeroSkills();
        void PatchItems(List<Item> items);
        Dictionary<string, Item> GetItems();
    }
}
