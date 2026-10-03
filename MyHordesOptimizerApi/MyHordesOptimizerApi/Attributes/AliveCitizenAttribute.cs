using System.Linq;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.DependencyInjection;
using MyHordesOptimizerApi.Providers.Interfaces;

namespace MyHordesOptimizerApi.Attributes
{
    /// <summary>
    /// Réserve l'action aux citoyens vivants de la ville désignée par l'argument <c>townId</c>. L'identité
    /// vient du JWT (UserInfoProvider, renseigné par le filtre global JwtActionFilter) : à poser avec [Authorize].
    /// </summary>
    public class AliveCitizenAttribute : ActionFilterAttribute
    {
        public override void OnActionExecuting(ActionExecutingContext context)
        {
            if (!context.ActionArguments.TryGetValue("townId", out var rawTownId) || rawTownId is not int townId)
            {
                context.Result = new BadRequestObjectResult("townId cannot be empty");
                return;
            }
            var services = context.HttpContext.RequestServices;
            var userId = services.GetRequiredService<IUserInfoProvider>().UserId;
            var dbContext = services.GetRequiredService<MhoContext>();
            var resolvedTownId = dbContext.ResolveTownId(townId);
            var isAliveCitizen = dbContext.TownCitizens.Any(citizen => citizen.IdTown == resolvedTownId && citizen.IdUser == userId && citizen.Dead != true);
            if (!isAliveCitizen)
            {
                context.Result = new ForbidResult();
                return;
            }
            base.OnActionExecuting(context);
        }
    }
}
