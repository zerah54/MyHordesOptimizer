using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.Controllers.Abstract;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Citizens;
using MyHordesOptimizerApi.Providers.Interfaces;
using MyHordesOptimizerApi.Services.Interfaces;

namespace MyHordesOptimizerApi.Controllers
{
    [Controller]
    [Authorize]
    public class TownController : AbstractMyHordesOptimizerControllerBase
    {
        protected ITownService TownService { get; init; }
        public TownController(ILogger<AbstractMyHordesOptimizerControllerBase> logger,
            IUserInfoProvider userInfoProvider,
            ITownService townService) : base(logger, userInfoProvider)
        {
            TownService = townService;
        }

        [HttpGet]
        [Route("{townId}/user/{userId}")]
        public ActionResult<CitizenDto> GetTownCitizen([FromRoute] int townId, [FromRoute] int userId)
        {
            var citizen = TownService.GetTownCitizen(townId, userId);
            return Ok(citizen);
        }

        [HttpPost]
        [Route("{townId}/user/{userId}/bath")]
        public ActionResult<LastUpdateInfoDto> AddCitizenBath([FromRoute] int townId, [FromRoute] int userId, [FromQuery] int? day)
        {
            if(!day.HasValue)
            {
                return BadRequest($"{nameof(day)} must be > 0");
            }
            if (day < 1)
            {
                return BadRequest($"{nameof(day)} must be > 0");
            }
            var updatedCitizen = TownService.AddCitizenBath(townId, userId, day.Value);
            return Ok(updatedCitizen);

        }

        [HttpDelete]
        [Route("{townId}/user/{userId}/bath")]
        public ActionResult<CitizenDto> DeleteCitizenBath([FromRoute] int townId, [FromRoute] int userId, [FromQuery] int? day)
        {
            if (!day.HasValue)
            {
                return BadRequest($"{nameof(day)} must be > 0");
            }
            if (day < 1)
            {
                return BadRequest($"{nameof(day)} must be > 0");
            }
            var updatedCitizen = TownService.DeleteCitizenBath(townId, userId, day.Value);
            return Ok(updatedCitizen);

        }

        [HttpPost]
        [Route("{townId}/user/{userId}/chamanicDetail")]
        public ActionResult<LastUpdateInfoDto> UpdateCitizenChamanicDetail([FromRoute] int townId, [FromRoute] int userId, [FromBody] CitizenChamanicDetailDto chamanicDetailDto)
        {
            var updatedCitizen = TownService.UpdateCitizenChamanicDetail(townId, userId, chamanicDetailDto);
            return Ok(updatedCitizen);

        }
    }
}
