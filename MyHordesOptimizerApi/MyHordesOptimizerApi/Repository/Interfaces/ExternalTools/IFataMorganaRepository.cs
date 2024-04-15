using System.Threading.Tasks;

namespace MyHordesOptimizerApi.Repository.Interfaces.ExternalTools
{
    public interface IFataMorganaRepository
    {
        Task UpdateAsync(bool updateInChaos = false, int? chaosX = null, int? chaosY = null);
    }
}
