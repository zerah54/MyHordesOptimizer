using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.ZenHordes;
using System.Threading.Tasks;

namespace MyHordesOptimizerApi.Repository.Interfaces.ExternalTools
{
    public interface IZenHordesRepository
    {
        Task UpdateAsync(ZenHordesUpdateRequestDto updateRequest);
    }
}
