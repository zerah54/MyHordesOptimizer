using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.UserAvailability;
using MyHordesOptimizerApi.Repository.Interfaces;
using MyHordesOptimizerApi.Services.Interfaces.UserAvailability;
using System.Collections.Generic;

namespace MyHordesOptimizerApi.Services.Impl.UserAvailability
{
    public class UserAvailabilityService : IUserAvailabilityService
    {
        protected ILogger<UserAvailabilityService> Logger { get; private set; }
        protected IMyHordesOptimizerRepository MyHordesOptimizerRepository { get; set; }


        public UserAvailabilityService(ILogger<UserAvailabilityService> logger, IMyHordesOptimizerRepository firebaseRepository)
        {
            Logger = logger;
            MyHordesOptimizerRepository = firebaseRepository;
        }

        public void UpdateUserAvailability(int townId, int userId, List<MyHordesOptimizerUserAvailability> availabilities)
        {
            MyHordesOptimizerRepository.UpdateUserAvailability(townId, userId, availabilities);
        }

        public IEnumerable<MyHordesOptimizerUserAvailability> GetUserAvailabilities(int townId, int userId)
        {
            return MyHordesOptimizerRepository.GetUserAvailabilities(townId, userId);
        }
    }
}
