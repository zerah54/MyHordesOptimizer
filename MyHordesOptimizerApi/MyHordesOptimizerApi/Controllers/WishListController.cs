using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.Controllers.Abstract;
using MyHordesOptimizerApi.Controllers.ActionFillters;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.WishList;
using MyHordesOptimizerApi.Providers.Interfaces;
using MyHordesOptimizerApi.Services.Caching;
using MyHordesOptimizerApi.Services.Interfaces;
using System.Collections.Generic;

namespace MyHordesOptimizerApi.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class WishListController : AbstractMyHordesOptimizerControllerBase
    {
        private readonly IWishListService _wishListService;
        private readonly IMemoryCache _cache;
        private readonly IUserWishListGroupService _userGroupService;

        public WishListController(ILogger<AbstractMyHordesOptimizerControllerBase> logger,
            IUserInfoProvider userKeyProvider,
            IWishListService wishListService,
            IMemoryCache cache,
            IUserWishListGroupService userGroupService) : base(logger, userKeyProvider)
        {
            _wishListService = wishListService;
            _cache = cache;
            _userGroupService = userGroupService;
        }

        [HttpGet]
        [TypeFilter(typeof(ETagCacheFilter), Arguments = new object[] { ETagResource.WishList, "townId" })]
        public ActionResult<WishListLastUpdateDto> GetWishList(int townId)
        {
            var wishList = _wishListService.GetWishList(townId);
            return wishList;
        }

        // Écritures : jeton obligatoire, l'auteur de la mise à jour est celui du jeton (le userId encore
        // envoyé en query par les anciens clients est ignoré) et WishListService vérifie qu'il est
        // citoyen de la ville.
        [HttpPut]
        [Authorize]
        public ActionResult<WishListLastUpdateDto> PutWishList(int townId, [FromBody] WishListPutBodyDto request)
        {
            if (request == null)
            {
                return BadRequest($"{nameof(request)} cannot be null");
            }
            var wishList = _wishListService.PutWishList(townId, UserInfoProvider.UserId, request);
            return Ok(wishList);
        }

        [HttpPost]
        [Route("Add/{itemId}")]
        [Authorize]
        public ActionResult AddItemToWishList(int? townId, int? itemId, int zoneXPa)
        {
            if (!townId.HasValue)
            {
                return BadRequest($"{nameof(townId)} cannot be null");
            }
            if (!itemId.HasValue)
            {
                return BadRequest($"{nameof(itemId)} cannot be null");
            }
            _wishListService.AddItemToWishList(townId: townId.Value, itemId: itemId.Value, userId: UserInfoProvider.UserId, zoneXPa: zoneXPa);
            return Ok();
        }

        [HttpPost]
        [Route("Group")]
        [Authorize]
        public ActionResult<WishListLastUpdateDto> AddGroupToWishList(int townId, [FromBody] WishListGroupAddRequestDto request)
        {
            if (request == null)
            {
                return BadRequest($"{nameof(request)} cannot be null");
            }
            return Ok(_wishListService.AddGroupToWishList(townId, UserInfoProvider.UserId, request));
        }

        [HttpGet("MyGroups")]
        [Authorize]
        public ActionResult<List<UserWishListGroupDto>> GetMyGroups()
            => Ok(_userGroupService.GetMine(UserInfoProvider.UserId));

        [HttpPost("MyGroups")]
        [Authorize]
        public ActionResult<UserWishListGroupDto> CreateMyGroup([FromBody] UpsertUserWishListGroupRequestDto request)
            => Ok(_userGroupService.Create(UserInfoProvider.UserId, request));

        [HttpPut("MyGroups/{groupId:int}")]
        [Authorize]
        public ActionResult<UserWishListGroupDto> UpdateMyGroup([FromRoute] int groupId, [FromBody] UpsertUserWishListGroupRequestDto request)
            => Ok(_userGroupService.Update(UserInfoProvider.UserId, groupId, request));

        [HttpDelete("MyGroups/{groupId:int}")]
        [Authorize]
        public ActionResult DeleteMyGroup([FromRoute] int groupId)
        {
            _userGroupService.Delete(UserInfoProvider.UserId, groupId);
            return NoContent();
        }
    }
}
