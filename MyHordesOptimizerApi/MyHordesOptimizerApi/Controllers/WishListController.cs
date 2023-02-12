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
        public ActionResult<WishListWrapper> GetWishList(int townId)
        {
            var wishList = _wishListService.GetWishList(townId);
            return wishList;
        }

        [HttpPut]
        public ActionResult<WishListWrapper> PutWishList(int townId, int userId, List<WishListPutResquestDto> request)
        {
            if (request == null)
            {
                return BadRequest($"{nameof(request)} cannot be null");
            }
            var wishList = _wishListService.PutWishList(townId, userId, request);
            return Ok(wishList);
        }

        [HttpPost]
        [Route("Add/{itemId}")]
        public ActionResult AddItemToWishList(int? townId, int? itemId, int? userId, int zoneXPa)
        {
            if (!townId.HasValue)
            {
                return BadRequest($"{nameof(townId)} cannot be null");
            }
            if (!itemId.HasValue)
            {
                return BadRequest($"{nameof(itemId)} cannot be null");
            }
            if (!userId.HasValue)
            {
                return BadRequest($"{nameof(userId)} cannot be null");
            }
            _wishListService.AddItemToWishList(townId: townId.Value, itemId: itemId.Value, userId: userId.Value, zoneXPa: zoneXPa);
            return Ok();
        }

        [HttpGet]
        [Route("Categories")]
        public ActionResult<List<WishlistCategorieDto>> GetWishListCategories()
        {
            var categories = _wishListService.GetWishListCategories();
            return categories;
        }

        [HttpGet]
        [Route("Templates")]
        public ActionResult<List<WishlistTemplateDto>> GetWishListTemplates()
        {
            var templates = _wishListService.GetWishListTemplates();
            return templates;
        }

        [HttpPost]
        [Route("Template/{templateId}")]
        public ActionResult<WishListWrapper> CreateFromTemplate(int? townId, int? userId, int? templateId)
        {
            if (!townId.HasValue)
            {
                return BadRequest($"{nameof(townId)} cannot be null");
            }
            if (!userId.HasValue)
            {
                return BadRequest($"{nameof(userId)} cannot be null");
            }
            if (!templateId.HasValue)
            {
                return BadRequest($"{nameof(templateId)} cannot be null");
            }
            var wishList = _wishListService.CreateFromTemplate(townId.Value, userId.Value, templateId.Value);
            return wishList;
        }
    }
}
