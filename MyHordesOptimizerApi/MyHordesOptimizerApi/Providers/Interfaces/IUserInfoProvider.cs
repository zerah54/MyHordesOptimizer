using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Models;

namespace MyHordesOptimizerApi.Providers.Interfaces
{
    public interface IUserInfoProvider
    {
        string UserKey { get; set; }
        int UserId { get; set; }
        string UserName { get; set; }

        LastUpdateInfoDto GenerateLastUpdateInfo();
    }
}
