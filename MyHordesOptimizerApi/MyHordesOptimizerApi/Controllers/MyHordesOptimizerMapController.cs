using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.Controllers.Abstract;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Map;
using MyHordesOptimizerApi.Providers.Interfaces;
using MyHordesOptimizerApi.Services.Interfaces;
using System;

namespace MyHordesOptimizerApi.Controllers
{
    [ApiController]
    [Route("Map")]
    public class MyHordesOptimizerMapController : AbstractMyHordesOptimizerControllerBase
    {
        protected IMyHordesOptimizerMapService _mapService { get; private set; }
        public MyHordesOptimizerMapController(ILogger<MyHordesOptimizerMapController> logger,
          IMyHordesOptimizerMapService mapService,
          IUserInfoProvider userKeyProvider) : base(logger, userKeyProvider)
        {
            _mapService = mapService;
        }

        /// <summary>
        /// Jeton obligatoire : l'auteur est celui du jeton (le userId de query, autrefois recopié dans
        /// UserInfoProvider sans vérification, est ignoré), et le service vérifie qu'il est citoyen de la ville.
        /// </summary>
        [HttpPost]
        [Route("Cell")]
        [Authorize]
        public ActionResult<LastUpdateInfoDto> UpdateCell([FromQuery] int? townId, [FromBody] MyHordesOptimizerCellUpdateDto updateRequest)
        {
            if (!townId.HasValue)
            {
                return BadRequest($"{nameof(townId)} cannot be empty");
            }
            var lastUpdateInfo = _mapService.UpdateCell(townId.Value, updateRequest);
            return lastUpdateInfo;
        }

        /// <summary>
        /// Aménagement de la zone pour le camping : améliorations et objets de défense ajoutés aujourd'hui,
        /// ou niveau constaté. Renvoie le niveau enregistré, au jour de la ville.
        /// </summary>
        [HttpPost]
        [Route("Cell/CampImprovement")]
        [Authorize]
        public ActionResult<CampImprovementDto> UpdateCampImprovement([FromQuery] int? townId, [FromBody] CampImprovementUpdateDto request)
        {
            if (!townId.HasValue)
            {
                return BadRequest($"{nameof(townId)} cannot be empty");
            }
            if (request == null)
            {
                return BadRequest($"{nameof(request)} cannot be empty");
            }
            if (Math.Abs(request.Improvements) > CampImprovementUpdateDto.MaxCount
                || Math.Abs(request.DefenseObjects) > CampImprovementUpdateDto.MaxCount
                || request.Level is < 0 or > CampImprovementUpdateDto.MaxLevel)
            {
                return BadRequest("Invalid camp improvement");
            }
            return _mapService.UpdateCampImprovement(townId.Value, request);
        }
    }
}
