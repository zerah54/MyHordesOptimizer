using System.Threading.Tasks;
using MyHordesOptimizerApi.Services.Interfaces;

namespace MyHordesOptimizerApiIntegrationTests.Fakes
{
    /// <summary>
    /// Accorde toujours l'accès : pour les tests de service qui ne portent pas sur les droits et s'exécutent
    /// sans jeton (UserId 0, pas de ville).
    /// </summary>
    public class AllowAllTownAccessService : ITownAccessService
    {
        public void EnsureCanWriteTown(int resolvedIdTown, int? mapId)
        {
        }

        public Task EnsureCanWriteTownAsync(int resolvedIdTown, int? mapId) => Task.CompletedTask;

        public Task<bool> CanWriteTownAsync(int resolvedIdTown, int? mapId) => Task.FromResult(true);

        public Task EnsureCanWriteMapAsync(int mapId) => Task.CompletedTask;
    }
}
