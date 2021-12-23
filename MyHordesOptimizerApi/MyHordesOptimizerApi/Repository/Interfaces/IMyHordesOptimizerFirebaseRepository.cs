using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;

namespace MyHordesOptimizerApi.Repository.Interfaces
{
    public interface IMyHordesOptimizerFirebaseRepository
    {
        void PatchTown(Town town);
        Town GetTown(int townId);
    }
}
