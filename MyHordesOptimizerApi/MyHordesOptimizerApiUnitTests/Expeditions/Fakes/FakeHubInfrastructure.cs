using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.SignalR;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Expeditions;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Expeditions.Request;
using MyHordesOptimizerApi.Models.Expeditions;
using MyHordesOptimizerApi.Providers.Interfaces;
using MyHordesOptimizerApi.Services.Interfaces;
using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;

namespace MyHordesOptimizerApiUnitTests.Expeditions.Fakes
{
    /// <summary>Fake minimal de HubCallerContext, seule ConnectionId est utilisée par ExpeditionsHub.</summary>
    public class FakeHubCallerContext : HubCallerContext
    {
        public FakeHubCallerContext(string connectionId)
        {
            ConnectionId = connectionId;
        }

        public override string ConnectionId { get; }
        public override string? UserIdentifier => null;
        public override ClaimsPrincipal? User => null;
        public override IDictionary<object, object?> Items { get; } = new Dictionary<object, object?>();
        public override IFeatureCollection Features => throw new NotSupportedException();
        public override CancellationToken ConnectionAborted => CancellationToken.None;
        public override void Abort() { }
    }

    /// <summary>Fake de IClientProxy qui ne fait rien : suffisant pour SendAsync (extension basée sur SendCoreAsync).</summary>
    public class FakeClientProxy : IClientProxy
    {
        public Task SendCoreAsync(string method, object?[] args, CancellationToken cancellationToken = default) => Task.CompletedTask;
    }

    /// <summary>Fake de IHubCallerClients : seul Group(...) est utilisé par ExpeditionsHub.</summary>
    public class FakeHubCallerClients : IHubCallerClients
    {
        private readonly FakeClientProxy _proxy = new();

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

    /// <summary>Fake de IExpeditionService : aucune méthode n'est appelée par OnConnectedAsync/OnDisconnectedAsync.</summary>
    public class FakeExpeditionService : IExpeditionService
    {
        public void DeleteExpedition(int expeditionId) => throw new NotSupportedException();
        public List<ExpeditionDto> GetExpeditionsByDay(int townId, int day) => throw new NotSupportedException();
        public List<ExpeditionDto> GetUserExpeditionsByDay(int townId, int userId, int day) => throw new NotSupportedException();
        public ExpeditionInhorenceModel ValidateExpeditions(int townId, int day) => throw new NotSupportedException();
        public Task<ExpeditionDto> SaveExpeditionAsync(ExpeditionRequestDto expedition, int idTown, int day) => throw new NotSupportedException();
        public Task<List<ExpeditionDto>> CopyExpeditionsAsync(int townId, int fromDay, int targetDay) => throw new NotSupportedException();
        public Task<ExpeditionCitizenDto> SaveExpeditionCitizenAsync(int expeditionPartId, ExpeditionCitizenRequestDto expeditionCitizen) => throw new NotSupportedException();
        public void DeleteExpeditionCitizen(int expeditionCitizenId) => throw new NotSupportedException();
        public Task<ExpeditionPartDto> SaveExpeditionPartAsync(int expeditionId, ExpeditionPartRequestDto expeditionPart) => throw new NotSupportedException();
        public void DeleteExpeditionPart(int expeditionPartId) => throw new NotSupportedException();
        public Task<List<ExpeditionOrderDto>> SaveCitizenOrdersAsync(int expeditionCitizenId, List<ExpeditionOrderDto> expeditionOrder) => throw new NotSupportedException();
        public Task<List<ExpeditionOrderDto>> SavePartOrdersAsync(int expeditionPartId, List<ExpeditionOrderDto> expeditionOrder) => throw new NotSupportedException();
        public void DeleteExpeditionOrder(int expeditionOrderId) => throw new NotSupportedException();
        public ExpeditionOrderDto UpdateExpeditionOrder(ExpeditionOrderDto expeditionOrderDto) => throw new NotSupportedException();
        public ExpeditionBagDto UpdateExpeditionBag(int citizenId, ExpeditionBagRequestDto expeditionBagDto) => throw new NotSupportedException();
        public List<ExpeditionBagDto> DeleteExpeditionBag(int bagId) => throw new NotSupportedException();
    }
}
