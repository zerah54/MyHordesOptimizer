using AStar;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using System.Collections.Generic;

namespace MyHordesOptimizerApi.Services.Interfaces
{
    public interface IMyHordesRuineService
    {
        List<Position> OptimizeRuinePath(RuineOptiPathRequestDto requestDto);
    }
}
