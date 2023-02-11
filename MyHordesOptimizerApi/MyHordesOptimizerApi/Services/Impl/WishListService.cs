using AutoMapper;
using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.WishList;
using MyHordesOptimizerApi.Extensions.Models;
using MyHordesOptimizerApi.Models;
using MyHordesOptimizerApi.Providers.Interfaces;
using MyHordesOptimizerApi.Repository.Interfaces;
using MyHordesOptimizerApi.Services.Interfaces;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;

namespace MyHordesOptimizerApi.Services.Impl
{
    public class WishListService : IWishListService
    {
        protected ILogger<MyHordesFetcherService> Logger { get; set; }

        protected IUserInfoProvider UserInfoProvider { get; set; }
        protected IMyHordesApiRepository MyHordesJsonApiRepository { get; set; }
        protected IMyHordesOptimizerRepository MyHordesOptimizerRepository { get; set; }
        protected IMapper Mapper { get; set; }

        public WishListService(ILogger<MyHordesFetcherService> logger,
            IUserInfoProvider userInfoProvider,
            IMyHordesApiRepository myHordesJsonApiRepository,
            IMyHordesOptimizerRepository firebaseRepository,
            IMapper mapper)
        {
            Logger = logger;
            UserInfoProvider = userInfoProvider;
            MyHordesJsonApiRepository = myHordesJsonApiRepository;
            MyHordesOptimizerRepository = firebaseRepository;
            Mapper = mapper;
        }

        public WishListWrapper GetWishList(int townId)
        {
            var sw = new Stopwatch();
            sw.Start();
            var wishList = MyHordesOptimizerRepository.GetWishList(townId);
            Logger.LogInformation($"[GetWishList] GetWishList : {sw.ElapsedMilliseconds}");
            var recipes = MyHordesOptimizerRepository.GetRecipes().ToList();
            Logger.LogInformation($"[GetWishList] GetRecipes : {sw.ElapsedMilliseconds}");
            var bank = MyHordesOptimizerRepository.GetBank(townId);
            Logger.LogInformation($"[GetWishList] GetBank : {sw.ElapsedMilliseconds}");
            var allBagsItem = MyHordesOptimizerRepository.GetAllBagItems(townId);
            var wishListItems = wishList.WishList.Values.SelectMany(x => x).ToList();
            foreach (var wishlistItem in wishListItems)
            {
                var bankItem = bank.Bank.FirstOrDefault(x => x.Item.Id == wishlistItem.Item.Id);
                if (bankItem != null)
                {
                    wishlistItem.BankCount = bankItem.Count;
                }
                else
                {
                    wishlistItem.BankCount = 0;
                }
                var bagItem = allBagsItem.SingleOrDefault(x => x.IdItem == wishlistItem.Item.Id);
                if(bagItem != null)
                {
                    wishlistItem.BagCount = bagItem.Count;
                }
                wishlistItem.IsWorkshop = recipes.Any(x => x.Type.StartsWith("WORKSHOP")
                                                             && (x.Components.Any(component => component.Id == wishlistItem.Item.Id) || x.Result.Any(result => result.Item.Id == wishlistItem.Item.Id)));
            }
            Logger.LogInformation($"[GetWishList] Récupération bankcount : {sw.ElapsedMilliseconds}");
            wishListItems.ForEach(wishlist => wishlist.Item.Recipes = recipes.GetRecipeForItem(wishlist.Item.Id));
            Logger.LogInformation($"[GetWishList] Association des recipes : {sw.ElapsedMilliseconds}");
            return wishList;
        }

        public WishListWrapper PutWishList(int townId, int userId, List<WishListPutResquestDto> wishListPutRequest)
        {
            var items = Mapper.Map<List<TownWishlistItemModel>>(wishListPutRequest);
            MyHordesOptimizerRepository.PutWishList(townId, userId, items);
            var wishList = MyHordesOptimizerRepository.GetWishList(townId);
            return wishList;
        }

        public void AddItemToWishList(int townId, int userId, int itemId)
        {
            MyHordesOptimizerRepository.AddItemToWishlist(townId, itemId, userId);
        }

    }
}
