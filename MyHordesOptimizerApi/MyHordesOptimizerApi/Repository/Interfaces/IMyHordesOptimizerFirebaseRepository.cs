using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using System.Collections.Generic;

namespace MyHordesOptimizerApi.Repository.Interfaces
{
    public interface IMyHordesOptimizerFirebaseRepository
    {
        void PatchTown(Town town);
        Town GetTown(int townId);
        void PatchHeroSkill(IEnumerable<HeroSkill> heroSkills);
    }
}
