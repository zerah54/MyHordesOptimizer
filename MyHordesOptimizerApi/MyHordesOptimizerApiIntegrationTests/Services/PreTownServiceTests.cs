using System;
using System.Linq;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using MyHordesOptimizerApi;
using MyHordesOptimizerApi.Exceptions;
using MyHordesOptimizerApi.Models;
using MyHordesOptimizerApi.Providers.Interfaces;
using MyHordesOptimizerApi.Services.Interfaces;
using MyHordesOptimizerApiIntegrationTests.ApplicationFactory;
using Xunit;

namespace MyHordesOptimizerApiIntegrationTests.Services
{
    public class PreTownServiceTests : IClassFixture<MyHordesOptimizerApplicationFactory>
    {
        private readonly MyHordesOptimizerApplicationFactory _factory;

        public PreTownServiceTests(MyHordesOptimizerApplicationFactory factory)
        {
            _factory = factory;
        }

        private static readonly Random Rng = new();

        private int NewUser(string prefix)
        {
            using var scope = _factory.Services.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<MhoContext>();
            int id;
            lock (Rng) { id = Rng.Next(1, int.MaxValue); }
            context.Users.Add(new User { IdUser = id, Name = prefix + "-" + Guid.NewGuid().ToString("N")[..8] });
            context.SaveChanges();
            return id;
        }

        /// <summary>Service dans son propre scope, agissant en tant que <paramref name="userId"/>.</summary>
        private (IPreTownService service, MhoContext context) As(int userId)
        {
            var scope = _factory.Services.CreateScope();
            scope.ServiceProvider.GetRequiredService<IUserInfoProvider>().UserId = userId;
            return (scope.ServiceProvider.GetRequiredService<IPreTownService>(), scope.ServiceProvider.GetRequiredService<MhoContext>());
        }

        [Fact]
        public async Task CreateAsync_CreeLaPreVilleLaVilleFantomeEtLOrganisateur()
        {
            var creator = NewUser("creator");
            var (service, context) = As(creator);

            var dto = await service.CreateAsync("  Ma ville  ");

            dto.Alias.Should().Be("Ma ville");
            dto.MapId.Should().Be(PreTownIds.ToMapId(dto.PreTownId));
            dto.IsOrganizer.Should().BeTrue();
            dto.IsLinked.Should().BeFalse();
            dto.CanUnlink.Should().BeFalse();
            dto.Members.Should().ContainSingle(m => m.IdUser == creator && m.IsOrganizer);
            var phantom = await context.Towns.AsNoTracking().SingleAsync(t => t.IdTown == -(1_000_000_000 + dto.PreTownId));
            phantom.MapId.Should().Be(1_000_000_000 + dto.PreTownId);
            phantom.Name.Should().Be("Ma ville");
            var member = await context.PreTownMembers.AsNoTracking().SingleAsync(m => m.IdPreTown == dto.PreTownId);
            member.IdUser.Should().Be(creator);
            member.IsOrganizer.Should().BeTrue();
            member.Seen.Should().BeTrue();
        }

        [Theory]
        [InlineData("")]
        [InlineData("   ")]
        public async Task CreateAsync_AliasVide_Leve400(string alias)
        {
            var (service, _) = As(NewUser("c"));

            await service.Invoking(s => s.CreateAsync(alias)).Should().ThrowAsync<MhoBadRequestException>();
        }

        [Fact]
        public async Task CreateAsync_AliasTropLong_Leve400()
        {
            var (service, _) = As(NewUser("c"));

            await service.Invoking(s => s.CreateAsync(new string('a', 65))).Should().ThrowAsync<MhoBadRequestException>();
        }

        [Fact]
        public async Task ListMineAsync_NeRenvoieQueMesPreVilles_InvitationNonVue()
        {
            var creator = NewUser("creator");
            var invited = NewUser("invited");
            var stranger = NewUser("stranger");
            var (creatorService, _) = As(creator);
            var created = await creatorService.CreateAsync("Liste");
            await creatorService.AddMemberAsync(created.PreTownId, invited);

            var (invitedService, _) = As(invited);
            var invitedList = await invitedService.ListMineAsync();
            var (strangerService, _) = As(stranger);
            var strangerList = await strangerService.ListMineAsync();
            var creatorList = await creatorService.ListMineAsync();

            var row = invitedList.Single(p => p.PreTownId == created.PreTownId);
            row.Seen.Should().BeFalse();
            row.IsOrganizer.Should().BeFalse();
            row.MemberCount.Should().Be(2);
            row.MapId.Should().Be(PreTownIds.ToMapId(created.PreTownId));
            strangerList.Should().NotContain(p => p.PreTownId == created.PreTownId);
            creatorList.Single(p => p.PreTownId == created.PreTownId).Seen.Should().BeTrue();
        }

        [Fact]
        public async Task MarkSeenAsync_NeMarquePasLesAutres()
        {
            var creator = NewUser("creator");
            var a = NewUser("a");
            var b = NewUser("b");
            var (creatorService, _) = As(creator);
            var created = await creatorService.CreateAsync("Vu");
            await creatorService.AddMemberAsync(created.PreTownId, a);
            await creatorService.AddMemberAsync(created.PreTownId, b);

            var (aService, context) = As(a);
            await aService.MarkSeenAsync(created.PreTownId);

            var members = await context.PreTownMembers.AsNoTracking().Where(m => m.IdPreTown == created.PreTownId).ToListAsync();
            members.Single(m => m.IdUser == a).Seen.Should().BeTrue();
            members.Single(m => m.IdUser == b).Seen.Should().BeFalse();
        }

        [Fact]
        public async Task GetAsyncEtMarkSeenAsync_NonMembre_Interdit()
        {
            var (creatorService, _) = As(NewUser("creator"));
            var created = await creatorService.CreateAsync("Privee");
            var (strangerService, _) = As(NewUser("stranger"));

            await strangerService.Invoking(s => s.GetAsync(created.PreTownId)).Should().ThrowAsync<MhoForbiddenException>();
            await strangerService.Invoking(s => s.MarkSeenAsync(created.PreTownId)).Should().ThrowAsync<MhoForbiddenException>();
        }

        [Fact]
        public async Task OperationsOrganisateur_NonOrganisateur_Interdit()
        {
            var creator = NewUser("creator");
            var member = NewUser("member");
            var other = NewUser("other");
            var (creatorService, _) = As(creator);
            var created = await creatorService.CreateAsync("Droits");
            await creatorService.AddMemberAsync(created.PreTownId, member);
            var (memberService, _) = As(member);

            await memberService.Invoking(s => s.AddMemberAsync(created.PreTownId, other)).Should().ThrowAsync<MhoForbiddenException>();
            await memberService.Invoking(s => s.RemoveMemberAsync(created.PreTownId, creator)).Should().ThrowAsync<MhoForbiddenException>();
            await memberService.Invoking(s => s.SetOrganizerAsync(created.PreTownId, member, true)).Should().ThrowAsync<MhoForbiddenException>();
            await memberService.Invoking(s => s.RenameAsync(created.PreTownId, "Autre")).Should().ThrowAsync<MhoForbiddenException>();
        }

        [Fact]
        public async Task AddMemberAsync_DejaMembre_EstIdempotent()
        {
            var creator = NewUser("creator");
            var invited = NewUser("invited");
            var (service, context) = As(creator);
            var created = await service.CreateAsync("Idem");

            await service.AddMemberAsync(created.PreTownId, invited);
            await service.AddMemberAsync(created.PreTownId, invited);
            await service.AddMemberAsync(created.PreTownId, creator);

            (await context.PreTownMembers.AsNoTracking().CountAsync(m => m.IdPreTown == created.PreTownId)).Should().Be(2);
            (await context.PreTownMembers.AsNoTracking().SingleAsync(m => m.IdPreTown == created.PreTownId && m.IdUser == creator)).IsOrganizer.Should().BeTrue();
        }

        [Fact]
        public async Task SetOrganizerAsync_PromeutPuisRetrograde()
        {
            var creator = NewUser("creator");
            var member = NewUser("member");
            var (service, context) = As(creator);
            var created = await service.CreateAsync("Promo");
            await service.AddMemberAsync(created.PreTownId, member);

            await service.SetOrganizerAsync(created.PreTownId, member, true);
            (await context.PreTownMembers.AsNoTracking().SingleAsync(m => m.IdPreTown == created.PreTownId && m.IdUser == member)).IsOrganizer.Should().BeTrue();

            await service.SetOrganizerAsync(created.PreTownId, creator, false);
            (await context.PreTownMembers.AsNoTracking().SingleAsync(m => m.IdPreTown == created.PreTownId && m.IdUser == creator)).IsOrganizer.Should().BeFalse();
        }

        [Fact]
        public async Task DernierOrganisateur_NeSePeutNiRetirerNiRetrograder()
        {
            var creator = NewUser("creator");
            var (service, _) = As(creator);
            var created = await service.CreateAsync("Dernier");

            await service.Invoking(s => s.RemoveMemberAsync(created.PreTownId, creator)).Should().ThrowAsync<MhoBadRequestException>();
            await service.Invoking(s => s.SetOrganizerAsync(created.PreTownId, creator, false)).Should().ThrowAsync<MhoBadRequestException>();
        }

        [Fact]
        public async Task RemoveMemberAsync_OrganisateurRetireUnMembre_EtUnMembreQuitte()
        {
            var creator = NewUser("creator");
            var a = NewUser("a");
            var b = NewUser("b");
            var (service, context) = As(creator);
            var created = await service.CreateAsync("Retrait");
            await service.AddMemberAsync(created.PreTownId, a);
            await service.AddMemberAsync(created.PreTownId, b);

            await service.RemoveMemberAsync(created.PreTownId, a);
            var (bService, _) = As(b);
            await bService.RemoveMemberAsync(created.PreTownId, b);

            var left = await context.PreTownMembers.AsNoTracking().Where(m => m.IdPreTown == created.PreTownId).Select(m => m.IdUser).ToListAsync();
            left.Should().BeEquivalentTo(new[] { creator });
        }

        [Fact]
        public async Task RenameAsync_RenommeLaPreVilleEtLaVilleFantome()
        {
            var (service, context) = As(NewUser("creator"));
            var created = await service.CreateAsync("Avant");

            await service.RenameAsync(created.PreTownId, " Apres ");

            (await context.PreTowns.AsNoTracking().SingleAsync(p => p.IdPreTown == created.PreTownId)).Alias.Should().Be("Apres");
            (await context.Towns.AsNoTracking().SingleAsync(t => t.IdTown == PreTownIds.ToIdTown(created.PreTownId))).Name.Should().Be("Apres");
            await service.Invoking(s => s.RenameAsync(created.PreTownId, "")).Should().ThrowAsync<MhoBadRequestException>();
        }

        [Fact]
        public async Task Create_SimulatedCitizensDefaultsTo40()
        {
            var (service, _) = As(NewUser("creator"));
            var created = await service.CreateAsync("Simu");

            (await service.GetAsync(created.PreTownId)).SimulatedCitizens.Should().Be(40);
        }

        [Fact]
        public async Task SetSimulatedCitizens_Organizer_Persists()
        {
            var (service, _) = As(NewUser("creator"));
            var created = await service.CreateAsync("Simu");

            await service.SetSimulatedCitizensAsync(created.PreTownId, 80);

            (await service.GetAsync(created.PreTownId)).SimulatedCitizens.Should().Be(80);
        }

        [Theory]
        [InlineData(0)]
        [InlineData(81)]
        public async Task SetSimulatedCitizens_OutOfRange_BadRequest(int count)
        {
            var (service, _) = As(NewUser("creator"));
            var created = await service.CreateAsync("Simu");

            await service.Invoking(s => s.SetSimulatedCitizensAsync(created.PreTownId, count)).Should().ThrowAsync<MhoBadRequestException>();
        }

        [Fact]
        public async Task SetSimulatedCitizens_NonOrganizer_Forbidden()
        {
            var creator = NewUser("creator");
            var member = NewUser("member");
            var (creatorService, _) = As(creator);
            var created = await creatorService.CreateAsync("Simu");
            await creatorService.AddMemberAsync(created.PreTownId, member);
            var (memberService, _) = As(member);

            await memberService.Invoking(s => s.SetSimulatedCitizensAsync(created.PreTownId, 20)).Should().ThrowAsync<MhoForbiddenException>();
        }

        [Fact]
        public async Task SetSimulatedCitizens_Linked_BadRequest()
        {
            var (service, context) = As(NewUser("creator"));
            var created = await service.CreateAsync("Simu");
            var linkedIdTown = -Rng.Next(1, PreTownIds.Offset);
            await context.PreTowns.Where(p => p.IdPreTown == created.PreTownId)
                .ExecuteUpdateAsync(s => s.SetProperty(p => p.LinkedIdTown, linkedIdTown).SetProperty(p => p.LinkedAt, DateTime.UtcNow));

            await service.Invoking(s => s.SetSimulatedCitizensAsync(created.PreTownId, 20)).Should().ThrowAsync<MhoBadRequestException>();
        }

        [Fact]
        public async Task Duplicate_CopiesSimulatedCitizens()
        {
            var (service, _) = As(NewUser("creator"));
            var created = await service.CreateAsync("Simu");
            await service.SetSimulatedCitizensAsync(created.PreTownId, 12);

            var copy = await service.DuplicateAsync(created.PreTownId, "Simu (copie)");

            copy.SimulatedCitizens.Should().Be(12);
        }
    }
}
