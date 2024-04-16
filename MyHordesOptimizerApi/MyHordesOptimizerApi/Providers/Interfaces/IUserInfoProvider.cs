using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;

namespace MyHordesOptimizerApi.Providers.Interfaces
{
    public interface IUserInfoProvider
    {
        string UserKey { get; set; }
        int UserId { get; set; }
        string UserName { get; set; }
        SimpleMeTownDetailDto TownDetail { get; set; }

        LastUpdateInfoDto GenerateLastUpdateInfo();
    }
}
