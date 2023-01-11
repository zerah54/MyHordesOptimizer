using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using System.Collections.Generic;

namespace MyHordesOptimizerApi.Services.Interfaces
{
    public interface IMyHordesOptimizerParametersService
    {
        IEnumerable<ParametersDto> GetParameters();
    }
}
