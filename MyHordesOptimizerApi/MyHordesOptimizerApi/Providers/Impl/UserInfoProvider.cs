using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Providers.Interfaces;
using System;

namespace MyHordesOptimizerApi.Providers.Impl
{
    public class UserInfoProvider : IUserInfoProvider
    {
        private string _userKey;
        public string UserKey { get => _userKey; set => _userKey = value; }

        private string _userId;
        public string UserId { get => _userId; set => _userId = value; }

        private string _userName;
        public string UserName { get => _userName; set => _userName = value; }

        public LastUpadteInfo GenerateLastUpdateInfo()
        {
            return new LastUpadteInfo()
            {
                UserId = UserId,
                UserName = UserName,
                UpdateTime = DateTime.UtcNow
            };
        }
    }
}
