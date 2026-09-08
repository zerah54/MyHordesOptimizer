using System.Collections.Generic;
using System.Net;
using System.Threading.Tasks;
using MyHordesOptimizerApi.Dtos.MyHordes;
using MyHordesOptimizerApi.Dtos.MyHordes.Building;
using MyHordesOptimizerApi.Dtos.MyHordes.Items;
using MyHordesOptimizerApi.Dtos.MyHordes.Town;
using MyHordesOptimizerApi.Exceptions;
using MyHordesOptimizerApi.Repository.Interfaces;

namespace MyHordesOptimizerApiIntegrationTests.Fakes
{
    /// <summary>Simule une réponse MyHordes en erreur (429/503) sur GetMe, pour tester le repli BDD.</summary>
    public class ThrowingMyHordesApiRepository : IMyHordesApiRepository
    {
        private readonly HttpStatusCode _statusCode;
        private readonly string _message;

        public ThrowingMyHordesApiRepository(HttpStatusCode statusCode, string message)
        {
            _statusCode = statusCode;
            _message = message;
        }

        public Dictionary<string, MyHordesItem> GetItems() => new();
        public MyHordesUserDetailsDto GetMe() => throw new MyHordesApiException(_message, _statusCode);
        public MyHordesUserDetailsDto GetMapForToolsUpdate() => throw new MyHordesApiException(_message, _statusCode);
        public MyHordesUserDetailsDto GetMeIdentity() => throw new MyHordesApiException(_message, _statusCode);
        public MyHordesUserDetailsDto GetUserPictos(int userId) => throw new MyHordesApiException(_message, _statusCode);
        public List<MyHordesUserDto> GetUsersIdentity(List<int> ids) => new();
        public Dictionary<string, MyHordesApiPictoDto> GetPictos() => new();
        public Dictionary<string, MyHordesApiRuinDto> GetRuins() => new();
        public Task<Dictionary<string, MyHordesApiBuildingDto>> GetBuildingAsync() => Task.FromResult(new Dictionary<string, MyHordesApiBuildingDto>());
        public List<int> GetTownList(int? season = null) => new();
        public List<MyHordesTownDetailsDto> GetTownDetails(List<int> ids) => new();
        public MyHordesMap GetMapDetails(int mapId) => null;
    }
}
