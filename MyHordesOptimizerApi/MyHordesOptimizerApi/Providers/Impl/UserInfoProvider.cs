using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Providers.Interfaces;
using System;

namespace MyHordesOptimizerApi.Providers.Impl
{
    public class UserInfoProvider : IUserInfoProvider
    {
        private string _userKey;
        public string UserKey { get => _userKey; set => _userKey = value; }

        private int _userId;
        public int UserId { get => _userId; set => _userId = value; }

        private string _userName;
        public string UserName { get => _userName; set => _userName = value; }

        public SimpleMeTownDetailDto TownDetail { get; set; }

        public LastUpdateInfoDto GenerateLastUpdateInfo()
        {
            return new LastUpdateInfoDto()
            {
                UserId = UserId,
                UpdateTime = DateTime.UtcNow,
                UserName = UserName
            };
        }
    }
}
