using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools;
using MyHordesOptimizerApi.Models.ExternalTools;
using MyHordesOptimizerApi.Providers.Interfaces;
using MyHordesOptimizerApi.Services.Interfaces.ExternalTools;
using Serilog.Context;
using System;
using System.Threading.Tasks;

namespace MyHordesOptimizerApi.Services.Impl.ExternalTools
{
    /// <summary>
    /// Exécute une mise à jour des outils externes hors du cycle de vie de la requête HTTP, pour que
    /// le client puisse en suivre l'avancement outil par outil au lieu d'attendre la fin.
    /// Singleton : l'état survit à la requête qui l'a déclenché.
    /// </summary>
    public class ExternalToolsUpdateJobRunner
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<ExternalToolsUpdateJobRunner> _logger;
        private readonly ExternalToolsUpdateJobStore _store = new();

        public ExternalToolsUpdateJobRunner(IServiceScopeFactory scopeFactory, ILogger<ExternalToolsUpdateJobRunner> logger)
        {
            _scopeFactory = scopeFactory;
            _logger = logger;
        }

        public ExternalToolsUpdateJobState GetState(int userId)
        {
            return _store.GetState(userId);
        }

        /// <summary>
        /// Démarre une mise à jour en tâche de fond. Retourne null si une mise à jour du même joueur
        /// est déjà en cours. Les unités sont déclarées de façon synchrone : l'état retourné porte
        /// donc déjà tous les outils sollicités, en « pending ».
        /// Le contexte utilisateur est capturé ici — le scope de fond n'a aucune requête HTTP, et
        /// le nom d'utilisateur, posé par JwtActionFilter, serait sinon perdu et écrit à null dans
        /// LastUpdateInfo.
        /// </summary>
        public ExternalToolsUpdateJobState TryStart(int userId, string userKey, string userName, UpdateRequestDto request,
            string mhoOrigin, string mhoAddonVersion, string correlationId)
        {
            var progress = _store.TryReserve(userId);
            if (progress == null)
            {
                return null;
            }

            try
            {
                // Déclaration statique, sans résolution de service : le créneau du joueur est déjà
                // réservé, et toute exception ici le laisserait « en cours » jusqu'à sa péremption.
                ExternalToolsUpdatePlan.Declare(request, progress);
            }
            catch (Exception)
            {
                progress.Complete(DateTime.UtcNow);
                throw;
            }

            _ = Task.Run(() => RunAsync(progress, userId, userKey, userName, request, mhoOrigin, mhoAddonVersion, correlationId));
            return progress.Snapshot();
        }

        /// <summary>
        /// MhoOrigin/MhoAddonVersion/CorrelationId sont capturés ici pour la même raison que
        /// userName ci-dessus : les enrichers Serilog qui les lisent normalement (MyHordesOptimizerEnricher,
        /// WithCorrelationId) lisent le HttpContext de la requête, qui n'existe plus une fois qu'on est
        /// dans ce Task.Run détaché. On les repousse donc nous-mêmes dans le LogContext.
        /// </summary>
        private async Task RunAsync(ExternalToolsUpdateProgress progress,
            int userId,
            string userKey,
            string userName,
            UpdateRequestDto request,
            string mhoOrigin,
            string mhoAddonVersion,
            string correlationId)
        {
            using var _1 = LogContext.PushProperty("MhoOrigin", mhoOrigin);
            using var _2 = LogContext.PushProperty("MhoAddonVersion", mhoAddonVersion);
            using var _3 = LogContext.PushProperty("CorrelationId", correlationId);
            try
            {
                using var scope = _scopeFactory.CreateScope();

                var userInfoProvider = scope.ServiceProvider.GetRequiredService<IUserInfoProvider>();
                userInfoProvider.UserId = userId;
                userInfoProvider.UserKey = userKey;
                userInfoProvider.UserName = userName;

                var externalToolsService = scope.ServiceProvider.GetRequiredService<IExternalToolsService>();
                await externalToolsService.UpdateExternalsTools(request, progress);
            }
            catch (Exception e)
            {
                // Filet pour ce qu'aucune unité n'a rattrapé : aucun outil ne doit rester
                // « pending » une fois le lancement terminé.
                _logger.LogError(e, "Échec de la mise à jour des outils externes du joueur {UserId}", userId);
                progress.FailAllPending(ExternalToolUpdateUnits.Job, e.Message);
            }
            finally
            {
                progress.Complete(DateTime.UtcNow);
            }
        }
    }
}
