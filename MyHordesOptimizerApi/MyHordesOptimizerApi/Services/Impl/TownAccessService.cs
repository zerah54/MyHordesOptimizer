using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using MyHordesOptimizerApi.Exceptions;
using MyHordesOptimizerApi.Providers.Interfaces;
using MyHordesOptimizerApi.Services.Interfaces;
using System.Linq;
using System.Threading.Tasks;

namespace MyHordesOptimizerApi.Services.Impl
{
    /// <summary>
    /// Un utilisateur peut écrire dans une ville s'il en est citoyen, vivant ou mort, actuel ou passé : les
    /// morts gardent la main sur leur ancienne ville. Deux sources, la première sans requête :
    /// <list type="bullet">
    /// <item>le jeton : sa ville courante (<c>TownDetail.TownId</c> = mapId), signée à la connexion. Couvre
    /// une ville dont les citoyens ne sont pas encore synchronisés ;</item>
    /// <item>la base : <c>TownCitizen</c> (créé par la synchro et pour chaque ville de l'historique, morts
    /// compris) ou <c>TownCadaver</c>. Couvre les morts et anciens citoyens, dont le jeton ne porte plus la
    /// ville.</item>
    /// </list>
    /// Chaque vérification en base ouvre son propre contexte : le service peut ainsi être appelé depuis
    /// des tâches parallèles d'une même requête (mise à jour des outils externes) sans partager de
    /// DbContext entre threads.
    /// </summary>
    public class TownAccessService : ITownAccessService
    {
        protected IServiceScopeFactory ServiceScopeFactory { get; init; }
        protected IUserInfoProvider UserInfoProvider { get; init; }

        public TownAccessService(IServiceScopeFactory serviceScopeFactory, IUserInfoProvider userInfoProvider)
        {
            ServiceScopeFactory = serviceScopeFactory;
            UserInfoProvider = userInfoProvider;
        }

        public void EnsureCanWriteTown(int resolvedIdTown, int? mapId)
        {
            if (IsTokenTown(resolvedIdTown, mapId))
            {
                return;
            }
            var userId = UserInfoProvider.UserId;
            if (userId <= 0)
            {
                throw Forbidden(userId, resolvedIdTown);
            }
            using var scope = ServiceScopeFactory.CreateScope();
            if (!CitizenshipQuery(scope.ServiceProvider.GetRequiredService<MhoContext>(), resolvedIdTown, userId).Any())
            {
                throw Forbidden(userId, resolvedIdTown);
            }
        }

        public async Task EnsureCanWriteTownAsync(int resolvedIdTown, int? mapId)
        {
            if (!await CanWriteTownAsync(resolvedIdTown, mapId))
            {
                throw Forbidden(UserInfoProvider.UserId, resolvedIdTown);
            }
        }

        public async Task<bool> CanWriteTownAsync(int resolvedIdTown, int? mapId)
        {
            if (IsTokenTown(resolvedIdTown, mapId))
            {
                return true;
            }
            var userId = UserInfoProvider.UserId;
            if (userId <= 0)
            {
                return false;
            }
            using var scope = ServiceScopeFactory.CreateScope();
            return await CitizenshipQuery(scope.ServiceProvider.GetRequiredService<MhoContext>(), resolvedIdTown, userId).AnyAsync();
        }

        public async Task EnsureCanWriteMapAsync(int mapId)
        {
            // Ville du jeton : aucune requête, pas même la résolution.
            if (mapId > 0 && UserInfoProvider.TownDetail?.TownId == mapId)
            {
                return;
            }
            int resolvedIdTown;
            using (var scope = ServiceScopeFactory.CreateScope())
            {
                resolvedIdTown = scope.ServiceProvider.GetRequiredService<MhoContext>().ResolveTownId(mapId);
            }
            await EnsureCanWriteTownAsync(resolvedIdTown, mapId);
        }

        private bool IsTokenTown(int resolvedIdTown, int? mapId)
        {
            var tokenMapId = UserInfoProvider.TownDetail?.TownId;
            if (tokenMapId is null || tokenMapId <= 0)
            {
                return false;
            }
            // Ville provisoire : IdTown = -mapId (cf. MhoContext.ResolveTownId).
            var townMapId = mapId ?? (resolvedIdTown < 0 ? -resolvedIdTown : (int?)null);
            return townMapId == tokenMapId;
        }

        /// <summary>Une seule requête (UNION ALL), sur les clés (idTown, idUser) des deux tables.</summary>
        private static IQueryable<int> CitizenshipQuery(MhoContext dbContext, int resolvedIdTown, int userId)
        {
            return dbContext.TownCitizens
                .Where(citizen => citizen.IdTown == resolvedIdTown && citizen.IdUser == userId)
                .Select(citizen => citizen.IdUser)
                .Concat(dbContext.TownCadavers
                    .Where(cadaver => cadaver.IdTown == resolvedIdTown && cadaver.IdUser == userId)
                    .Select(cadaver => cadaver.IdUser));
        }

        private static MhoForbiddenException Forbidden(int userId, int resolvedIdTown)
        {
            return new MhoForbiddenException($"L'utilisateur {userId} n'est pas citoyen de la ville {resolvedIdTown}.");
        }
    }
}
