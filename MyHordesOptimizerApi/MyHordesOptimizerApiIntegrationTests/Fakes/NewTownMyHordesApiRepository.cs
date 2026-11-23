using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using MyHordesOptimizerApi.Dtos.MyHordes;
using MyHordesOptimizerApi.Dtos.MyHordes.Building;
using MyHordesOptimizerApi.Dtos.MyHordes.Items;
using MyHordesOptimizerApi.Dtos.MyHordes.Town;
using MyHordesOptimizerApi.Providers.Interfaces;
using MyHordesOptimizerApi.Repository.Interfaces;

namespace MyHordesOptimizerApiIntegrationTests.Fakes
{
    /// <summary>Renvoie une ville 5x5 complète (citoyen, cadavre, banque, une zone, la défense) sur GetMe et GetMapForToolsUpdate, pour tester sa création.</summary>
    public class NewTownMyHordesApiRepository : IMyHordesApiRepository
    {
        private readonly int _mapId;
        private readonly int _userId;
        private readonly string _userName;
        private readonly int _cadaverId;
        private readonly MyHordesItem _bankItem;
        private readonly int _season;
        private readonly IUserInfoProvider? _userInfoProvider;

        public NewTownMyHordesApiRepository(int mapId, int userId, string userName, int cadaverId, MyHordesItem bankItem, int season, IUserInfoProvider? userInfoProvider = null)
        {
            _mapId = mapId;
            _userId = userId;
            _userName = userName;
            _cadaverId = cadaverId;
            _bankItem = bankItem;
            _season = season;
            _userInfoProvider = userInfoProvider;
        }

        public Dictionary<string, MyHordesItem> GetItems() => new();
        // Reproduit l'effet de bord du vrai GetMe(), dont dépend le login (UserInfoProvider.UserId/UserName).
        public MyHordesUserDetailsDto GetMe()
        {
            if (_userInfoProvider != null)
            {
                _userInfoProvider.UserId = _userId;
                _userInfoProvider.UserName = _userName;
            }
            return Build();
        }
        public MyHordesUserDetailsDto GetMapForToolsUpdate() => Build();
        public MyHordesUserDetailsDto GetMeIdentity() => Build();
        public MyHordesUserDetailsDto GetUserPictos(int userId)
        {
            Interlocked.Increment(ref _userPictosCallCount);
            return Build();
        }

        private int _userPictosCallCount;
        public int UserPictosCallCount => Volatile.Read(ref _userPictosCallCount);
        public List<MyHordesUserDto> GetUsersIdentity(List<int> ids) => new();
        public Dictionary<string, MyHordesApiPictoDto> GetPictos() => new();
        public Dictionary<string, MyHordesApiRuinDto> GetRuins() => new();
        public Task<Dictionary<string, MyHordesApiBuildingDto>> GetBuildingAsync() => Task.FromResult(new Dictionary<string, MyHordesApiBuildingDto>());
        public List<int> GetTownList(int? season = null) => new();
        public List<int> GetAlphaTownList() => new();
        public List<MyHordesTownDetailsDto> GetTownDetails(List<int> ids) => new();
        public MyHordesMap GetMapDetails(int mapId) => null!;

        // Une instance par appel : la création écrit dans le DTO (Map.LastUpdateInfo).
        private MyHordesUserDetailsDto Build() => new()
        {
            Id = _userId,
            Name = _userName,
            MapId = _mapId,
            Map = new MyHordesMap
            {
                Id = _mapId,
                Wid = 5,
                Hei = 5,
                Days = 1,
                Season = _season,
                City = new MyHordesCity
                {
                    X = 2,
                    Y = 2,
                    Name = "test-town-" + _mapId,
                    Type = "small",
                    Bank = new List<MyHordesItem> { _bankItem },
                    Defense = new MyHordesDefense { Total = 42 }
                },
                Citizens = new List<MyHordesUserDto>
                {
                    new() { Id = _userId, Name = _userName, Job = new MyHordesJob { Uid = "dig" } }
                },
                Cadavers = new List<MyHordesCitizenRankingDto>
                {
                    new() { Id = _cadaverId, Name = _userName + "-cadavre" }
                },
                Zones = new List<MyHordesZone> { new() { X = 3, Y = 2, Danger = 2 } }
            }
        };
    }
}
