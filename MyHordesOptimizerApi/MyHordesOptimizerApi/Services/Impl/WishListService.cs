using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.WishList;
using MyHordesOptimizerApi.Extensions;
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
        protected IMyHordesOptimizerRepository FirebaseRepository { get; set; }

        private int _townId; // On est dans de l'injection de dépendance Scoped, on peut se permettre de stocker des infos

        public WishListService(ILogger<MyHordesFetcherService> logger,
            IUserInfoProvider userInfoProvider,
            IMyHordesApiRepository myHordesJsonApiRepository,
            IMyHordesOptimizerRepository firebaseRepository)
        {
            Logger = logger;
            UserInfoProvider = userInfoProvider;
            MyHordesJsonApiRepository = myHordesJsonApiRepository;
            FirebaseRepository = firebaseRepository;
        }

        public WishListWrapper GetWishList()
        {
            var myHordeMeResponse = MyHordesJsonApiRepository.GetMe();
            _townId = myHordeMeResponse.Map.Id;

            var town = FirebaseRepository.GetTown(myHordeMeResponse.Map.Id);
            var wishList = town.WishList;
            if (wishList == null)
            {
                return new WishListWrapper();
            }

            var recipes = FirebaseRepository.GetRecipes();
            foreach (var kvp in wishList.WishList)
            {
                var wishlistItem = kvp.Value;
                if (town.Bank.Bank.TryGetValue(wishlistItem.Item.Id.ToString(), out var bankItem))
                {
                    wishlistItem.BankCount = bankItem.Count;
                }
                else
                {
                    wishlistItem.BankCount = 0;
                }
                wishlistItem.IsWorkshop = recipes.Values.Any(x => x.Type == ItemRecipeType.Workshop.GetDescription()
                                                             && (x.Components.Any(component => component.Id == wishlistItem.Item.Id) || x.Result.Any(result => result.Item.Id == wishlistItem.Item.Id)));
            }
            return wishList;
        }

        public WishListWrapper PutWishList(List<WishListPutResquestDto> wishListPutRequest)
        {
            var myHordeMeResponse = MyHordesJsonApiRepository.GetMe();
            var items = FirebaseRepository.GetItems();
            var wishListWrapper = new WishListWrapper()
            {
                LastUpdateInfo = UserInfoProvider.GenerateLastUpdateInfo()
            };
            foreach (var request in wishListPutRequest)
            {
                var itemId = request.Id;
                var wishLiteItem = new WishListItem()
                {
                    Item = items.First(x => x.Id == itemId),
                    Count = request.Count,
                    Priority = request.Priority
                };
                wishListWrapper.WishList[itemId.ToString()] = wishLiteItem;
            }
            FirebaseRepository.PutWishList(myHordeMeResponse.Map.Id, wishListWrapper);
            return wishListWrapper;
        }

        public void AddItemToWishList(int itemId)
        {
            var item = FirebaseRepository.GetItemsById(itemId);
            var wishList = GetWishList();
            wishList.LastUpdateInfo = UserInfoProvider.GenerateLastUpdateInfo();
            if (wishList.WishList.TryGetValue(item.Id.ToString(), out var @out)) // Si l'item est déjà dans la wishlist, on ne fait rien
            {
                return;
            }
            wishList.WishList[item.Id.ToString()] = new WishListItem()
            {
                Item = item,
                Priority = 0,
                Count = 1
            };
            FirebaseRepository.PutWishList(_townId, wishList);
        }

    }
}
