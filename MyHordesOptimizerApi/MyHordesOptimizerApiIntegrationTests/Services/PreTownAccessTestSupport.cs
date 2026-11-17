using System;
using System.Threading.Tasks;
using Microsoft.Extensions.DependencyInjection;
using MyHordesOptimizerApi;
using MyHordesOptimizerApi.Providers.Interfaces;
using MyHordesOptimizerApi.Services.Interfaces;
using MyHordesOptimizerApiIntegrationTests.ApplicationFactory;
using MyHordesOptimizerApiIntegrationTests.Controllers;

namespace MyHordesOptimizerApiIntegrationTests.Services
{
    /// <summary>Graines des tests d'accès aux pré-villes : une pré-ville (avec ville fantôme) créée par un membre, optionnellement liée.</summary>
    internal static class PreTownAccessTestSupport
    {
        public static async Task<(int preTownId, int mapId, int memberId, int outsiderId)> SeedPreTownAsync(
            MyHordesOptimizerApplicationFactory factory, bool linked)
        {
            using var scope = factory.Services.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<MhoContext>();
            var (realTownId, memberId, _, outsiderId) = AttackTestSupport.SeedTown(context, day: 5);
            scope.ServiceProvider.GetRequiredService<IUserInfoProvider>().UserId = memberId;
            var dto = await scope.ServiceProvider.GetRequiredService<IPreTownService>().CreateAsync("acces-" + Guid.NewGuid().ToString("N")[..8]);
            if (linked)
            {
                var preTown = await context.PreTowns.FindAsync(dto.PreTownId);
                preTown!.LinkedIdTown = realTownId;
                preTown.LinkedMapId = realTownId;
                preTown.LinkedAt = DateTime.UtcNow;
                preTown.IdLinker = memberId;
                await context.SaveChangesAsync();
            }
            return (dto.PreTownId, dto.MapId, memberId, outsiderId);
        }
    }
}
