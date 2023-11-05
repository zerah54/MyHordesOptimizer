using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Authentication;

namespace MyHordesOptimizerApi.Services.Interfaces
{
    public interface IAuthenticationService
    {
        TokenDto CreateToken(SimpleMeDto me);
    }
}
