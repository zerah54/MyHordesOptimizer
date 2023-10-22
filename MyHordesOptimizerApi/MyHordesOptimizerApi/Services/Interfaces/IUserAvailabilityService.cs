using System.Collections.Generic;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.UserAvailability;

namespace MyHordesOptimizerApi.Services.Interfaces.UserAvailability
{
    public interface IUserAvailabilityService
    {
        void UpdateUserAvailability(int townId, int userId, List<MyHordesOptimizerUserAvailability> availability);
        IEnumerable<MyHordesOptimizerUserAvailability> GetUserAvailabilities(int townId, int userId);
    }
}
