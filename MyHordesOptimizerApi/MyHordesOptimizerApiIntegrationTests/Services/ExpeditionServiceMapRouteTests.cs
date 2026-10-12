using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AutoMapper;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Expeditions;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Expeditions.Request;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Map;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.MapRoutes;
using MyHordesOptimizerApi.Exceptions;
using MyHordesOptimizerApi.Extensions;
using MyHordesOptimizerApi.Models;
using MyHordesOptimizerApi.Models.Expeditions;
using MyHordesOptimizerApi.Providers.Interfaces;
using MyHordesOptimizerApi.Services.Impl;
using MyHordesOptimizerApi.Services.Impl.Locking;
using MyHordesOptimizerApi.Services.Impl.MapRoutes;
using MyHordesOptimizerApi.Services.Interfaces;
using MyHordesOptimizerApiIntegrationTests.ApplicationFactory;
using MyHordesOptimizerApiIntegrationTests.Controllers;
using Xunit;

namespace MyHordesOptimizerApiIntegrationTests.Services
{
    /// <summary>
    /// Lot 4 des tracés d'expédition : lien partie ↔ tracé (droits, une copie par jour, visibilité, direction,
    /// nouvelle version diffusée), copie d'un jour à l'autre, consignes par case et observateurs. Avec le vrai
    /// contrôle d'accès. Requiert les scripts 2026_10_05_map_routes.sql et 2026_10_05_map_routes_hero_fk.sql.
    /// </summary>
    public class ExpeditionServiceMapRouteTests : IClassFixture<MyHordesOptimizerApplicationFactory>
    {
        private const int Day = 5;
        private const int TownX = 20;
        private const int TownY = 20;

        private readonly MyHordesOptimizerApplicationFactory _factory;

        public ExpeditionServiceMapRouteTests(MyHordesOptimizerApplicationFactory factory)
        {
            _factory = factory;
        }

        private sealed record SeededTown(int TownId, int AliveUserId, int DeadUserId, int OutsiderUserId);

        /// <summary>Un scope par appel : MhoContext est Transient et capturé à la construction du service.</summary>
        private IExpeditionService NewService(int userId, int? tokenMapId)
        {
            var provider = _factory.Services.CreateScope().ServiceProvider;
            var userInfo = provider.GetRequiredService<IUserInfoProvider>();
            userInfo.UserId = userId;
            userInfo.TownDetail = tokenMapId.HasValue ? new SimpleMeTownDetailDto { TownId = tokenMapId.Value } : null!;
            return new ExpeditionService(
                provider.GetRequiredService<IServiceScopeFactory>(),
                provider.GetRequiredService<IMapper>(),
                userInfo,
                provider.GetRequiredService<ILogger<ExpeditionService>>(),
                provider.GetRequiredService<MhoContext>(),
                provider.GetRequiredService<TownSyncLock>(),
                new TownAccessService(provider.GetRequiredService<IServiceScopeFactory>(), userInfo));
        }

        private IExpeditionService AsAlive(SeededTown town) => NewService(town.AliveUserId, town.TownId);

        private MhoContext NewContext()
        {
            return _factory.Services.CreateScope().ServiceProvider.GetRequiredService<MhoContext>();
        }

        private SeededTown SeedTown()
        {
            var (townId, aliveUserId, deadUserId, outsiderUserId) = AttackTestSupport.SeedTown(NewContext(), Day);
            using var context = NewContext();
            var town = context.Towns.Single(candidate => candidate.IdTown == townId);
            town.X = TownX;
            town.Y = TownY;
            context.SaveChanges();
            return new SeededTown(townId, aliveUserId, deadUserId, outsiderUserId);
        }

        /// <summary>Tracé vers le nord : y absolu décroissant depuis la ville.</summary>
        private int SeedRoute(int townId, int authorId, bool isPrivate = false, bool isEditableByAll = false, int[]? sharedUserIds = null)
        {
            using var context = NewContext();
            var cells = new List<MapRoutePointDto> { new() { X = TownX, Y = TownY }, new() { X = TownX, Y = TownY - 1 }, new() { X = TownX, Y = TownY - 2 } };
            var route = new MapRoute
            {
                IdTown = townId,
                Label = "Nord 🧭",
                Color = "teal",
                IdAuthor = authorId,
                IsPrivate = isPrivate,
                IsEditableByAll = isEditableByAll,
                Cells = MapRouteJson.SerializePoints(cells),
                Stops = MapRouteJson.SerializeStops(new List<MapRouteStopDto> { new() { X = TownX, Y = TownY - 2, Mode = MapRouteStopModes.Best } }),
                Length = cells.Count - 1,
                MapRouteShares = (sharedUserIds ?? Array.Empty<int>()).Select(userId => new MapRouteShare { IdUser = userId }).ToList()
            };
            context.MapRoutes.Add(route);
            context.SaveChanges();
            return route.IdMapRoute;
        }

        /// <summary>Expédition du jour et sa partie par défaut.</summary>
        private async Task<(int ExpeditionId, int PartId)> SeedExpedition(SeededTown town, int day = Day)
        {
            var expedition = await AsAlive(town).SaveExpeditionAsync(new ExpeditionRequestDto { PartsId = new List<int>() }, town.TownId, day);
            return (expedition.Id!.Value, expedition.Parts!.Single().Id!.Value);
        }

        private static ExpeditionPartRequestDto PartRequest(int partId, int? mapRouteId)
        {
            return new ExpeditionPartRequestDto { Id = partId, OrdersId = new List<int>(), CitizensId = new List<int>(), MapRouteId = mapRouteId };
        }

        private MapRoute LoadRoute(int routeId)
        {
            using var context = NewContext();
            return context.MapRoutes.AsNoTracking().Include(route => route.MapRouteShares).Include(route => route.ExpeditionParts)
                .Single(route => route.IdMapRoute == routeId);
        }

        [Fact]
        public async Task SaveExpeditionPartAsync_TraceDeLaVille_LieLeResumeLaDirectionEtUneNouvelleVersion()
        {
            var town = SeedTown();
            var routeId = SeedRoute(town.TownId, town.AliveUserId);
            var (expeditionId, partId) = await SeedExpedition(town);
            var service = AsAlive(town);

            var part = await service.SaveExpeditionPartAsync(expeditionId, PartRequest(partId, routeId));

            part.MapRouteId.Should().Be(routeId);
            part.MapRoute!.Label.Should().Be("Nord 🧭");
            part.MapRoute.Cells.Should().HaveCount(3);
            part.MapRoute.Version.Should().Be(1);
            part.Path.Should().Be("Nord 🧭");
            part.Direction.Should().Be(DirectionEnum.North.GetDescription());
            service.TakeMapRouteChanges().Should().ContainSingle(change => change.Id == routeId && change.Version == 1);
            LoadRoute(routeId).ExpeditionParts.Select(linked => linked.IdExpeditionPart).Should().Equal(partId);
        }

        [Fact]
        public async Task SaveExpeditionPartAsync_MemeTrace_NeChangePasLaVersion()
        {
            var town = SeedTown();
            var routeId = SeedRoute(town.TownId, town.AliveUserId);
            var (expeditionId, partId) = await SeedExpedition(town);
            await AsAlive(town).SaveExpeditionPartAsync(expeditionId, PartRequest(partId, routeId));
            var service = AsAlive(town);

            var part = await service.SaveExpeditionPartAsync(expeditionId, PartRequest(partId, routeId));

            part.MapRouteId.Should().Be(routeId);
            part.MapRoute!.Version.Should().Be(1);
            service.TakeMapRouteChanges().Should().BeEmpty();
        }

        [Fact]
        public async Task SaveExpeditionPartAsync_NouveauLien_DirectionDemandeeIgnoree()
        {
            var town = SeedTown();
            var routeId = SeedRoute(town.TownId, town.AliveUserId);
            var (expeditionId, partId) = await SeedExpedition(town);
            var request = PartRequest(partId, routeId);
            request.Direction = DirectionEnum.South.GetDescription();

            var part = await AsAlive(town).SaveExpeditionPartAsync(expeditionId, request);

            part.Direction.Should().Be(DirectionEnum.North.GetDescription());
        }

        [Fact]
        public async Task SaveExpeditionPartAsync_MemeTrace_DirectionDemandeeIgnoree()
        {
            var town = SeedTown();
            var routeId = SeedRoute(town.TownId, town.AliveUserId);
            var (expeditionId, partId) = await SeedExpedition(town);
            await AsAlive(town).SaveExpeditionPartAsync(expeditionId, PartRequest(partId, routeId));
            var request = PartRequest(partId, routeId);
            request.Direction = DirectionEnum.South.GetDescription();

            var part = await AsAlive(town).SaveExpeditionPartAsync(expeditionId, request);

            part.Direction.Should().Be(DirectionEnum.North.GetDescription());
        }

        [Fact]
        public async Task SaveExpeditionPartAsync_SansTrace_DirectionDemandeeConservee()
        {
            var town = SeedTown();
            var (expeditionId, partId) = await SeedExpedition(town);
            var request = PartRequest(partId, mapRouteId: null);
            request.Direction = DirectionEnum.South.GetDescription();

            var part = await AsAlive(town).SaveExpeditionPartAsync(expeditionId, request);

            part.Direction.Should().Be(DirectionEnum.South.GetDescription());
        }

        [Fact]
        public async Task SaveExpeditionPartAsync_TracePriveDeLAuteur_DevientVisibleDeToutLaVille()
        {
            var town = SeedTown();
            var routeId = SeedRoute(town.TownId, town.AliveUserId, isPrivate: true, sharedUserIds: new[] { town.DeadUserId });
            var (expeditionId, partId) = await SeedExpedition(town);

            await AsAlive(town).SaveExpeditionPartAsync(expeditionId, PartRequest(partId, routeId));

            var route = LoadRoute(routeId);
            route.IsPrivate.Should().BeFalse();
            route.MapRouteShares.Should().BeEmpty();
        }

        [Fact]
        public async Task SaveExpeditionPartAsync_TracePriveDUnAutreNonModifiable_Refuse()
        {
            var town = SeedTown();
            var routeId = SeedRoute(town.TownId, town.DeadUserId, isPrivate: true, isEditableByAll: false, sharedUserIds: new[] { town.AliveUserId });
            var (expeditionId, partId) = await SeedExpedition(town);

            Func<Task> act = () => AsAlive(town).SaveExpeditionPartAsync(expeditionId, PartRequest(partId, routeId));

            await act.Should().ThrowAsync<MhoForbiddenException>();
            LoadRoute(routeId).IsPrivate.Should().BeTrue();
        }

        [Fact]
        public async Task SaveExpeditionPartAsync_TracePriveNonVisible_Refuse()
        {
            var town = SeedTown();
            var routeId = SeedRoute(town.TownId, town.DeadUserId, isPrivate: true, isEditableByAll: true);
            var (expeditionId, partId) = await SeedExpedition(town);

            Func<Task> act = () => AsAlive(town).SaveExpeditionPartAsync(expeditionId, PartRequest(partId, routeId));

            await act.Should().ThrowAsync<MhoForbiddenException>();
        }

        [Fact]
        public async Task SaveExpeditionPartAsync_TraceDUneAutreVille_Refuse()
        {
            var townA = SeedTown();
            var townB = SeedTown();
            var routeOfB = SeedRoute(townB.TownId, townB.AliveUserId);
            var (expeditionId, partId) = await SeedExpedition(townA);

            Func<Task> act = () => AsAlive(townA).SaveExpeditionPartAsync(expeditionId, PartRequest(partId, routeOfB));

            await act.Should().ThrowAsync<MhoForbiddenException>();
        }

        [Fact]
        public async Task SaveExpeditionPartAsync_TraceDejaLieAUnAutreJour_Refuse()
        {
            var town = SeedTown();
            var routeId = SeedRoute(town.TownId, town.AliveUserId);
            var (tomorrowExpeditionId, tomorrowPartId) = await SeedExpedition(town, day: Day + 1);
            await AsAlive(town).SaveExpeditionPartAsync(tomorrowExpeditionId, PartRequest(tomorrowPartId, routeId));
            var (expeditionId, partId) = await SeedExpedition(town);

            Func<Task> act = () => AsAlive(town).SaveExpeditionPartAsync(expeditionId, PartRequest(partId, routeId));

            await act.Should().ThrowAsync<MhoTechnicalException>();
        }

        [Fact]
        public async Task SaveExpeditionPartAsync_DeuxPartiesDuMemeJour_Accepte()
        {
            var town = SeedTown();
            var routeId = SeedRoute(town.TownId, town.AliveUserId);
            var (expeditionId, partId) = await SeedExpedition(town);
            var (otherExpeditionId, otherPartId) = await SeedExpedition(town);
            await AsAlive(town).SaveExpeditionPartAsync(expeditionId, PartRequest(partId, routeId));

            var other = await AsAlive(town).SaveExpeditionPartAsync(otherExpeditionId, PartRequest(otherPartId, routeId));

            other.MapRouteId.Should().Be(routeId);
            LoadRoute(routeId).ExpeditionParts.Should().HaveCount(2);
        }

        [Fact]
        public async Task SaveExpeditionPartAsync_Delier_NouvelleVersionDuTraceQuitte()
        {
            var town = SeedTown();
            var routeId = SeedRoute(town.TownId, town.AliveUserId);
            var (expeditionId, partId) = await SeedExpedition(town);
            await AsAlive(town).SaveExpeditionPartAsync(expeditionId, PartRequest(partId, routeId));
            var service = AsAlive(town);

            var part = await service.SaveExpeditionPartAsync(expeditionId, PartRequest(partId, mapRouteId: null));

            part.MapRouteId.Should().BeNull();
            part.MapRoute.Should().BeNull();
            service.TakeMapRouteChanges().Should().ContainSingle(change => change.Id == routeId && change.Version == 2);
            var route = LoadRoute(routeId);
            route.Version.Should().Be(2);
            route.ExpeditionParts.Should().BeEmpty();
        }

        [Fact]
        public async Task DeleteExpeditionPart_PartieLiee_NouvelleVersionDuTrace()
        {
            var town = SeedTown();
            var routeId = SeedRoute(town.TownId, town.AliveUserId);
            var (expeditionId, partId) = await SeedExpedition(town);
            await AsAlive(town).SaveExpeditionPartAsync(expeditionId, PartRequest(partId, routeId));
            var service = AsAlive(town);

            service.DeleteExpeditionPart(partId);

            service.TakeMapRouteChanges().Should().ContainSingle(change => change.Id == routeId && change.Version == 2);
        }

        [Fact]
        public async Task CopyExpeditionsAsync_PartieLiee_CopieLeTraceEtLesConsignesParCase()
        {
            var town = SeedTown();
            var routeId = SeedRoute(town.TownId, town.AliveUserId);
            var (expeditionId, partId) = await SeedExpedition(town);
            await AsAlive(town).SaveExpeditionPartAsync(expeditionId, PartRequest(partId, routeId));
            int itemId;
            using (var context = NewContext())
            {
                itemId = context.Items.First().IdItem;
            }
            await AsAlive(town).SavePartOrdersAsync(partId, new List<ExpeditionOrderDto>
            {
                new() { Type = "checkbox", Text = "texte", Position = 0 },
                new() { Type = "checkbox", Position = 1, X = TownX, Y = TownY - 1, Kind = ExpeditionOrderKinds.Pick, ItemId = itemId, Quantity = 2 }
            });
            var service = AsAlive(town);

            var copies = await service.CopyExpeditionsAsync(town.TownId, fromDay: Day, targetDay: Day + 1);

            var copiedPart = copies.Single().Parts!.Single();
            copiedPart.MapRouteId.Should().NotBeNull().And.NotBe(routeId);
            copiedPart.MapRoute!.Label.Should().Be("Nord 🧭");
            copiedPart.MapRoute.Version.Should().Be(0);
            copiedPart.Direction.Should().Be(DirectionEnum.North.GetDescription());
            var typed = copiedPart.Orders!.Single(order => order.Kind is not null);
            typed.Position.Should().Be(1);
            typed.X.Should().Be(TownX);
            typed.Y.Should().Be(TownY - 1);
            typed.Kind.Should().Be(ExpeditionOrderKinds.Pick);
            typed.ItemId.Should().Be(itemId);
            typed.Quantity.Should().Be(2);
            typed.IsDone.Should().BeFalse();
            service.TakeMapRouteChanges().Should().ContainSingle(change => change.Id == copiedPart.MapRouteId);
            LoadRoute(routeId).ExpeditionParts.Select(linked => linked.IdExpeditionPart).Should().Equal(partId);
            var copy = LoadRoute(copiedPart.MapRouteId!.Value);
            copy.IdAuthor.Should().Be(town.AliveUserId);
            copy.Cells.Should().Be(LoadRoute(routeId).Cells);
        }

        [Fact]
        public async Task SavePartOrdersAsync_ConsigneTypeeSurUneCase_Enregistree()
        {
            var town = SeedTown();
            var (_, partId) = await SeedExpedition(town);

            var orders = await AsAlive(town).SavePartOrdersAsync(partId, new List<ExpeditionOrderDto>
            {
                new() { Type = "checkbox", X = 3, Y = 4, Kind = ExpeditionOrderKinds.Hero, HeroSkill = "hero_generic_rescue" },
                new() { Type = "checkbox", X = 3, Y = 4, Kind = ExpeditionOrderKinds.Wait, TargetUserId = town.DeadUserId }
            });

            orders.Should().HaveCount(2);
            orders.Single(order => order.Kind == ExpeditionOrderKinds.Hero).HeroSkill.Should().Be("hero_generic_rescue");
            orders.Single(order => order.Kind == ExpeditionOrderKinds.Wait).TargetUserId.Should().Be(town.DeadUserId);
        }

        [Fact]
        public async Task SavePartOrdersAsync_CaseHorsDeLaCarte_Refuse()
        {
            var town = SeedTown();
            var (_, partId) = await SeedExpedition(town);

            Func<Task> act = () => AsAlive(town).SavePartOrdersAsync(partId, new List<ExpeditionOrderDto> { new() { Type = "text", Text = "loin", X = 40, Y = 0 } });

            await act.Should().ThrowAsync<MhoTechnicalException>();
        }

        [Fact]
        public async Task SavePartOrdersAsync_CitoyenAAttendreEtranger_Refuse()
        {
            var town = SeedTown();
            var (_, partId) = await SeedExpedition(town);

            Func<Task> act = () => AsAlive(town).SavePartOrdersAsync(partId, new List<ExpeditionOrderDto>
            {
                new() { Type = "checkbox", Kind = ExpeditionOrderKinds.Wait, TargetUserId = town.OutsiderUserId }
            });

            await act.Should().ThrowAsync<MhoTechnicalException>();
        }

        [Fact]
        public async Task SavePartOrdersAsync_ObjetInconnu_Refuse()
        {
            var town = SeedTown();
            var (_, partId) = await SeedExpedition(town);

            Func<Task> act = () => AsAlive(town).SavePartOrdersAsync(partId, new List<ExpeditionOrderDto>
            {
                new() { Type = "checkbox", Kind = ExpeditionOrderKinds.Use, ItemId = int.MaxValue }
            });

            await act.Should().ThrowAsync<MhoTechnicalException>();
        }

        [Fact]
        public async Task UpdateExpeditionOrder_NeChangeNiLaCaseNiLeType()
        {
            var town = SeedTown();
            var (_, partId) = await SeedExpedition(town);
            var saved = (await AsAlive(town).SavePartOrdersAsync(partId, new List<ExpeditionOrderDto>
            {
                new() { Type = "checkbox", X = 3, Y = 4, Kind = ExpeditionOrderKinds.Camp }
            })).Single();

            var updated = AsAlive(town).UpdateExpeditionOrder(new ExpeditionOrderDto { Id = saved.Id, Type = "checkbox", IsDone = true, X = 39, Y = 39, Kind = ExpeditionOrderKinds.Explore });

            updated.IsDone.Should().BeTrue();
            updated.X.Should().Be(3);
            updated.Y.Should().Be(4);
            updated.Kind.Should().Be(ExpeditionOrderKinds.Camp);
        }

        [Fact]
        public async Task GetExpeditionsByDayAsync_Observateur_SansTrace_Citoyen_AvecTrace()
        {
            var town = SeedTown();
            var routeId = SeedRoute(town.TownId, town.AliveUserId);
            var (expeditionId, partId) = await SeedExpedition(town);
            await AsAlive(town).SaveExpeditionPartAsync(expeditionId, PartRequest(partId, routeId));

            var asCitizen = await AsAlive(town).GetExpeditionsByDayAsync(town.TownId, Day);
            var asObserver = await NewService(town.OutsiderUserId, tokenMapId: null).GetExpeditionsByDayAsync(town.TownId, Day);

            asCitizen.Single().Parts!.Single().MapRoute!.Id.Should().Be(routeId);
            var observedPart = asObserver.Single().Parts!.Single();
            observedPart.MapRouteId.Should().BeNull();
            observedPart.MapRoute.Should().BeNull();
            observedPart.Path.Should().BeNull();
        }
    }
}
