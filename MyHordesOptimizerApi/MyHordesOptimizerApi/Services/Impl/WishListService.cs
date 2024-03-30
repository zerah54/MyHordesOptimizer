using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.WishList;
using MyHordesOptimizerApi.Models;
using MyHordesOptimizerApi.Providers.Interfaces;
using MyHordesOptimizerApi.Repository.Interfaces;
using MyHordesOptimizerApi.Services.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;

namespace MyHordesOptimizerApi.Services.Impl
{
    public class WishListService : IWishListService
    {
        protected ILogger<MyHordesFetcherService> Logger { get; set; }

        protected IUserInfoProvider UserInfoProvider { get; set; }
        protected IMyHordesApiRepository MyHordesJsonApiRepository { get; set; }
        protected IServiceScopeFactory ServiceScopeFactory { get; private set; }
        protected IMapper Mapper { get; set; }
        protected MhoContext DbContext { get; init; }

        public WishListService(ILogger<MyHordesFetcherService> logger,
            IUserInfoProvider userInfoProvider,
            IMyHordesApiRepository myHordesJsonApiRepository,
            IServiceScopeFactory serviceScopeFactory,
            IMapper mapper,
            MhoContext context)
        {
            Logger = logger;
            UserInfoProvider = userInfoProvider;
            MyHordesJsonApiRepository = myHordesJsonApiRepository;
            ServiceScopeFactory = serviceScopeFactory;
            Mapper = mapper;
            DbContext = context;
        }

        public WishListLastUpdateDto GetWishList(int townId)
        {
            var wishListItems = DbContext.TownWishListItems
                .Where(wishList => wishList.IdTown == townId)
                .Include(wishlist => wishlist.IdItemNavigation)
                    .ThenInclude(item => item.IdCategoryNavigation)
                    .AsSplitQuery()
                .Include(wishlist => wishlist.IdItemNavigation)
                    .ThenInclude(item => item.PropertyNames)
                    .AsSplitQuery()
                .Include(wishlist => wishlist.IdItemNavigation)
                    .ThenInclude(item => item.ActionNames)
                    .AsSplitQuery()
                .Include(wishlist => wishlist.IdItemNavigation)
                    .ThenInclude(item => item.RecipeItemComponents)
                        .ThenInclude(recipe => recipe.RecipeNameNavigation)
                            .ThenInclude(recipe => recipe.RecipeItemResults)
                            .AsSplitQuery()
                .Include(wishlist => wishlist.IdItemNavigation)
                    .ThenInclude(item => item.RecipeItemResults)
                    .AsSplitQuery()
                .Include(wishlist => wishlist.IdItemNavigation)
                    .ThenInclude(item => item.TownBankItems.Where(bankItem => bankItem.IdTown == townId))
                    .AsSplitQuery()
                .Include(wishlist => wishlist.IdTownNavigation)
                    .ThenInclude(town => town.TownCitizens.Where(townCitizen => townCitizen.IdTown == townId))
                        .ThenInclude(townCitizen => townCitizen.IdBagNavigation)
                            .ThenInclude(citizenBag => citizenBag.BagItems)
                                .ThenInclude(bagItem => bagItem.IdItemNavigation)
                                .AsSplitQuery()
                .Include(wishlist => wishlist.IdTownNavigation)
                    .ThenInclude(town => town.IdUserWishListUpdaterNavigation)
                        .AsSplitQuery()
                .ToList();
            if (wishListItems.Any())
            {
                var itemsDto = Mapper.Map<List<WishListItemDto>>(wishListItems);
                var dto = new WishListLastUpdateDto()
                {
                    LastUpdateInfo = new LastUpdateInfoDto()
                    {
                        UserId = wishListItems.First().IdTownNavigation.IdUserWishListUpdaterNavigation.IdUser,
                        UserName = wishListItems.First().IdTownNavigation.IdUserWishListUpdaterNavigation.Name,
                        UpdateTime = wishListItems.First().IdTownNavigation.WishlistDateUpdate.Value
                    },
                    WishList = itemsDto.GroupBy(item => item.ZoneXPa, item => item).ToDictionary(group => group.Key, group => group.ToList())
                };
                return dto;
            }
            else
            {
                return new WishListLastUpdateDto();
            }
        }

        public WishListLastUpdateDto PutWishList(int townId, int userId, List<WishListPutResquestDto> wishListPutRequest)
        {
            var items = Mapper.Map<List<TownWishListItem>>(wishListPutRequest);
            using var transaction = DbContext.Database.BeginTransaction();
            DbContext.TownWishListItems.RemoveRange(DbContext.TownWishListItems.Where(townWishListItem => townWishListItem.IdTown == townId));
            var town = DbContext.Towns
                .Where(town => town.IdTown == townId)
                .Include(town => town.TownWishListItems)
                .Single();
            town.TownWishListItems = items;
            town.IdUserWishListUpdater = userId;
            town.WishlistDateUpdate = DateTime.UtcNow;
            DbContext.Update(town);
            DbContext.SaveChanges();
            transaction.Commit();
            return GetWishList(townId);
        }

        public WishListLastUpdateDto CreateFromTemplate(int townId, int userId, int templateId)
        {
            //var itemTemplates = MyHordesOptimizerRepository.GetWishListTemplate(templateId);
            //var items = Mapper.Map<List<TownWishlistItemModel>>(itemTemplates);
            //MyHordesOptimizerRepository.PutWishList(townId, userId, items);
            //var wishList = MyHordesOptimizerRepository.GetWishList(townId);
            //return wishList;
            return null;
        }

        public void AddItemToWishList(int townId, int userId, int itemId, int zoneXPa)
        {
            //MyHordesOptimizerRepository.AddItemToWishlist(townId, itemId, userId, zoneXPa);
        }

        public List<WishlistCategorieDto> GetWishListCategories()
        {
            //var models = MyHordesOptimizerRepository.GetWishListCategories();
            //var groupping = models.GroupBy(x => x.IdCategory);
            //var dtos = Mapper.Map<List<WishlistCategorieDto>>(groupping);
            //return dtos;
            return null;
        }

        public List<WishlistTemplateDto> GetWishListTemplates()
        {
            //var models = MyHordesOptimizerRepository.GetWishListTemplates();
            //var groupping = models.GroupBy(x => x.IdDefaultWishlist);
            //var dtos = Mapper.Map<List<WishlistTemplateDto>>(groupping);
            //return dtos;
            return null;
        }
    }
}
