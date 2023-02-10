using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Map;

namespace MyHordesOptimizerApi.Services.Interfaces
{
    public interface IMyHordesOptimizerMapService
    {
        LastUpdateInfo UpdateCell(int townId, MyHordesOptimizerCellUpdateDto updateRequest);
    }
}
