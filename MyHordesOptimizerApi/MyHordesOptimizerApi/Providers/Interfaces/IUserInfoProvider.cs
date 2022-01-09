using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;

namespace MyHordesOptimizerApi.Providers.Interfaces
{
    public interface IUserInfoProvider
    {
        string UserKey { get; set; }
        string UserId { get; set; }
        string UserName { get; set; }

        LastUpadteInfo GenerateLastUpdateInfo();
    }
}
