using MyHordesOptimizerApi.Models;
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

        public LastUpdateInfo GenerateLastUpdateInfo()
        {
            return new LastUpdateInfo()
            {
                IdUser = UserId,
                IdUserNavigation = new User()
                {
                    IdUser = UserId,
                    Name = UserName
                },
                DateUpdate = DateTime.UtcNow
            };
        }
    }
}
