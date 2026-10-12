using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.SignalR;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Expeditions;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Expeditions.Request;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.MapRoutes;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.MapRoutes.Request;
using MyHordesOptimizerApi.Exceptions;
using MyHordesOptimizerApi.Models.Expeditions;
using MyHordesOptimizerApi.Providers.Interfaces;
using MyHordesOptimizerApi.Services.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;

namespace MyHordesOptimizerApiUnitTests.Expeditions.Fakes
{
    /// <summary>Fake minimal de HubCallerContext, seule ConnectionId est utilisée par ExpeditionsHub.</summary>
    public class FakeHubCallerContext : HubCallerContext
    {
        public FakeHubCallerContext(string connectionId, ClaimsPrincipal? user = null)
        {
            ConnectionId = connectionId;
            User = user;
        }

        public override string ConnectionId { get; }
        public override string? UserIdentifier => null;
        public override ClaimsPrincipal? User { get; }
        public override IDictionary<object, object?> Items { get; } = new Dictionary<object, object?>();
        public override IFeatureCollection Features => throw new NotSupportedException();
        public override CancellationToken ConnectionAborted => CancellationToken.None;
        public override void Abort() { }
    }

    /// <summary>Fake de IClientProxy : retient les messages envoyés (SendAsync est une extension basée sur SendCoreAsync).</summary>
    public class FakeClientProxy : IClientProxy
    {
        public List<(string Method, object?[] Args)> Sent { get; } = new();

        public Task SendCoreAsync(string method, object?[] args, CancellationToken cancellationToken = default)
        {
            Sent.Add((method, args));
            return Task.CompletedTask;
        }
    }

    /// <summary>Fake de IHubCallerClients : seul Group(...) est utilisé par ExpeditionsHub.</summary>
    public class FakeHubCallerClients : IHubCallerClients
    {
        private readonly FakeClientProxy _proxy = new();

        /// <summary>Proxy commun à toutes les cibles : ses messages envoyés, quel que soit le groupe.</summary>
        public FakeClientProxy Proxy => _proxy;

        public IClientProxy All => _proxy;
        public IClientProxy Caller => _proxy;
        public IClientProxy Others => _proxy;
        public IClientProxy AllExcept(IReadOnlyList<string> excludedConnectionIds) => _proxy;
        public IClientProxy Client(string connectionId) => _proxy;
        public IClientProxy Clients(IReadOnlyList<string> connectionIds) => _proxy;
        public IClientProxy Group(string groupName) => _proxy;
        public IClientProxy GroupExcept(string groupName, IReadOnlyList<string> excludedConnectionIds) => _proxy;
        public IClientProxy Groups(IReadOnlyList<string> groupNames) => _proxy;
        public IClientProxy OthersInGroup(string groupName) => _proxy;
        public IClientProxy User(string userId) => _proxy;
        public IClientProxy Users(IReadOnlyList<string> userIds) => _proxy;
    }

    /// <summary>Fake de IGroupManager : aucune opération de groupe réelle n'est requise pour ces tests.</summary>
    public class FakeGroupManager : IGroupManager
    {
        public Task AddToGroupAsync(string connectionId, string groupName, CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task RemoveFromGroupAsync(string connectionId, string groupName, CancellationToken cancellationToken = default) => Task.CompletedTask;
    }

    public class FakeUserInfoProvider : IUserInfoProvider
    {
        public string UserKey { get; set; } = string.Empty;
        public int UserId { get; set; }
        public string UserName { get; set; } = string.Empty;
        public SimpleMeTownDetailDto TownDetail { get; set; } = new();
        public LastUpdateInfoDto GenerateLastUpdateInfo() => throw new NotSupportedException();
    }

    /// <summary>
    /// Fake de IExpeditionService : la plupart des méthodes ne sont pas appelées par les tests du hub. Une partie
    /// enregistrée est renvoyée telle quelle, et <see cref="PendingMapRouteChanges"/> simule les tracés touchés.
    /// </summary>
    public class FakeExpeditionService : IExpeditionService
    {
        public List<MapRouteChangeDto> PendingMapRouteChanges { get; } = new();

        public void DeleteExpedition(int expeditionId) => throw new NotSupportedException();
        public Task<List<ExpeditionDto>> GetExpeditionsByDayAsync(int townId, int day) => throw new NotSupportedException();
        public List<ExpeditionDto> GetUserExpeditionsByDay(int townId, int userId, int day) => throw new NotSupportedException();
        public ExpeditionInhorenceModel ValidateExpeditions(int townId, int day) => throw new NotSupportedException();
        public Task<ExpeditionDto> SaveExpeditionAsync(ExpeditionRequestDto expedition, int idTown, int day) => throw new NotSupportedException();
        public Task<List<ExpeditionDto>> CopyExpeditionsAsync(int townId, int fromDay, int targetDay) => throw new NotSupportedException();
        public Task<ExpeditionCitizenDto> SaveExpeditionCitizenAsync(int expeditionPartId, ExpeditionCitizenRequestDto expeditionCitizen) => throw new NotSupportedException();
        public void DeleteExpeditionCitizen(int expeditionCitizenId) => throw new NotSupportedException();
        public Task<ExpeditionPartDto> SaveExpeditionPartAsync(int expeditionId, ExpeditionPartRequestDto expeditionPart) => Task.FromResult(new ExpeditionPartDto { Id = expeditionPart.Id, ExpeditionId = expeditionId, MapRouteId = expeditionPart.MapRouteId });
        public void DeleteExpeditionPart(int expeditionPartId) => throw new NotSupportedException();
        public Task<List<ExpeditionPartDto>> GetExpeditionPartsAsync(IReadOnlyCollection<int> expeditionPartIds) => Task.FromResult(expeditionPartIds.Select(id => new ExpeditionPartDto { Id = id }).ToList());
        public Task<List<ExpeditionOrderDto>> SaveCitizenOrdersAsync(int expeditionCitizenId, List<ExpeditionOrderDto> expeditionOrder) => throw new NotSupportedException();
        public Task<List<ExpeditionOrderDto>> SavePartOrdersAsync(int expeditionPartId, List<ExpeditionOrderDto> expeditionOrder) => throw new NotSupportedException();
        public void DeleteExpeditionOrder(int expeditionOrderId) => throw new NotSupportedException();
        public ExpeditionOrderDto UpdateExpeditionOrder(ExpeditionOrderDto expeditionOrderDto) => throw new NotSupportedException();
        public Task<ExpeditionBagDto> UpdateExpeditionBag(int citizenId, ExpeditionBagRequestDto expeditionBagDto) => throw new NotSupportedException();
        public List<ExpeditionBagDto> DeleteExpeditionBag(int bagId) => throw new NotSupportedException();
        public IReadOnlyList<MapRouteChangeDto> TakeMapRouteChanges()
        {
            var changes = PendingMapRouteChanges.ToList();
            PendingMapRouteChanges.Clear();
            return changes;
        }
    }

    /// <summary>Fake de ITownAccessService : accorde ou refuse tout selon <see cref="Allow"/>.</summary>
    public class FakeTownAccessService : ITownAccessService
    {
        public bool Allow { get; set; } = true;

        public void EnsureCanWriteTown(int resolvedIdTown, int? mapId)
        {
            if (!Allow)
            {
                throw new MhoForbiddenException("refusé");
            }
        }

        public Task EnsureCanWriteTownAsync(int resolvedIdTown, int? mapId)
        {
            EnsureCanWriteTown(resolvedIdTown, mapId);
            return Task.CompletedTask;
        }

        public Task<bool> CanWriteTownAsync(int resolvedIdTown, int? mapId) => Task.FromResult(Allow);

        public Task EnsureCanWriteMapAsync(int mapId) => EnsureCanWriteTownAsync(mapId, mapId);
    }

    /// <summary>Fake de IMapRouteService : enregistre en renvoyant la requête, ou lève <see cref="SaveException"/>.</summary>
    public class FakeMapRouteService : IMapRouteService
    {
        public Exception? SaveException { get; set; }
        public int DeletedRouteMapId { get; set; }
        /// <summary>Parties d'expédition liées au tracé enregistré.</summary>
        public List<int> LinkedPartIds { get; } = new();

        public Task<MapRoutesDto> GetMapRoutesAsync(int mapId) => throw new NotSupportedException();
        public Task<MapRouteAccessDto> GetAccessAsync(int mapId) => throw new NotSupportedException();
        public Task<MapRouteDto?> GetMapRouteAsync(int mapId, int routeId) => throw new NotSupportedException();

        public Task<MapRouteDto> SaveMapRouteAsync(int mapId, MapRouteRequestDto request)
        {
            if (SaveException is not null)
            {
                throw SaveException;
            }
            return Task.FromResult(new MapRouteDto
            {
                Id = request.Id ?? 1,
                Label = request.Label,
                Color = request.Color ?? "blue",
                Version = (request.Version ?? -1) + 1,
                LinkedParts = LinkedPartIds.Select(id => new MapRouteLinkedPartDto { PartId = id }).ToList()
            });
        }

        public Task<MapRouteDto> CopyGameRouteAsync(int mapId, int gameRouteId)
        {
            return Task.FromResult(new MapRouteDto { Id = 100 + gameRouteId, Label = "copie", Color = "blue", Version = 0 });
        }

        public Task<int> DeleteMapRouteAsync(int routeId) => Task.FromResult(DeletedRouteMapId);
    }
}
