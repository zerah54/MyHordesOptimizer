using System.Threading.Tasks;

namespace MyHordesOptimizerApi.Repository.Interfaces.ExternalTools
{
    public interface IFataMorganaRepository
    {
        Task UpdateAsync(int chaosX, int chaosY, int deadZombie);
        Task UpdateAsync();
    }
}
