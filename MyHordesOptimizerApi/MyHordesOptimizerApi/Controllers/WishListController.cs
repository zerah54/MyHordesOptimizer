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

        public WishListController(ILogger<AbstractMyHordesOptimizerControllerBase> logger,
            IUserInfoProvider userKeyProvider,
            IWishListService wishListService,
            IMemoryCache cache) : base(logger, userKeyProvider)
        {
            _wishListService = wishListService;
            _cache = cache;
        }

        [HttpGet]
        [TypeFilter(typeof(ETagCacheFilter), Arguments = new object[] { ETagResource.WishList, "townId" })]
        public ActionResult<WishListLastUpdateDto> GetWishList(int townId)
        {
            var wishList = _wishListService.GetWishList(townId);
            return wishList;
        }

        [HttpPut]
        public ActionResult<WishListLastUpdateDto> PutWishList(int townId, int userId, List<WishListPutResquestDto> request)
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
            var categories = _cache.GetOrCreate(ReferentialCacheKeys.WishListCategories,
                _ => _wishListService.GetWishListCategories());
            return categories;
        }

        [HttpGet]
        [Route("Templates")]
        public ActionResult<List<WishlistTemplateDto>> GetWishListTemplates()
        {
            var templates = _cache.GetOrCreate(ReferentialCacheKeys.WishListTemplates,
                _ => _wishListService.GetWishListTemplates());
            return templates;
        }

        [HttpPost]
        [Route("Template/{templateId}")]
        public ActionResult<WishListLastUpdateDto> CreateFromTemplate(int? townId, int? userId, int? templateId)
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
