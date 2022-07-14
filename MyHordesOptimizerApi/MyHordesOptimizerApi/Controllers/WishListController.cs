using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.Controllers.Abstract;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.WishList;
using MyHordesOptimizerApi.Providers.Interfaces;
using MyHordesOptimizerApi.Services.Interfaces;
using System.Collections.Generic;

namespace MyHordesOptimizerApi.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class WishListController : AbstractMyHordesOptimizerControllerBase
    {
        private readonly IWishListService _wishListService;

        public WishListController(ILogger<AbstractMyHordesOptimizerControllerBase> logger,
            IUserInfoProvider userKeyProvider,
            IWishListService wishListService) : base(logger, userKeyProvider)
        {
            _wishListService = wishListService;
        }

        [HttpGet]
        public ActionResult<WishListWrapper> GetWishList(string userKey)
        {
            if (string.IsNullOrWhiteSpace(userKey))
            {
                return BadRequest($"{nameof(userKey)} cannot be empty");
            }
            UserKeyProvider.UserKey = userKey;
            var wishList = _wishListService.GetWishList();
            return wishList;
        }

        [HttpPut]
        public ActionResult<WishListWrapper> PutWishList(string userKey, List<WishListPutResquestDto> request)
        {
            if (string.IsNullOrWhiteSpace(userKey))
            {
                return BadRequest($"{nameof(userKey)} cannot be empty");
            }
            if (request == null)
            {
                return BadRequest($"{nameof(request)} cannot be null");
            }
            UserKeyProvider.UserKey = userKey;
            var wishList = _wishListService.PutWishList(request);
            return Ok(wishList);
        }

        [HttpPost]
        [Route("Add/{itemId}")]
        public ActionResult AddItemToWishList(int townId, int itemId, int userId)
        {
            _wishListService.AddItemToWishList(townId: townId, itemId: itemId, userId: userId);
            return Ok();
        }

    }
}
