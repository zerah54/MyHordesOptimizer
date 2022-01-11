using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
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
        protected IMyHordesJsonApiRepository MyHordesJsonApiRepository { get; set; }
        protected IMyHordesOptimizerFirebaseRepository FirebaseRepository { get; set; }

        private int _townId; // On est dans de l'injection de dépendance Scoped, on peut se permettre de stocker des infos

        public WishListService(ILogger<MyHordesFetcherService> logger,
            IUserInfoProvider userInfoProvider,
            IMyHordesJsonApiRepository myHordesJsonApiRepository,
            IMyHordesOptimizerFirebaseRepository firebaseRepository)
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

            // Enregistrer en base
            var town = FirebaseRepository.GetTown(myHordeMeResponse.Map.Id);
            var wishList = town.WishList;
            if (wishList == null)
            {
                return new WishListWrapper();
            }

            foreach (var kvp in wishList.WishList)
            {
                var wishlistItem = kvp.Value;
                if (town.Bank.Bank.TryGetValue(wishlistItem.Item.XmlId.ToString(), out var bankItem))
                {
                    wishlistItem.BankCount = bankItem.Count;
                }
                else
                {
                    wishlistItem.BankCount = 0;
                }
            }
            return wishList;
        }

        public void PutWishList(Dictionary<string, WishListItem> wishList)
        {
            var myHordeMeResponse = MyHordesJsonApiRepository.GetMe();
            var items = FirebaseRepository.GetItems();
            foreach (var itemId in wishList.Keys)
            {
                wishList[itemId].Item = items.First(x => x.XmlId == int.Parse(itemId));
            }
            var wishListWrapper = new WishListWrapper()
            {
                WishList = wishList,
                LastUpadteInfo = UserInfoProvider.GenerateLastUpdateInfo()
            };

            FirebaseRepository.PutWishList(myHordeMeResponse.Map.Id, wishListWrapper);
        }

        public void AddItemToWishList(int itemId)
        {
            var item = FirebaseRepository.GetItemsById(itemId);
            var wishList = GetWishList();
            wishList.LastUpadteInfo = UserInfoProvider.GenerateLastUpdateInfo();
            if (wishList.WishList.TryGetValue(item.XmlId.ToString(), out var @out)) // Si l'item est déjà dans la wishlist, on ne fait rien
            {
                return;
            }
            wishList.WishList[item.XmlId.ToString()] = new WishListItem()
            {
                Item = item,
                Priority = 0,
                Count = 1
            };
            FirebaseRepository.PutWishList(_townId, wishList);
        }

    }
}
