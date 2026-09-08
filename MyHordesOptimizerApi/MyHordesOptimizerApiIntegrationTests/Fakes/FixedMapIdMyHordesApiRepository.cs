using System.Collections.Generic;
using System.Threading.Tasks;
using MyHordesOptimizerApi.Dtos.MyHordes;
using MyHordesOptimizerApi.Dtos.MyHordes.Building;
using MyHordesOptimizerApi.Dtos.MyHordes.Items;
using MyHordesOptimizerApi.Dtos.MyHordes.Town;
using MyHordesOptimizerApi.Repository.Interfaces;

namespace MyHordesOptimizerApiIntegrationTests.Fakes
{
    /// <summary>Renvoie un MapId fixe sur GetMapForToolsUpdate, pour tester la détection de dérive de TownId.</summary>
    public class FixedMapIdMyHordesApiRepository : IMyHordesApiRepository
    {
        private readonly int _mapId;
        private readonly int _userId;
        private readonly string _userName;

        public FixedMapIdMyHordesApiRepository(int mapId, int userId, string userName)
        {
            _mapId = mapId;
            _userId = userId;
            _userName = userName;
        }

        public Dictionary<string, MyHordesItem> GetItems() => new();
        public MyHordesUserDetailsDto GetMe() => Build();
        public MyHordesUserDetailsDto GetMapForToolsUpdate() => Build();
        public MyHordesUserDetailsDto GetMeIdentity() => Build();
        public MyHordesUserDetailsDto GetUserPictos(int userId) => Build();
        public List<MyHordesUserDto> GetUsersIdentity(List<int> ids) => new();
        public Dictionary<string, MyHordesApiPictoDto> GetPictos() => new();
        public Dictionary<string, MyHordesApiRuinDto> GetRuins() => new();
        public Task<Dictionary<string, MyHordesApiBuildingDto>> GetBuildingAsync() => Task.FromResult(new Dictionary<string, MyHordesApiBuildingDto>());
        public List<int> GetTownList(int? season = null) => new();
        public List<MyHordesTownDetailsDto> GetTownDetails(List<int> ids) => new();
        public MyHordesMap GetMapDetails(int mapId) => null;

        private MyHordesUserDetailsDto Build() => new()
        {
            Id = _userId,
            Name = _userName,
            MapId = _mapId,
            // Avatar/Job : régression I1 (revue finale) — GetMapForToolsUpdate() ne les demandait pas
            // à la racine, un token réémis via ce chemin perdait donc jobDetails/avatar côté addon.
            Avatar = "https://example.com/avatar.png",
            Job = new MyHordesJob
            {
                Id = 1,
                Uid = "dig",
                Name = new MyHordesLangString { Fr = "Fouineur" },
                Desc = new MyHordesLangString { Fr = "Fouille les décombres" }
            },
            Map = new MyHordesMap
            {
                // Id : régression I1 (revue finale) — GetMapForToolsUpdate() demande désormais `id`
                // dans map.fields(...), donc le vrai appel HTTP le renvoie ; sans lui, TownId retombe
                // à 0 dans MyHordesMappingProfiles (mappé depuis Map.Id, pas depuis le mapId racine).
                Id = _mapId,
                Days = 1,
                City = new MyHordesCity(),
                Citizens = new List<MyHordesUserDto>(),
                Cadavers = new List<MyHordesCitizenRankingDto>(),
                Zones = new List<MyHordesZone>()
            }
        };
    }
}
