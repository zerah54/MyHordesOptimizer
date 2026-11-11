using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.WishList;
using MyHordesOptimizerApi.Exceptions;
using MyHordesOptimizerApi.Models;
using MyHordesOptimizerApi.Providers.Interfaces;
using MyHordesOptimizerApi.Repository.Interfaces;
using MyHordesOptimizerApi.Services.Impl.Locking;
using MyHordesOptimizerApi.Services.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;

namespace MyHordesOptimizerApi.Services.Impl
{
    public class WishListService : IWishListService
    {
        private const int GroupNameMaxLength = 64;

        protected ILogger<MyHordesFetcherService> Logger { get; set; }

        protected IUserInfoProvider UserInfoProvider { get; set; }
        protected IMyHordesApiRepository MyHordesJsonApiRepository { get; set; }
        protected IServiceScopeFactory ServiceScopeFactory { get; private set; }
        protected IMapper Mapper { get; set; }
        protected MhoContext DbContext { get; init; }
        protected TownSyncLock TownSyncLock { get; init; }
        protected ITownAccessService TownAccessService { get; init; }

        public WishListService(ILogger<MyHordesFetcherService> logger,
            IUserInfoProvider userInfoProvider,
            IMyHordesApiRepository myHordesJsonApiRepository,
            IServiceScopeFactory serviceScopeFactory,
            IMapper mapper,
            MhoContext context,
            TownSyncLock townSyncLock,
            ITownAccessService townAccessService)
        {
            Logger = logger;
            UserInfoProvider = userInfoProvider;
            MyHordesJsonApiRepository = myHordesJsonApiRepository;
            ServiceScopeFactory = serviceScopeFactory;
            Mapper = mapper;
            DbContext = context;
            TownSyncLock = townSyncLock;
            TownAccessService = townAccessService;
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
                .Include(wishlist => wishlist.IdItemNavigation)
                    .ThenInclude(item => item.MapCellItems.Where(mapCellItem => mapCellItem.IdCellNavigation.IdTown == townId))
                        .ThenInclude(mapCellItem => mapCellItem.IdCellNavigation)
                    .AsSplitQuery()
                .Include(wishlist => wishlist.IdTownNavigation)
                    .ThenInclude(town => town.TownCitizens.Where(townCitizen => townCitizen.IdTown == townId))
                        .ThenInclude(townCitizen => townCitizen.IdBagNavigation)
                            .ThenInclude(citizenBag => citizenBag!.BagItems)
                                .ThenInclude(bagItem => bagItem.IdItemNavigation)
                                .AsSplitQuery()
                .Include(wishlist => wishlist.IdTownNavigation)
                    .ThenInclude(town => town.TownCitizens.Where(townCitizen => townCitizen.IdTown == townId))
                        .ThenInclude(townCitizen => townCitizen.IdChestNavigation)
                            .ThenInclude(citizenChest => citizenChest!.ChestItems)
                                .ThenInclude(chestItem => chestItem.IdItemNavigation)
                                .AsSplitQuery()
                .Include(wishlist => wishlist.IdTownNavigation)
                    .ThenInclude(town => town.TownCitizens.Where(townCitizen => townCitizen.IdTown == townId))
                        .ThenInclude(townCitizen => townCitizen.IdUserNavigation)
                        .AsSplitQuery()
                .Include(wishlist => wishlist.IdTownNavigation)
                    .ThenInclude(town => town.IdUserWishListUpdaterNavigation)
                        .AsSplitQuery()
                .ToList();
            var groups = Mapper.Map<List<WishListGroupDto>>(DbContext.TownWishListGroups
                .Where(group => group.IdTown == townId)
                .OrderBy(group => group.Name)
                .ToList());
            if (wishListItems.Any())
            {
                var itemsDto = Mapper.Map<List<WishListItemDto>>(wishListItems);
                var dto = new WishListLastUpdateDto()
                {
                    LastUpdateInfo = new LastUpdateInfoDto()
                    {
                        UserId = wishListItems.First().IdTownNavigation.IdUserWishListUpdaterNavigation!.IdUser,
                        UserName = wishListItems.First().IdTownNavigation.IdUserWishListUpdaterNavigation!.Name,
                        UpdateTime = wishListItems.First().IdTownNavigation.WishlistDateUpdate!.Value
                    },
                    WishList = itemsDto,
                    Groups = groups
                };
                return dto;
            }
            else
            {
                return new WishListLastUpdateDto { Groups = groups };
            }
        }

        public WishListLastUpdateDto PutWishList(int townId, int userId, WishListPutBodyDto body)
        {
            // Clé de verrou = mapId brut, jamais le townId résolu (cf. commentaire sur MhoContext.ResolveTownId
            // et le verrou de synchro/login sur -mapId) : sans ça, une synchro concurrente sur la même ville
            // verrouillerait un sémaphore différent et ne s'excluerait pas de cette écriture.
            using var townLock = TownSyncLock.AcquireTownBlocking(-townId);
            var mapId = townId;
            townId = DbContext.ResolveTownId(townId);
            TownAccessService.EnsureCanWriteTown(townId, mapId);

            var groupsByUid = ValidateGroups(body.Groups);
            ValidateItemReferences(body.Items);
            var items = new List<TownWishListItem>();
            foreach (var request in body.Items)
            {
                var item = Mapper.Map<TownWishListItem>(request);
                if (request.GroupUid != null)
                {
                    if (!Guid.TryParse(request.GroupUid, out var guid) || !groupsByUid.TryGetValue(guid.ToString(), out var group))
                    {
                        throw new MhoBadRequestException($"Groupe inconnu : {request.GroupUid}");
                    }
                    item.GroupUid = group.Uid;
                    item.ZoneXpa = group.ZoneXpa;
                    item.Depot = group.Depot;
                    item.Priority = group.Priority;
                    item.Count = group.Count;
                }
                items.Add(item);
            }
            if (items.GroupBy(item => (item.IdItem, item.ZoneXpa)).Any(duplicates => duplicates.Count() > 1))
            {
                throw new MhoConflictException("Un même objet ne peut figurer qu'une fois par zone.");
            }
            var usedGroupUids = items.Where(item => item.GroupUid != null).Select(item => item.GroupUid!).ToHashSet();
            var groups = groupsByUid.Values.Where(group => usedGroupUids.Contains(group.Uid)).ToList();
            foreach (var group in groups)
            {
                group.IdTown = townId;
            }

            using var transaction = DbContext.Database.BeginTransaction();
            DbContext.TownWishListGroups.RemoveRange(DbContext.TownWishListGroups.Where(group => group.IdTown == townId));
            DbContext.TownWishListItems.RemoveRange(DbContext.TownWishListItems.Where(townWishListItem => townWishListItem.IdTown == townId));
            DbContext.SaveChanges();
            var town = DbContext.Towns
                .Where(town => town.IdTown == townId)
                .Single();
            DbContext.TownWishListGroups.AddRange(groups);
            foreach (var item in items)
            {
                item.IdTown = townId;
            }
            DbContext.TownWishListItems.AddRange(items);
            town.IdUserWishListUpdater = userId;
            town.WishlistDateUpdate = DateTime.UtcNow;
            DbContext.SaveChanges();
            transaction.Commit();
            return GetWishListByResolvedTownId(townId);
        }

        /// <summary>Valide uid (Guid, unique) et nom (1 à 64 caractères) des groupes ; renvoie les groupes normalisés par uid canonique.</summary>
        private static Dictionary<string, TownWishListGroup> ValidateGroups(List<WishListGroupDto> groups)
        {
            var result = new Dictionary<string, TownWishListGroup>();
            foreach (var dto in groups)
            {
                if (dto == null || !Guid.TryParse(dto.Uid, out var guid))
                {
                    throw new MhoBadRequestException("Uid de groupe invalide.");
                }
                var name = dto.Name?.Trim();
                if (string.IsNullOrEmpty(name) || name.Length > GroupNameMaxLength)
                {
                    throw new MhoBadRequestException($"Le nom d'un groupe doit comporter de 1 à {GroupNameMaxLength} caractères.");
                }
                var uid = guid.ToString();
                if (!result.TryAdd(uid, new TownWishListGroup { Uid = uid, Name = name, Priority = dto.Priority, ZoneXpa = dto.ZoneXPa, Depot = dto.Depot, Count = dto.Count }))
                {
                    throw new MhoBadRequestException($"Uid de groupe en double : {uid}");
                }
            }
            return result;
        }

        private void ValidateItemReferences(List<WishListPutResquestDto> items)
        {
            var ids = items.Select(item => item.Id).Distinct().ToList();
            var known = DbContext.Items.Where(item => ids.Contains(item.IdItem)).Select(item => item.IdItem).ToHashSet();
            if (ids.Any(id => !known.Contains(id)))
            {
                throw new MhoBadRequestException($"Objet inconnu : {ids.First(id => !known.Contains(id))}");
            }
        }

        public void AddItemToWishList(int townId, int userId, int itemId, int zoneXPa)
        {
            using var townLock = TownSyncLock.AcquireTownBlocking(-townId);
            var mapId = townId;
            townId = DbContext.ResolveTownId(townId);
            TownAccessService.EnsureCanWriteTown(townId, mapId);
            using var transaction = DbContext.Database.BeginTransaction();
            var town = DbContext.Towns
             .Where(town => town.IdTown == townId)
             .Include(town => town.TownWishListItems)
             .Single();
            if (town.TownWishListItems.Any(wishItem => wishItem.IdItem == itemId && wishItem.ZoneXpa == zoneXPa))
            {
                throw new MhoConflictException("Cet objet figure déjà dans la liste pour cette zone.");
            }
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

        public WishListLastUpdateDto AddGroupToWishList(int townId, int userId, WishListGroupAddRequestDto request)
        {
            using var townLock = TownSyncLock.AcquireTownBlocking(-townId);
            var mapId = townId;
            townId = DbContext.ResolveTownId(townId);
            TownAccessService.EnsureCanWriteTown(townId, mapId);

            var itemIds = request.ItemIds.Distinct().ToList();
            var groupDto = new WishListGroupDto { Uid = Guid.NewGuid().ToString(), Name = request.Name, ZoneXPa = request.ZoneXPa, Count = request.Count };
            var group = ValidateGroups(new List<WishListGroupDto> { groupDto }).Values.Single();
            ValidateItemReferences(itemIds.Select(id => new WishListPutResquestDto { Id = id }).ToList());

            using var transaction = DbContext.Database.BeginTransaction();
            // Le premier placé garde l'objet : on ignore ceux déjà présents dans la zone.
            var placed = DbContext.TownWishListItems
                .Where(wishItem => wishItem.IdTown == townId && wishItem.ZoneXpa == group.ZoneXpa)
                .Select(wishItem => wishItem.IdItem)
                .ToHashSet();
            var newItemIds = itemIds.Where(id => !placed.Contains(id)).ToList();
            if (newItemIds.Count > 0)
            {
                group.IdTown = townId;
                DbContext.TownWishListGroups.Add(group);
                DbContext.TownWishListItems.AddRange(newItemIds.Select(id => new TownWishListItem
                {
                    IdTown = townId,
                    IdItem = id,
                    ZoneXpa = group.ZoneXpa,
                    Depot = group.Depot,
                    Priority = group.Priority,
                    Count = group.Count,
                    GroupUid = group.Uid
                }));
                var town = DbContext.Towns.Single(town => town.IdTown == townId);
                town.IdUserWishListUpdater = userId;
                town.WishlistDateUpdate = DateTime.UtcNow;
                DbContext.SaveChanges();
            }
            transaction.Commit();
            return GetWishListByResolvedTownId(townId);
        }
    }
}
