using AutoMapper;
using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.WishList;
using MyHordesOptimizerApi.Models;
using MyHordesOptimizerApi.Providers.Interfaces;
using MyHordesOptimizerApi.Repository.Interfaces;
using MyHordesOptimizerApi.Services.Interfaces;
using System.Collections.Generic;
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
            var wishList = MyHordesOptimizerRepository.GetWishList(townId);
            var recipes = MyHordesOptimizerRepository.GetRecipes();
            var bank = MyHordesOptimizerRepository.GetBank(townId);
            foreach (var wishlistItem in wishList.WishList)
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
                wishlistItem.IsWorkshop = recipes.Any(x => x.Type.StartsWith("WORKSHOP")
                                                             && (x.Components.Any(component => component.Id == wishlistItem.Item.Id) || x.Result.Any(result => result.Item.Id == wishlistItem.Item.Id)));
            }
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
