using System;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.Primitives;
using MyHordesOptimizerApi.Providers.Interfaces;
using MyHordesOptimizerApi.Services.Interfaces;

namespace MyHordesOptimizerApi.Controllers.ActionFillters
{
    /// <summary>
    /// Cache HTTP standard (ETag/If-None-Match) sur une action GET, générique pour toute ressource
    /// déclarée dans <see cref="ETagResource"/>. Usage :
    /// <c>[TypeFilter(typeof(ETagCacheFilter), Arguments = new object[] { ETagResource.Bank, "townId" })]</c>
    /// <paramref name="idParamName"/> vide ("") quand l'action n'a pas de paramètre d'identifiant
    /// (ex. les notes "mine", scopées uniquement par l'utilisateur courant).
    /// <para>
    /// La clé de version vient d'<see cref="IETagVersionService"/> — une requête bon marché, distincte
    /// du service métier appelé par l'action — jamais calculée en exécutant l'action. Un ETag qui
    /// correspond à <c>If-None-Match</c> court-circuite donc AVANT que l'action (et le service qu'elle
    /// appelle) ne s'exécute.
    /// </para>
    /// </summary>
    public class ETagCacheFilter : IAsyncActionFilter
    {
        private readonly ETagResource _resource;
        private readonly string _idParamName;
        private readonly IETagVersionService _versionService;
        private readonly IUserInfoProvider _userInfoProvider;

        public ETagCacheFilter(ETagResource resource, string idParamName, IETagVersionService versionService, IUserInfoProvider userInfoProvider)
        {
            _resource = resource;
            _idParamName = idParamName;
            _versionService = versionService;
            _userInfoProvider = userInfoProvider;
        }

        public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
        {
            var id = ExtractId(context);
            var rawVersion = _versionService.GetVersion(_resource, id, _userInfoProvider.UserId);
            if (rawVersion is null)
            {
                // Pas de version bon marché disponible (ville jamais synchronisée, id absent...) :
                // on n'invente pas d'ETag, l'action s'exécute normalement sans mécanisme de cache.
                await next();
                return;
            }

            // UserId plié dans le hash, en plus de Vary: Authorization : deux utilisateurs ne partagent
            // jamais un ETag même si un futur endpoint oublie de scoper sa version par utilisateur.
            var etag = ComputeETag($"{_userInfoProvider.UserId}:{rawVersion}");
            SetCacheHeaders(context.HttpContext.Response, etag);

            if (MatchesIfNoneMatch(context.HttpContext.Request, etag))
            {
                context.Result = new StatusCodeResult(StatusCodes.Status304NotModified);
                return;
            }

            await next();
        }

        private int? ExtractId(ActionExecutingContext context)
        {
            if (string.IsNullOrEmpty(_idParamName))
            {
                return null;
            }
            if (!context.ActionArguments.TryGetValue(_idParamName, out var raw))
            {
                return null;
            }
            return raw as int?;
        }

        private static void SetCacheHeaders(HttpResponse response, string etag)
        {
            response.Headers["ETag"] = etag;
            response.Headers["Cache-Control"] = "private, must-revalidate";
            response.Headers.Append("Vary", "Authorization");
        }

        /// <summary>If-None-Match est une liste séparée par des virgules, entrées éventuellement
        /// préfixées "W/" (comparaison faible), "*" valant "toujours périmé pour moi" côté client.</summary>
        private static bool MatchesIfNoneMatch(HttpRequest request, string etag)
        {
            var header = request.Headers["If-None-Match"];
            if (StringValues.IsNullOrEmpty(header))
            {
                return false;
            }
            return header
                .SelectMany(value => value?.Split(',') ?? Array.Empty<string>())
                .Select(candidate => candidate.Trim())
                .Any(candidate => candidate == "*" || StripWeakPrefix(candidate) == etag);
        }

        private static string StripWeakPrefix(string candidate)
            => candidate.StartsWith("W/", StringComparison.Ordinal) ? candidate[2..] : candidate;

        private static string ComputeETag(string versionInput)
        {
            var hash = SHA256.HashData(Encoding.UTF8.GetBytes(versionInput));
            return $"\"{Convert.ToHexString(hash)}\"";
        }
    }
}
