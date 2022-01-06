using MyHordesOptimizerApi.Providers.Interfaces;

namespace MyHordesOptimizerApi.Providers.Impl
{
    public class UserKeyProvider : IUserKeyProvider
    {
        private string _userKey;
        public string UserKey { get => _userKey; set => _userKey = value; }

        private string _userId;
        public string UserId { get => _userId; set => _userId = value; }
    }
}
