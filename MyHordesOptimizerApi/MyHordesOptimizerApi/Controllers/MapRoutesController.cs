using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.Controllers.Abstract;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.MapRoutes;
using MyHordesOptimizerApi.Providers.Interfaces;
using MyHordesOptimizerApi.Services.Interfaces;
using System.Threading.Tasks;

namespace MyHordesOptimizerApi.Controllers
{
    /// <summary>Lecture des tracés ; l'écriture passe par ExpeditionsHub (SaveMapRoute, DeleteMapRoute).</summary>
    [ApiController]
    [Route("[controller]")]
    [Authorize]
    public class MapRoutesController : AbstractMyHordesOptimizerControllerBase
    {
        protected IMapRouteService MapRouteService { get; init; }

        public MapRoutesController(ILogger<AbstractMyHordesOptimizerControllerBase> logger, IUserInfoProvider userInfoProvider, IMapRouteService mapRouteService) : base(logger, userInfoProvider)
        {
            MapRouteService = mapRouteService;
        }

        [HttpGet]
        [Route("{mapId}")]
        public async Task<ActionResult<MapRoutesDto>> GetMapRoutes([FromRoute] int mapId)
        {
            return Ok(await MapRouteService.GetMapRoutesAsync(mapId));
        }

        /// <summary>Droits sur la ville seuls (citoyen, ville du jeton, création permise), sans les tracés.</summary>
        [HttpGet]
        [Route("{mapId}/access")]
        public async Task<ActionResult<MapRouteAccessDto>> GetAccess([FromRoute] int mapId)
        {
            return Ok(await MapRouteService.GetAccessAsync(mapId));
        }

        /// <summary>404 si le tracé n'existe plus ou n'est pas visible : le client le retire.</summary>
        [HttpGet]
        [Route("{mapId}/{routeId:int}")]
        public async Task<ActionResult<MapRouteDto>> GetMapRoute([FromRoute] int mapId, [FromRoute] int routeId)
        {
            var route = await MapRouteService.GetMapRouteAsync(mapId, routeId);
            return route is null ? NotFound() : Ok(route);
        }
    }
}
