using System;
using System.Linq;
using AutoMapper;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using MyHordesOptimizerApi;
using MyHordesOptimizerApi.Models;
using MyHordesOptimizerApi.Providers.Interfaces;
using MyHordesOptimizerApiIntegrationTests.ApplicationFactory;
using Xunit;

namespace MyHordesOptimizerApiIntegrationTests.MappingProfiles
{
    /// <summary>
    /// DbContext.LastUpdateInfos.Update(Mapper.Map&lt;LastUpdateInfo&gt;(UserInfoProvider.GenerateLastUpdateInfo()))
    /// est appelé par quasiment tous les services (login, MAJ outils externes, estimations, expéditions)
    /// à chaque action de synchronisation. Le mapping ne doit pas écraser les autres colonnes du User
    /// visé via la navigation IdUserNavigation.
    /// </summary>
    public class LastUpdateInfoProfileTests : IClassFixture<MyHordesOptimizerApplicationFactory>
    {
        private readonly MyHordesOptimizerApplicationFactory _factory;
        public LastUpdateInfoProfileTests(MyHordesOptimizerApplicationFactory factory) => _factory = factory;

        [Fact]
        public void CreationDunLastUpdateInfo_NePasEcraserLesAutresColonnesDuUser()
        {
            var userId = new Random().Next(1, int.MaxValue);
            var pictosImportedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);

            using (var seedScope = _factory.Services.CreateScope())
            {
                var ctx = seedScope.ServiceProvider.GetRequiredService<MhoContext>();
                ctx.Users.Add(new User
                {
                    IdUser = userId,
                    Name = "test-user",
                    Avatar = "http://example.com/avatar.png",
                    BestSurvival = 42,
                    PictosHistoryImportedAt = pictosImportedAt
                });
                ctx.SaveChanges();
            }

            using (var scope = _factory.Services.CreateScope())
            {
                var mapper = scope.ServiceProvider.GetRequiredService<IMapper>();
                var userInfoProvider = scope.ServiceProvider.GetRequiredService<IUserInfoProvider>();
                var context = scope.ServiceProvider.GetRequiredService<MhoContext>();
                userInfoProvider.UserId = userId;
                userInfoProvider.UserName = "test-user";

                var mapped = mapper.Map<LastUpdateInfo>(userInfoProvider.GenerateLastUpdateInfo());
                context.LastUpdateInfos.Update(mapped);
                context.SaveChanges();
            }

            using (var checkScope = _factory.Services.CreateScope())
            {
                var context = checkScope.ServiceProvider.GetRequiredService<MhoContext>();
                var user = context.Users.AsNoTracking().Single(u => u.IdUser == userId);
                user.Avatar.Should().Be("http://example.com/avatar.png", "la création d'un LastUpdateInfo ne doit pas toucher les autres colonnes du User");
                user.BestSurvival.Should().Be(42);
                user.PictosHistoryImportedAt.Should().Be(pictosImportedAt);
            }
        }
    }
}
