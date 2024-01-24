using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Expeditions;
using System.Threading.Tasks;

namespace MyHordesOptimizerApi.Services.Interfaces
{
    public interface IExpeditionService
    {
        Task<ExpeditionDto> SaveAsync(ExpeditionDto expedition, int idTown, int day);
    }
}
