using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.FataMorgana;
using System.Threading.Tasks;

namespace MyHordesOptimizerApi.Repository.Interfaces.ExternalTools
{
    public interface IFataMorganaRepository
    {
        Task UpdateAsync(FataMorganaUpdateRequestDto updateRequestDto);
    }
}
