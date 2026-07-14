using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.UserAccount;

namespace MyHordesOptimizerApi.Services.Interfaces;

public interface IUserAccountService
{
    UserAccountPublicDto GetPublicProfile(int userId);
}
