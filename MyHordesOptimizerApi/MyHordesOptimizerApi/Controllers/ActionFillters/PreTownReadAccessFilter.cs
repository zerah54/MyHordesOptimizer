using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.EntityFrameworkCore;
using MyHordesOptimizerApi.Models;
using MyHordesOptimizerApi.Providers.Interfaces;
using MyHordesOptimizerApi.Services.Impl;
using System.Linq;
using System.Threading.Tasks;

namespace MyHordesOptimizerApi.Controllers.ActionFillters
{
    /// <summary>
    /// 403 sur toute action dont un paramètre de route ou de requête nommé <c>mapId</c> ou <c>townId</c> désigne
    /// une pré-ville dont l'utilisateur n'est pas membre, en lecture comme en écriture. Reconnus : un mapId
    /// fantôme (&gt; offset) et un IdTown fantôme (&lt; -offset). Les membres lisent même une pré-ville liée
    /// (archive) ; l'écriture y est refusée par <see cref="Services.Impl.TownAccessService"/>. À enregistrer
    /// après <see cref="JwtActionFilter"/> (identité). Aucune requête pour une ville réelle.
    /// </summary>
    public class PreTownReadAccessFilter : IAsyncActionFilter
    {
        private readonly IUserInfoProvider _userInfoProvider;
        private readonly MhoContext _context;

        public PreTownReadAccessFilter(IUserInfoProvider userInfoProvider, MhoContext context)
        {
            _userInfoProvider = userInfoProvider;
            _context = context;
        }

        public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
        {
            var preTownId = FindPreTownId(context);
            if (preTownId is null)
            {
                await next();
                return;
            }
            var userId = _userInfoProvider.UserId;
            if (userId <= 0 || !await TownAccessService.IsPreTownMemberAsync(_context, preTownId.Value, userId))
            {
                context.Result = new ObjectResult($"L'utilisateur {userId} n'est pas membre de la pré-ville {preTownId}.") { StatusCode = 403 };
                return;
            }
            await next();
        }

        private static readonly string[] TownKeys = { "mapId", "townId" };

        /// <summary>Id de la première pré-ville désignée par un paramètre de route ou de requête de ville, sinon null.</summary>
        private static int? FindPreTownId(ActionExecutingContext context)
        {
            foreach (var key in TownKeys)
            {
                var found = ToPreTownId(context.RouteData.Values.TryGetValue(key, out var route) ? route?.ToString() : null);
                // Chaque valeur d'un paramètre répété : le binder en retient une, pas forcément la dernière.
                foreach (var value in context.HttpContext.Request.Query[key])
                {
                    found ??= ToPreTownId(value);
                }
                if (found is not null)
                {
                    return found;
                }
            }
            return null;
        }

        private static int? ToPreTownId(string? raw)
        {
            if (!int.TryParse(raw, out var value))
            {
                return null;
            }
            if (PreTownIds.IsPreTownMapId(value))
            {
                return value - PreTownIds.Offset;
            }
            return PreTownIds.IsPreTownIdTown(value) ? -value - PreTownIds.Offset : null;
        }
    }
}
