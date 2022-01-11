using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.Controllers.Abstract;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
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
        public ActionResult PutWishList(string userKey, Dictionary<string, WishListItem> wishList)
        {
            if (string.IsNullOrWhiteSpace(userKey))
            {
                return BadRequest($"{nameof(userKey)} cannot be empty");
            }
            if(wishList == null)
            {
                return BadRequest($"{nameof(wishList)} cannot be null");
            }
            UserKeyProvider.UserKey = userKey;
            _wishListService.PutWishList(wishList);
            return Ok();
        }

        [HttpPost]
        [Route("Add/{itemId}")]
        public ActionResult AddItemToWishList(string userKey, int itemId)
        {
            if (string.IsNullOrWhiteSpace(userKey))
            {
                return BadRequest($"{nameof(userKey)} cannot be empty");
            }
            UserKeyProvider.UserKey = userKey;
            _wishListService.AddItemToWishList(itemId);
            return Ok();
        }

    }
}
