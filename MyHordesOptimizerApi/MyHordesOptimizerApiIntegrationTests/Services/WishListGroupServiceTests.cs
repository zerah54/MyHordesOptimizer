using System;
using System.Collections.Generic;
using System.Linq;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using MyHordesOptimizerApi;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.WishList;
using MyHordesOptimizerApi.Exceptions;
using MyHordesOptimizerApi.Models;
using MyHordesOptimizerApi.Services.Interfaces;
using MyHordesOptimizerApiIntegrationTests.ApplicationFactory;
using Xunit;

namespace MyHordesOptimizerApiIntegrationTests.Services
{
    /// <summary>Lecture des groupes de la liste de courses et purge à la suppression de la ville.</summary>
    public class WishListGroupServiceTests : IClassFixture<MyHordesOptimizerApplicationFactory>
    {
        private readonly MyHordesOptimizerApplicationFactory _factory;

        public WishListGroupServiceTests(MyHordesOptimizerApplicationFactory factory)
        {
            _factory = factory;
        }

        // MapId == IdTown délibérément : ces tests portent sur les groupes, pas sur la résolution townId/mapId.
        private static (int townId, int userId) SeedTownAndCitizen(MhoContext context)
        {
            var suffix = Guid.NewGuid().ToString("N").Substring(0, 8);
            var random = new Random();
            var townId = random.Next(1, int.MaxValue);
            context.Towns.Add(new Town { IdTown = townId, Name = "test-town-" + suffix, MapId = townId });
            var userId = random.Next(1, int.MaxValue);
            context.Users.Add(new User { IdUser = userId, Name = "test-user-" + suffix });
            context.SaveChanges();

            var lastUpdateInfo = new LastUpdateInfo { DateUpdate = DateTime.UtcNow };
            context.LastUpdateInfos.Add(lastUpdateInfo);
            context.SaveChanges();
            context.TownCitizens.Add(new TownCitizen { IdTown = townId, IdUser = userId, IdLastUpdateInfo = lastUpdateInfo.IdLastUpdateInfo });
            context.SaveChanges();

            return (townId, userId);
        }

        [Fact]
        public void GetWishList_GroupeEnBase_RenvoieLeGroupeEtLeGroupUidDeSesObjets()
        {
            var scope = _factory.Services.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<MhoContext>();
            var (townId, userId) = SeedTownAndCitizen(context);
            var uid = Guid.NewGuid().ToString();
            var items = context.Items.Take(2).ToList();

            context.TownWishListGroups.Add(new TownWishListGroup { IdTown = townId, Uid = uid, Name = "B6", Count = 30 });
            foreach (var item in items)
            {
                context.TownWishListItems.Add(new TownWishListItem { IdTown = townId, IdItem = item.IdItem, ZoneXpa = 0, Count = 1, GroupUid = uid });
            }
            var town = context.Towns.Find(townId)!;
            town.IdUserWishListUpdater = userId;
            town.WishlistDateUpdate = DateTime.UtcNow;
            context.SaveChanges();

            var dto = scope.ServiceProvider.GetRequiredService<IWishListService>().GetWishList(townId);

            var group = dto.Groups.Should().ContainSingle().Subject;
            group.Uid.Should().Be(uid);
            group.Name.Should().Be("B6");
            group.Count.Should().Be(30);
            dto.WishList.Should().HaveCount(2).And.OnlyContain(w => w.GroupUid == uid);
        }

        [Fact]
        public void GetWishList_ListeVide_RenvoieGroupsVide()
        {
            var scope = _factory.Services.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<MhoContext>();
            var (townId, _) = SeedTownAndCitizen(context);

            var dto = scope.ServiceProvider.GetRequiredService<IWishListService>().GetWishList(townId);

            dto.Groups.Should().BeEmpty();
        }

        [Fact]
        public void DeleteTown_PurgeLesGroupesDeLaListe()
        {
            var context = _factory.Services.CreateScope().ServiceProvider.GetRequiredService<MhoContext>();
            var (townId, _) = SeedTownAndCitizen(context);
            context.TownWishListGroups.Add(new TownWishListGroup { IdTown = townId, Uid = Guid.NewGuid().ToString(), Name = "B6" });
            context.SaveChanges();

            _factory.Services.CreateScope().ServiceProvider.GetRequiredService<ITownService>().DeleteTown(townId);

            var verify = _factory.Services.CreateScope().ServiceProvider.GetRequiredService<MhoContext>();
            verify.TownWishListGroups.Count(group => group.IdTown == townId).Should().Be(0);
        }

        private static WishListPutBodyDto Body(List<WishListPutResquestDto>? items = null, List<WishListGroupDto>? groups = null)
        {
            return new WishListPutBodyDto { Items = items ?? new List<WishListPutResquestDto>(), Groups = groups ?? new List<WishListGroupDto>() };
        }

        private static WishListGroupDto Group(string uid, string name = "B6", int zone = 0, int depot = 0, int priority = 0, int count = 0)
        {
            return new WishListGroupDto { Uid = uid, Name = name, ZoneXPa = zone, Depot = depot, Priority = priority, Count = count };
        }

        [Fact]
        public void PutWishList_LesObjetsDUnGroupePrennentZoneDepotPrioriteEtStockDuGroupe()
        {
            var scope = _factory.Services.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<MhoContext>();
            var (townId, userId) = SeedTownAndCitizen(context);
            var uid = Guid.NewGuid().ToString();
            var item = context.Items.First();

            scope.ServiceProvider.GetRequiredService<IWishListService>().PutWishList(townId, userId, Body(
                new List<WishListPutResquestDto> { new WishListPutResquestDto { Id = item.IdItem, GroupUid = uid, Count = 1 } },
                new List<WishListGroupDto> { Group(uid, zone: 5, depot: 1, priority: 900, count: 30) }));

            var verify = _factory.Services.CreateScope().ServiceProvider.GetRequiredService<MhoContext>();
            var row = verify.TownWishListItems.Single(w => w.IdTown == townId);
            (row.ZoneXpa, row.Depot, row.Priority, row.Count, row.GroupUid).Should().Be((5, 1, 900, 30, uid));
            verify.TownWishListGroups.Count(g => g.IdTown == townId).Should().Be(1);
        }

        [Fact]
        public void PutWishList_GroupeSansObjet_NEstPasEnregistre()
        {
            var scope = _factory.Services.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<MhoContext>();
            var (townId, userId) = SeedTownAndCitizen(context);

            scope.ServiceProvider.GetRequiredService<IWishListService>().PutWishList(townId, userId, Body(
                groups: new List<WishListGroupDto> { Group(Guid.NewGuid().ToString()) }));

            _factory.Services.CreateScope().ServiceProvider.GetRequiredService<MhoContext>()
                .TownWishListGroups.Count(g => g.IdTown == townId).Should().Be(0);
        }

        [Fact]
        public void PutWishList_GroupUidInconnu_LeveBadRequest()
        {
            var scope = _factory.Services.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<MhoContext>();
            var (townId, userId) = SeedTownAndCitizen(context);
            var item = context.Items.First();

            var act = () => scope.ServiceProvider.GetRequiredService<IWishListService>().PutWishList(townId, userId, Body(
                new List<WishListPutResquestDto> { new WishListPutResquestDto { Id = item.IdItem, GroupUid = Guid.NewGuid().ToString() } }));

            act.Should().Throw<MhoBadRequestException>();
        }

        [Theory]
        [InlineData("pas-un-guid", false)]
        [InlineData("00000000-0000-0000-0000-000000000001", true)]
        public void PutWishList_UidDeGroupeInvalideOuEnDouble_LeveBadRequest(string uid, bool duplicate)
        {
            var scope = _factory.Services.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<MhoContext>();
            var (townId, userId) = SeedTownAndCitizen(context);
            var item = context.Items.First();
            var groups = new List<WishListGroupDto> { Group(uid, "A") };
            if (duplicate)
            {
                groups.Add(Group(uid, "B"));
            }

            var act = () => scope.ServiceProvider.GetRequiredService<IWishListService>().PutWishList(townId, userId, Body(
                new List<WishListPutResquestDto> { new WishListPutResquestDto { Id = item.IdItem, GroupUid = uid } }, groups));

            act.Should().Throw<MhoBadRequestException>();
        }

        [Theory]
        [InlineData("   ")]
        [InlineData("012345678901234567890123456789012345678901234567890123456789ABCDE")]
        public void PutWishList_NomDeGroupeVideOuTropLong_LeveBadRequest(string name)
        {
            var scope = _factory.Services.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<MhoContext>();
            var (townId, userId) = SeedTownAndCitizen(context);
            var item = context.Items.First();
            var uid = Guid.NewGuid().ToString();

            var act = () => scope.ServiceProvider.GetRequiredService<IWishListService>().PutWishList(townId, userId, Body(
                new List<WishListPutResquestDto> { new WishListPutResquestDto { Id = item.IdItem, GroupUid = uid } },
                new List<WishListGroupDto> { Group(uid, name) }));

            act.Should().Throw<MhoBadRequestException>();
        }

        [Fact]
        public void PutWishList_MemeObjetDeuxFoisDansLaMemeZone_LeveConflict()
        {
            var scope = _factory.Services.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<MhoContext>();
            var (townId, userId) = SeedTownAndCitizen(context);
            var item = context.Items.First();
            var uid = Guid.NewGuid().ToString();

            var act = () => scope.ServiceProvider.GetRequiredService<IWishListService>().PutWishList(townId, userId, Body(
                new List<WishListPutResquestDto>
                {
                    new WishListPutResquestDto { Id = item.IdItem, ZoneXPa = 5 },
                    new WishListPutResquestDto { Id = item.IdItem, GroupUid = uid }
                },
                new List<WishListGroupDto> { Group(uid, zone: 5) }));

            act.Should().Throw<MhoConflictException>();
        }

        [Fact]
        public void PutWishList_RenommerUnGroupe_ChangeWishlistDateUpdate()
        {
            var scope = _factory.Services.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<MhoContext>();
            var (townId, userId) = SeedTownAndCitizen(context);
            var item = context.Items.First();
            var uid = Guid.NewGuid().ToString();
            var service = scope.ServiceProvider.GetRequiredService<IWishListService>();
            var items = new List<WishListPutResquestDto> { new WishListPutResquestDto { Id = item.IdItem, GroupUid = uid } };

            service.PutWishList(townId, userId, Body(items, new List<WishListGroupDto> { Group(uid, "Avant") }));
            var versionService = scope.ServiceProvider.GetRequiredService<IETagVersionService>();
            var v1 = versionService.GetVersion(ETagResource.WishList, townId, userId);
            System.Threading.Thread.Sleep(1100);
            service.PutWishList(townId, userId, Body(items, new List<WishListGroupDto> { Group(uid, "Apres") }));
            var v2 = versionService.GetVersion(ETagResource.WishList, townId, userId);

            v2.Should().NotBe(v1);
        }

        private static WishListGroupAddRequestDto AddRequest(List<int> ids, int zone = 0, int count = -1, string name = "Atelier")
        {
            return new WishListGroupAddRequestDto { Name = name, ItemIds = ids, ZoneXPa = zone, Count = count };
        }

        [Fact]
        public void AddGroupToWishList_IgnoreLesObjetsDejaDansLaZone()
        {
            var scope = _factory.Services.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<MhoContext>();
            var (townId, userId) = SeedTownAndCitizen(context);
            var items = context.Items.Take(2).ToList();
            context.TownWishListItems.Add(new TownWishListItem { IdTown = townId, IdItem = items[0].IdItem, ZoneXpa = 0, Count = 4 });
            context.SaveChanges();

            scope.ServiceProvider.GetRequiredService<IWishListService>().AddGroupToWishList(townId, userId, AddRequest(items.Select(i => i.IdItem).ToList()));

            var verify = _factory.Services.CreateScope().ServiceProvider.GetRequiredService<MhoContext>();
            var rows = verify.TownWishListItems.Where(w => w.IdTown == townId).ToList();
            rows.Should().HaveCount(2);
            var a = rows.Single(r => r.IdItem == items[0].IdItem);
            (a.GroupUid, a.Count).Should().Be(((string?)null, 4));
            var group = verify.TownWishListGroups.Single(g => g.IdTown == townId);
            rows.Single(r => r.IdItem == items[1].IdItem).GroupUid.Should().Be(group.Uid);
        }

        [Fact]
        public void AddGroupToWishList_ObjetPresentDansUneAutreZone_EstAjoute()
        {
            var scope = _factory.Services.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<MhoContext>();
            var (townId, userId) = SeedTownAndCitizen(context);
            var item = context.Items.First();
            context.TownWishListItems.Add(new TownWishListItem { IdTown = townId, IdItem = item.IdItem, ZoneXpa = 5, Count = 1 });
            context.SaveChanges();

            scope.ServiceProvider.GetRequiredService<IWishListService>().AddGroupToWishList(townId, userId, AddRequest(new List<int> { item.IdItem }, zone: 0));

            _factory.Services.CreateScope().ServiceProvider.GetRequiredService<MhoContext>()
                .TownWishListItems.Count(w => w.IdTown == townId && w.IdItem == item.IdItem).Should().Be(2);
        }

        [Fact]
        public void AddGroupToWishList_TousLesObjetsDejaPlaces_NeCreeRienEtRenvoieLaListe()
        {
            var scope = _factory.Services.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<MhoContext>();
            var (townId, userId) = SeedTownAndCitizen(context);
            var item = context.Items.First();
            context.TownWishListItems.Add(new TownWishListItem { IdTown = townId, IdItem = item.IdItem, ZoneXpa = 0, Count = 1 });
            var town = context.Towns.Find(townId)!;
            town.IdUserWishListUpdater = userId;
            town.WishlistDateUpdate = DateTime.UtcNow;
            context.SaveChanges();

            var dto = scope.ServiceProvider.GetRequiredService<IWishListService>().AddGroupToWishList(townId, userId, AddRequest(new List<int> { item.IdItem }));

            dto.WishList.Should().ContainSingle();
            dto.Groups.Should().BeEmpty();
            _factory.Services.CreateScope().ServiceProvider.GetRequiredService<MhoContext>()
                .TownWishListGroups.Count(g => g.IdTown == townId).Should().Be(0);
        }

        [Fact]
        public void AddGroupToWishList_CreeUnGroupeStockZonePrioriteDepotAttendus()
        {
            var scope = _factory.Services.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<MhoContext>();
            var (townId, userId) = SeedTownAndCitizen(context);
            var item = context.Items.First();

            scope.ServiceProvider.GetRequiredService<IWishListService>().AddGroupToWishList(townId, userId, AddRequest(new List<int> { item.IdItem }, zone: 3));

            var verify = _factory.Services.CreateScope().ServiceProvider.GetRequiredService<MhoContext>();
            var group = verify.TownWishListGroups.Single(g => g.IdTown == townId);
            (group.Count, group.ZoneXpa, group.Priority, group.Depot, group.Name).Should().Be((-1, 3, 0, 0, "Atelier"));
            Guid.TryParse(group.Uid, out _).Should().BeTrue();
            var row = verify.TownWishListItems.Single(w => w.IdTown == townId);
            (row.GroupUid, row.ZoneXpa, row.Count).Should().Be((group.Uid, 3, -1));
        }

        [Fact]
        public void AddGroupToWishList_ObjetInconnu_LeveBadRequest()
        {
            var scope = _factory.Services.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<MhoContext>();
            var (townId, userId) = SeedTownAndCitizen(context);

            var act = () => scope.ServiceProvider.GetRequiredService<IWishListService>().AddGroupToWishList(townId, userId, AddRequest(new List<int> { -999999 }));

            act.Should().Throw<MhoBadRequestException>();
        }

        [Fact]
        public void AddItemToWishList_ObjetDejaDansUnGroupeDeLaMemeZone_LeveConflict()
        {
            var scope = _factory.Services.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<MhoContext>();
            var (townId, userId) = SeedTownAndCitizen(context);
            var item = context.Items.First();
            var uid = Guid.NewGuid().ToString();
            var service = scope.ServiceProvider.GetRequiredService<IWishListService>();
            service.PutWishList(townId, userId, Body(
                new List<WishListPutResquestDto> { new WishListPutResquestDto { Id = item.IdItem, GroupUid = uid } },
                new List<WishListGroupDto> { Group(uid, zone: 2) }));

            var act = () => service.AddItemToWishList(townId, userId, item.IdItem, 2);

            act.Should().Throw<MhoConflictException>();
        }
    }
}
