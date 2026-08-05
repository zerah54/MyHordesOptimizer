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
            townId = DbContext.ResolveTownId(townId);
            return GetWishListByResolvedTownId(townId);
        }

        // À appeler avec un townId DÉJÀ résolu (ex: en fin d'écriture, dans le même service).
        // ResolveTownId ne doit être appliqué qu'une fois : le réappliquer à un IdTown déjà résolu
        // le confond avec un MapId externe, ne trouve aucune correspondance, et retombe sur -townId
        // (cf. commentaire sur MhoContext.ResolveTownId) → wishlist vide juste après l'écriture.
        private WishListLastUpdateDto GetWishListByResolvedTownId(int townId)
        {
            var townBankItemLastUpdateId = DbContext.TownBankItems
                .Where(tbi => tbi.IdTown == townId)
                .Max(tbi => (int?)tbi.IdLastUpdateInfo);

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
                    .ThenInclude(item => item.TownBankItems.Where(bankItem => bankItem.IdTown == townId && townBankItemLastUpdateId != null && bankItem.IdLastUpdateInfo == townBankItemLastUpdateId))
                    .AsSplitQuery()
                .Include(wishlist => wishlist.IdTownNavigation)
                    .ThenInclude(town => town.TownCitizens.Where(townCitizen => townCitizen.IdTown == townId))
                        .ThenInclude(townCitizen => townCitizen.IdBagNavigation)
                            .ThenInclude(citizenBag => citizenBag.BagItems)
                                .ThenInclude(bagItem => bagItem.IdItemNavigation)
                                .AsSplitQuery()
                .Include(wishlist => wishlist.IdTownNavigation)
                    .ThenInclude(town => town.TownCitizens.Where(townCitizen => townCitizen.IdTown == townId))
                        .ThenInclude(townCitizen => townCitizen.IdUserNavigation)
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
                    WishList = itemsDto
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
            townId = DbContext.ResolveTownId(townId);
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
            return GetWishListByResolvedTownId(townId);
        }

        public WishListLastUpdateDto CreateFromTemplate(int townId, int userId, int templateId)
        {
            townId = DbContext.ResolveTownId(townId);
            using var transaction = DbContext.Database.BeginTransaction();
            DbContext.TownWishListItems.RemoveRange(DbContext.TownWishListItems.Where(townWishListItem => townWishListItem.IdTown == townId));
            var templateWishList = DbContext.DefaultWishlistItems.Where(defaultWishListitem => defaultWishListitem.IdDefaultWishlist == templateId)
                .ToList();
            var items = Mapper.Map<List<TownWishListItem>>(templateWishList);
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
            return GetWishListByResolvedTownId(townId);
        }

        public void AddItemToWishList(int townId, int userId, int itemId, int zoneXPa)
        {
            townId = DbContext.ResolveTownId(townId);
            using var transaction = DbContext.Database.BeginTransaction();
            var town = DbContext.Towns
             .Where(town => town.IdTown == townId)
             .Include(town => town.TownWishListItems)
             .Single();
            town.TownWishListItems.Add(new TownWishListItem()
            {
                ZoneXpa = zoneXPa,
                IdItem = itemId,
                Count = -1
            });
            town.IdUserWishListUpdater = userId;
            town.WishlistDateUpdate = DateTime.UtcNow;
            DbContext.Update(town);
            DbContext.SaveChanges();
            transaction.Commit();
        }

        public List<WishlistCategorieDto> GetWishListCategories()
        {
            var models = DbContext.WishlistCategories
                .Include(wshlstCategorie => wshlstCategorie.IdItems)
                .ToList();
            var dtos = Mapper.Map<List<WishlistCategorieDto>>(models);
            return dtos;
        }

        public List<WishlistTemplateDto> GetWishListTemplates()
        {
            // L'objet est CHARGÉ, sinon la navigation reste nulle et chaque entrée sort avec
            // « item: null » — un modèle de liste de courses sans aucun objet identifiable.
            // Catégorie, propriétés et actions suivent parce que le DTO d'objet les expose, comme
            // sur les autres chemins qui le produisent.
            var models = DbContext.DefaultWishlistItems
                .Include(model => model.IdItemNavigation)
                    .ThenInclude(item => item.IdCategoryNavigation)
                .Include(model => model.IdItemNavigation)
                    .ThenInclude(item => item.PropertyNames)
                .Include(model => model.IdItemNavigation)
                    .ThenInclude(item => item.ActionNames)
                .AsSplitQuery()
                .ToList();

            // Regroupement sur des valeurs SCALAIRES uniquement. La version précédente incluait un
            // Dictionary dans la clé anonyme : les dictionnaires se comparant par référence, chaque
            // ligne formait son propre groupe — d'où 35 modèles d'un objet là où le fichier n'en
            // décrit qu'un seul de 35 objets.
            var templates = models.GroupBy(model => new
            {
                model.IdDefaultWishlist,
                model.IdUserAuthor,
                model.Name,
                model.LabelFr,
                model.LabelEn,
                model.LabelEs,
                model.LabelDe
            });
            var dtos = new List<WishlistTemplateDto>();
            foreach (var group in templates)
            {
                dtos.Add(new WishlistTemplateDto()
                {
                    IdTemplate = group.Key.IdDefaultWishlist,
                    IdUserAuthor = group.Key.IdUserAuthor,
                    Labels = new Dictionary<string, string>()
                    {
                        { "fr", group.Key.LabelFr },
                        { "en", group.Key.LabelEn },
                        { "es", group.Key.LabelEs },
                        { "de", group.Key.LabelDe }
                    },
                    Name = group.Key.Name,
                    Items = Mapper.Map<List<WishListItemDto>>(group.ToList())
                });
            }
            return dtos;
        }
    }
}
