using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.DailyProgram;
using System.Threading.Tasks;

namespace MyHordesOptimizerApi.Services.Interfaces
{
    public interface IDailyProgramService
    {
        Task<DailyProgramFactsDto> GetFactsAsync(int mapId, int day);
    }
}
