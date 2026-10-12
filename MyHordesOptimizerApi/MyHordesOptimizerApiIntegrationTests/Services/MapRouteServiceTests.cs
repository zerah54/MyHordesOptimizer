using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AutoMapper;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using MyHordesOptimizerApi;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Map;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.MapRoutes;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.MapRoutes.Request;
using MyHordesOptimizerApi.Exceptions;
using MyHordesOptimizerApi.Models;
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
    /// Tracés d'expédition avec le vrai contrôle d'accès. Requiert le script 2026_10_05_map_routes.sql sur la
    /// base de test.
    /// </summary>
    public class MapRouteServiceTests : IClassFixture<MyHordesOptimizerApplicationFactory>
    {
        private const int Day = 5;

        private readonly MyHordesOptimizerApplicationFactory _factory;

        public MapRouteServiceTests(MyHordesOptimizerApplicationFactory factory)
        {
            _factory = factory;
        }

        private sealed record SeededTown(int TownId, int AliveUserId, int DeadUserId, int OutsiderUserId);

        /// <summary>Un scope par appel : MhoContext est Transient et capturé à la construction du service.</summary>
        private IMapRouteService NewService(int userId, int? tokenMapId = null)
        {
            var provider = _factory.Services.CreateScope().ServiceProvider;
            var userInfo = provider.GetRequiredService<IUserInfoProvider>();
            userInfo.UserId = userId;
            userInfo.TownDetail = tokenMapId.HasValue ? new MyHordesOptimizerApi.Dtos.MyHordesOptimizer.SimpleMeTownDetailDto { TownId = tokenMapId.Value } : null!;
            return new MapRouteService(
                provider.GetRequiredService<MhoContext>(),
                userInfo,
                new TownAccessService(provider.GetRequiredService<IServiceScopeFactory>(), userInfo),
                provider.GetRequiredService<TownSyncLock>(),
                provider.GetRequiredService<IMapper>());
        }

        private MhoContext NewContext()
        {
            return _factory.Services.CreateScope().ServiceProvider.GetRequiredService<MhoContext>();
        }

        private SeededTown SeedTown()
        {
            var (townId, aliveUserId, deadUserId, outsiderUserId) = AttackTestSupport.SeedTown(NewContext(), Day);
            return new SeededTown(townId, aliveUserId, deadUserId, outsiderUserId);
        }

        private static MapRouteRequestDto NewRequest(string label = "Vers l'Ouest 🧟", bool isPrivate = false, bool isEditableByAll = false, List<int>? sharedUserIds = null)
        {
            return new MapRouteRequestDto
            {
                Label = label,
                IsPrivate = isPrivate,
                IsEditableByAll = isEditableByAll,
                SharedUserIds = sharedUserIds,
                Cells = new List<MapRoutePointDto> { new() { X = 20, Y = 20 }, new() { X = 19, Y = 20 }, new() { X = 18, Y = 20 }, new() { X = 18, Y = 19 } },
                Stops = new List<MapRouteStopDto> { new() { X = 18, Y = 19, Mode = MapRouteStopModes.L } }
            };
        }

        private static MapRouteRequestDto UpdateOf(MapRouteDto route, Action<MapRouteRequestDto>? change = null)
        {
            var request = new MapRouteRequestDto
            {
                Id = route.Id,
                Version = route.Version,
                Label = route.Label,
                Color = route.Color,
                IsPrivate = route.IsPrivate,
                IsEditableByAll = route.IsEditableByAll,
                SharedUserIds = route.SharedUserIds,
                Cells = route.Cells,
                Stops = route.Stops
            };
            change?.Invoke(request);
            return request;
        }

        /// <summary>Partie d'expédition liée au tracé (la liaison par l'API arrive au lot 4).</summary>
        private int LinkPart(int townId, int routeId, int expeditionDay)
        {
            using var context = NewContext();
            var expedition = new Expedition { IdTown = townId, Day = expeditionDay, Position = 0, Label = "expé" };
            context.Expeditions.Add(expedition);
            context.SaveChanges();
            var part = new ExpeditionPart { IdExpedition = expedition.IdExpedition, Position = 0, IdMapRoute = routeId };
            context.ExpeditionParts.Add(part);
            context.SaveChanges();
            return part.IdExpeditionPart;
        }

        [Fact]
        public async Task SaveMapRouteAsync_Citoyen_Cree()
        {
            var town = SeedTown();

            var route = await NewService(town.AliveUserId).SaveMapRouteAsync(town.TownId, NewRequest(label: "  Vers l'Ouest 🧟  "));

            route.Id.Should().BePositive();
            route.Label.Should().Be("Vers l'Ouest 🧟");
            route.Version.Should().Be(0);
            route.Length.Should().Be(3);
            MapRoutePalette.IsValid(route.Color).Should().BeTrue();
            route.AuthorId.Should().Be(town.AliveUserId);
            route.AuthorName.Should().Be("test-alive-" + town.AliveUserId);
            route.CanEdit.Should().BeTrue();
            route.Cells.Should().HaveCount(4);
            route.Stops.Should().ContainSingle();
            route.LastUpdateInfo!.UserId.Should().Be(town.AliveUserId);
        }

        [Fact]
        public async Task SaveMapRouteAsync_CitoyenMort_Accepte()
        {
            var town = SeedTown();

            var route = await NewService(town.DeadUserId).SaveMapRouteAsync(town.TownId, NewRequest());

            route.AuthorId.Should().Be(town.DeadUserId);
        }

        [Fact]
        public async Task SaveMapRouteAsync_Etranger_Refuse()
        {
            var town = SeedTown();

            Func<Task> act = () => NewService(town.OutsiderUserId).SaveMapRouteAsync(town.TownId, NewRequest());

            await act.Should().ThrowAsync<MhoForbiddenException>();
            NewContext().MapRoutes.AsNoTracking().Any(route => route.IdTown == town.TownId).Should().BeFalse();
        }

        [Fact]
        public async Task SaveMapRouteAsync_CheminInvalide_Refuse()
        {
            var town = SeedTown();
            var request = NewRequest();
            request.Cells = new List<MapRoutePointDto> { new() { X = 20, Y = 20 }, new() { X = 21, Y = 21 } };

            Func<Task> act = () => NewService(town.AliveUserId).SaveMapRouteAsync(town.TownId, request);

            await act.Should().ThrowAsync<MhoTechnicalException>();
        }

        [Fact]
        public async Task SaveMapRouteAsync_CouleurHorsPalette_Refuse()
        {
            var town = SeedTown();
            var request = NewRequest();
            request.Color = "#ff0000";

            Func<Task> act = () => NewService(town.AliveUserId).SaveMapRouteAsync(town.TownId, request);

            await act.Should().ThrowAsync<MhoTechnicalException>();
        }

        [Fact]
        public async Task GetMapRoutesAsync_Etranger_AccesSeulement()
        {
            var town = SeedTown();
            await NewService(town.AliveUserId).SaveMapRouteAsync(town.TownId, NewRequest());

            var result = await NewService(town.OutsiderUserId).GetMapRoutesAsync(town.TownId);

            result.Access.IsCitizen.Should().BeFalse();
            result.Access.CanCreate.Should().BeFalse();
            result.Routes.Should().BeEmpty();
            result.GameRoutes.Should().BeEmpty();
        }

        [Fact]
        public async Task GetAccessAsync_CitoyenMort_AncienCitoyenQuiPeutContribuer()
        {
            var town = SeedTown();

            var access = await NewService(town.DeadUserId).GetAccessAsync(town.TownId);

            access.IsCitizen.Should().BeTrue();
            access.IsCurrentTown.Should().BeFalse();
            access.CanCreate.Should().BeTrue();
        }

        [Fact]
        public async Task GetAccessAsync_VilleDuJeton_VilleCourante()
        {
            var town = SeedTown();

            var access = await NewService(town.AliveUserId, tokenMapId: town.TownId).GetAccessAsync(town.TownId);

            access.IsCitizen.Should().BeTrue();
            access.IsCurrentTown.Should().BeTrue();
            access.CanCreate.Should().BeTrue();
        }

        [Fact]
        public async Task GetAccessAsync_Etranger_AucunDroit()
        {
            var town = SeedTown();

            var access = await NewService(town.OutsiderUserId).GetAccessAsync(town.TownId);

            access.IsCitizen.Should().BeFalse();
            access.IsCurrentTown.Should().BeFalse();
            access.CanCreate.Should().BeFalse();
        }

        [Fact]
        public async Task GetAccessAsync_VilleTerminee_CitoyenSansCreation()
        {
            var town = SeedTown();
            NewContext().Towns.Where(t => t.IdTown == town.TownId).ExecuteUpdate(setters => setters.SetProperty(t => t.IsFinished, true));

            var access = await NewService(town.DeadUserId).GetAccessAsync(town.TownId);

            access.IsCitizen.Should().BeTrue();
            access.CanCreate.Should().BeFalse();
        }

        [Fact]
        public async Task GetAccessAsync_VilleInconnue_AucunDroit()
        {
            var town = SeedTown();

            // Les villes de test ont un mapId tiré dans [1, int.MaxValue[ : int.MaxValue n'en désigne aucune.
            var access = await NewService(town.AliveUserId).GetAccessAsync(int.MaxValue);

            access.IsCitizen.Should().BeFalse();
            access.CanCreate.Should().BeFalse();
        }

        [Fact]
        public async Task GetMapRoutesAsync_TracePrive_VisibleDeLAuteurEtDesAutorisesSeulement()
        {
            var town = SeedTown();
            var shared = await NewService(town.AliveUserId).SaveMapRouteAsync(town.TownId, NewRequest(isPrivate: true, sharedUserIds: new List<int> { town.DeadUserId, town.AliveUserId }));
            var hidden = await NewService(town.AliveUserId).SaveMapRouteAsync(town.TownId, NewRequest(isPrivate: true));

            var seenByDead = await NewService(town.DeadUserId).GetMapRoutesAsync(town.TownId);
            var seenByAuthor = await NewService(town.AliveUserId).GetMapRoutesAsync(town.TownId);

            shared.SharedUserIds.Should().Equal(town.DeadUserId);
            seenByDead.Routes.Select(route => route.Id).Should().Equal(shared.Id);
            seenByAuthor.Routes.Select(route => route.Id).Should().Equal(shared.Id, hidden.Id);
            (await NewService(town.DeadUserId).GetMapRouteAsync(town.TownId, hidden.Id)).Should().BeNull();
        }

        [Fact]
        public async Task SaveMapRouteAsync_AutorisationAUnEtranger_Refuse()
        {
            var town = SeedTown();

            Func<Task> act = () => NewService(town.AliveUserId).SaveMapRouteAsync(town.TownId, NewRequest(isPrivate: true, sharedUserIds: new List<int> { town.OutsiderUserId }));

            await act.Should().ThrowAsync<MhoTechnicalException>();
        }

        [Fact]
        public async Task SaveMapRouteAsync_RenduVisibleDeTous_RetireLesAutorisations()
        {
            var town = SeedTown();
            var route = await NewService(town.AliveUserId).SaveMapRouteAsync(town.TownId, NewRequest(isPrivate: true, sharedUserIds: new List<int> { town.DeadUserId }));

            var updated = await NewService(town.AliveUserId).SaveMapRouteAsync(town.TownId, UpdateOf(route, request => request.IsPrivate = false));

            updated.SharedUserIds.Should().BeEmpty();
            NewContext().MapRouteShares.AsNoTracking().Any(share => share.IdMapRoute == route.Id).Should().BeFalse();
        }

        [Fact]
        public async Task SaveMapRouteAsync_ModificationDesAutorisations_SynchroniseParDifference()
        {
            var town = SeedTown();
            var route = await NewService(town.AliveUserId).SaveMapRouteAsync(town.TownId, NewRequest(isPrivate: true, sharedUserIds: new List<int> { town.DeadUserId }));

            var updated = await NewService(town.AliveUserId).SaveMapRouteAsync(town.TownId, UpdateOf(route, request => request.Label = "renommé"));

            updated.SharedUserIds.Should().Equal(town.DeadUserId);
            updated.Label.Should().Be("renommé");
            updated.Version.Should().Be(1);
        }

        [Fact]
        public async Task SaveMapRouteAsync_PartieLiee_DirectionSuitLaPremiereCaseDuTrace()
        {
            var town = SeedTown();
            using (var context = NewContext())
            {
                var seeded = context.Towns.Single(candidate => candidate.IdTown == town.TownId);
                seeded.X = 20;
                seeded.Y = 20;
                context.SaveChanges();
            }
            var route = await NewService(town.AliveUserId).SaveMapRouteAsync(town.TownId, NewRequest());
            var partId = LinkPart(town.TownId, route.Id, Day);

            await NewService(town.AliveUserId).SaveMapRouteAsync(town.TownId, UpdateOf(route, request =>
            {
                request.Cells = new List<MapRoutePointDto> { new() { X = 20, Y = 20 }, new() { X = 20, Y = 19 }, new() { X = 20, Y = 18 } };
                request.Stops = new List<MapRouteStopDto> { new() { X = 20, Y = 18, Mode = MapRouteStopModes.L } };
            }));

            NewContext().ExpeditionParts.AsNoTracking().Single(part => part.IdExpeditionPart == partId)
                .Direction.Should().Be((int)DirectionEnum.North);
        }

        [Fact]
        public async Task SaveMapRouteAsync_NonAuteur_SelonModifiableParTous()
        {
            var town = SeedTown();
            var authorOnly = await NewService(town.AliveUserId).SaveMapRouteAsync(town.TownId, NewRequest(isEditableByAll: false));
            var editableByAll = await NewService(town.AliveUserId).SaveMapRouteAsync(town.TownId, NewRequest(isEditableByAll: true));

            Func<Task> act = () => NewService(town.DeadUserId).SaveMapRouteAsync(town.TownId, UpdateOf(authorOnly, request => request.Label = "pirate"));
            var updated = await NewService(town.DeadUserId).SaveMapRouteAsync(town.TownId, UpdateOf(editableByAll, request => request.Label = "corrigé"));

            await act.Should().ThrowAsync<MhoForbiddenException>();
            updated.Label.Should().Be("corrigé");
            updated.AuthorId.Should().Be(town.AliveUserId);
            (await NewService(town.DeadUserId).GetMapRouteAsync(town.TownId, authorOnly.Id))!.CanEdit.Should().BeFalse();
        }

        [Fact]
        public async Task SaveMapRouteAsync_VersionPerimee_Conflit()
        {
            var town = SeedTown();
            var route = await NewService(town.AliveUserId).SaveMapRouteAsync(town.TownId, NewRequest());
            await NewService(town.AliveUserId).SaveMapRouteAsync(town.TownId, UpdateOf(route, request => request.Label = "v1"));

            Func<Task> act = () => NewService(town.AliveUserId).SaveMapRouteAsync(town.TownId, UpdateOf(route, request => request.Label = "périmé"));

            await act.Should().ThrowAsync<MhoConflictException>();
            NewContext().MapRoutes.AsNoTracking().Single(mapRoute => mapRoute.IdMapRoute == route.Id).Label.Should().Be("v1");
        }

        [Fact]
        public async Task SaveMapRouteAsync_TraceDUneAutreVille_Refuse()
        {
            var townA = SeedTown();
            var townB = SeedTown();
            var routeB = await NewService(townB.AliveUserId).SaveMapRouteAsync(townB.TownId, NewRequest(isEditableByAll: true));

            Func<Task> act = () => NewService(townA.AliveUserId).SaveMapRouteAsync(townA.TownId, UpdateOf(routeB, request => request.Label = "pirate"));

            await act.Should().ThrowAsync<MhoForbiddenException>();
            NewContext().MapRoutes.AsNoTracking().Single(mapRoute => mapRoute.IdMapRoute == routeB.Id).IdTown.Should().Be(townB.TownId);
        }

        [Fact]
        public async Task SaveMapRouteAsync_TraceLieRenduPrive_Refuse()
        {
            var town = SeedTown();
            var route = await NewService(town.AliveUserId).SaveMapRouteAsync(town.TownId, NewRequest());
            LinkPart(town.TownId, route.Id, Day);

            Func<Task> act = () => NewService(town.AliveUserId).SaveMapRouteAsync(town.TownId, UpdateOf(route, request => request.IsPrivate = true));

            await act.Should().ThrowAsync<MhoTechnicalException>();
        }

        [Fact]
        public async Task SaveMapRouteAsync_TraceLieAUnJourPasse_NonModifiable()
        {
            var town = SeedTown();
            var route = await NewService(town.AliveUserId).SaveMapRouteAsync(town.TownId, NewRequest());
            var partId = LinkPart(town.TownId, route.Id, Day - 1);

            var reloaded = await NewService(town.AliveUserId).GetMapRouteAsync(town.TownId, route.Id);
            Func<Task> act = () => NewService(town.AliveUserId).SaveMapRouteAsync(town.TownId, UpdateOf(route, request => request.Label = "trop tard"));

            reloaded!.CanEdit.Should().BeFalse();
            reloaded.LinkedParts.Should().ContainSingle(part => part.PartId == partId && part.Day == Day - 1);
            await act.Should().ThrowAsync<MhoForbiddenException>();
        }

        [Fact]
        public async Task SaveMapRouteAsync_VilleTerminee_LectureSeule()
        {
            var town = SeedTown();
            var route = await NewService(town.AliveUserId).SaveMapRouteAsync(town.TownId, NewRequest());
            NewContext().Towns.Where(t => t.IdTown == town.TownId).ExecuteUpdate(setters => setters.SetProperty(t => t.IsFinished, true));

            var result = await NewService(town.AliveUserId).GetMapRoutesAsync(town.TownId);
            Func<Task> act = () => NewService(town.AliveUserId).SaveMapRouteAsync(town.TownId, NewRequest());

            result.Access.IsCitizen.Should().BeTrue();
            result.Access.CanCreate.Should().BeFalse();
            result.Routes.Should().ContainSingle(mapRoute => mapRoute.Id == route.Id && !mapRoute.CanEdit);
            await act.Should().ThrowAsync<MhoForbiddenException>();
        }

        [Fact]
        public async Task DeleteMapRouteAsync_DelieLesParties()
        {
            var town = SeedTown();
            var route = await NewService(town.AliveUserId).SaveMapRouteAsync(town.TownId, NewRequest());
            var partId = LinkPart(town.TownId, route.Id, Day);

            var mapId = await NewService(town.AliveUserId).DeleteMapRouteAsync(route.Id);

            mapId.Should().Be(town.TownId);
            var context = NewContext();
            context.MapRoutes.AsNoTracking().Any(mapRoute => mapRoute.IdMapRoute == route.Id).Should().BeFalse();
            context.ExpeditionParts.AsNoTracking().Single(part => part.IdExpeditionPart == partId).IdMapRoute.Should().BeNull();
        }

        [Fact]
        public async Task DeleteMapRouteAsync_SupprimeLesAutorisations()
        {
            var town = SeedTown();
            var route = await NewService(town.AliveUserId).SaveMapRouteAsync(town.TownId, NewRequest(isPrivate: true, sharedUserIds: new List<int> { town.DeadUserId }));

            await NewService(town.AliveUserId).DeleteMapRouteAsync(route.Id);

            NewContext().MapRouteShares.AsNoTracking().Any(share => share.IdMapRoute == route.Id).Should().BeFalse();
        }

        [Fact]
        public async Task DeleteMapRouteAsync_TracePriveDUnAutre_Refuse()
        {
            var town = SeedTown();
            var route = await NewService(town.AliveUserId).SaveMapRouteAsync(town.TownId, NewRequest(isPrivate: true, isEditableByAll: true));

            Func<Task> act = () => NewService(town.DeadUserId).DeleteMapRouteAsync(route.Id);

            await act.Should().ThrowAsync<MhoForbiddenException>();
            NewContext().MapRoutes.AsNoTracking().Any(mapRoute => mapRoute.IdMapRoute == route.Id).Should().BeTrue();
        }

        [Fact]
        public async Task DeleteMapRouteAsync_Etranger_Refuse()
        {
            var town = SeedTown();
            var route = await NewService(town.AliveUserId).SaveMapRouteAsync(town.TownId, NewRequest(isEditableByAll: true));

            Func<Task> act = () => NewService(town.OutsiderUserId).DeleteMapRouteAsync(route.Id);

            await act.Should().ThrowAsync<MhoForbiddenException>();
        }

        [Fact]
        public async Task GetMapRoutesAsync_ItinerairesDuJeu_JourCourantSeulement()
        {
            var town = SeedTown();
            int todayId;
            using (var context = NewContext())
            {
                var today = new MapRouteGame { IdTown = town.TownId, Day = Day, Label = "aujourd'hui", Length = 4, Stops = "[[20,20],[20,18],[22,18]]" };
                var yesterday = new MapRouteGame { IdTown = town.TownId, Day = Day - 1, Label = "hier", Length = 2, Stops = "[[20,20],[20,18]]" };
                context.MapRouteGames.AddRange(today, yesterday);
                context.SaveChanges();
                todayId = today.IdMapRouteGame;
            }

            var result = await NewService(town.DeadUserId).GetMapRoutesAsync(town.TownId);

            result.GameRoutes.Should().ContainSingle();
            result.GameRoutes[0].Id.Should().Be(todayId);
            result.GameRoutes[0].Stops.Should().HaveCount(3);
        }

        private int SeedGameRoute(int townId)
        {
            using var context = NewContext();
            var gameRoute = new MapRouteGame { IdTown = townId, Day = Day, Label = "Nord", Length = 4, Stops = "[[20,20],[20,18],[22,18]]" };
            context.MapRouteGames.Add(gameRoute);
            context.SaveChanges();
            return gameRoute.IdMapRouteGame;
        }

        [Fact]
        public async Task CopyGameRouteAsync_Citoyen_CreeUnTraceMhoAvecLesMemesCases()
        {
            var town = SeedTown();
            var gameRouteId = SeedGameRoute(town.TownId);

            var route = await NewService(town.AliveUserId).CopyGameRouteAsync(town.TownId, gameRouteId);

            route.Label.Should().Be("Nord");
            route.AuthorId.Should().Be(town.AliveUserId);
            route.IsPrivate.Should().BeFalse();
            route.IsEditableByAll.Should().BeTrue();
            route.Length.Should().Be(4);
            route.Cells.Select(cell => (cell.X, cell.Y)).Should().Equal((20, 20), (20, 19), (20, 18), (21, 18), (22, 18));
            route.Stops.Select(stop => (stop.X, stop.Y, stop.Mode)).Should().Equal((20, 18, MapRouteStopModes.L), (22, 18, MapRouteStopModes.L));
        }

        [Fact]
        public async Task CopyGameRouteAsync_ItineraireDUneAutreVille_Refuse()
        {
            var town = SeedTown();
            var otherTown = SeedTown();
            var gameRouteId = SeedGameRoute(otherTown.TownId);

            Func<Task> act = () => NewService(town.AliveUserId).CopyGameRouteAsync(town.TownId, gameRouteId);

            await act.Should().ThrowAsync<MhoForbiddenException>();
        }

        [Fact]
        public async Task CopyGameRouteAsync_Etranger_Refuse()
        {
            var town = SeedTown();
            var gameRouteId = SeedGameRoute(town.TownId);

            Func<Task> act = () => NewService(town.OutsiderUserId).CopyGameRouteAsync(town.TownId, gameRouteId);

            await act.Should().ThrowAsync<MhoForbiddenException>();
        }
    }
}
