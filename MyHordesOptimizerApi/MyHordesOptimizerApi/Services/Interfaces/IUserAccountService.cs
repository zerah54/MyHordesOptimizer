using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.UserAccount;

namespace MyHordesOptimizerApi.Services.Interfaces;

public interface IUserAccountService
{
    CitizenListPageResultDto GetCitizens(CitizenListQueryDto query);

    UserAccountPublicDto GetPublicProfile(int userId);

    UserPictosDto GetPictos(int userId, int? townId);
}
