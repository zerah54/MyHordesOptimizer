using AutoMapper;
using MyHordesOptimizerApi.Dtos.MyHordes.Items;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Citizens;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.Bags;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.Home;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Map;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.WishList;
using MyHordesOptimizerApi.Extensions;
using MyHordesOptimizerApi.MappingProfiles.Converters;
using MyHordesOptimizerApi.Models;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;

namespace MyHordesOptimizerApi.MappingProfiles
{
    public class MHOModelMappingProfiles : Profile
    {
        public MHOModelMappingProfiles()
        {
            //CreateMap<ItemComplet, Item>()
            //    .ForMember(dest => dest.Id, opt => opt.MapFrom(src => src.IdItem))
            //    .ForMember(dest => dest.Img, opt => opt.MapFrom(src => src.ItemImg))
            //    .ForMember(dest => dest.Actions, opt => opt.Ignore())
            //    .ForMember(dest => dest.Properties, opt => opt.Ignore())
            //    .ForMember(dest => dest.BankCount, opt => opt.Ignore())
            //    .ForMember(dest => dest.Category, opt => opt.MapFrom(src => new Category() { IdCategory = src.IdCategory, Name = src.CatName, Ordering = src.CatOrdering, Label = new Dictionary<string, string>() { { "fr", src.CatLabelFr }, { "en", src.CatLabelEn }, { "es", src.CatLabelEs }, { "de", src.CatLabelDe } } }))
            //    .ForMember(dest => dest.Description, opt => opt.MapFrom(src => new Dictionary<string, string>() { { "fr", src.ItemDescriptionFr }, { "en", src.ItemDescriptionEn }, { "es", src.ItemDescriptionEs }, { "de", src.ItemDescriptionDe } }))
            //    .ForMember(dest => dest.Label, opt => opt.MapFrom(src => new Dictionary<string, string>() { { "fr", src.ItemLabelFr }, { "en", src.ItemLabelEn }, { "es", src.ItemLabelEs }, { "de", src.ItemLabelDe } }))
            //    .ForMember(dest => dest.WishListCount, opt => opt.Ignore())
            //    .ForMember(dest => dest.Recipes, opt => opt.Ignore())
            //    .ForMember(dest => dest.Deco, opt => opt.MapFrom(src => src.ItemDeco))
            //    .ForMember(dest => dest.Guard, opt => opt.MapFrom(src => src.ItemGuard))
            //    .ForMember(dest => dest.IsHeaver, opt => opt.MapFrom(src => src.ItemIsHeaver))
            //    .ForMember(dest => dest.Uid, opt => opt.MapFrom(src => src.ItemUid))
            //    .ForMember(dest => dest.DropRatePraf, opt => opt.MapFrom(src => src.DropRatePraf))
            //    .ForMember(dest => dest.DropRateNotPraf, opt => opt.MapFrom(src => src.DropRateNotPraf));

            //CreateMap<TownCitizenBagItemComplet, Item>()
            //    .ForMember(dest => dest.Id, opt => opt.MapFrom(src => src.IdItem))
            //    .ForMember(dest => dest.Img, opt => opt.MapFrom(src => src.ItemImg))
            //    .ForMember(dest => dest.Actions, opt => opt.Ignore())
            //    .ForMember(dest => dest.Properties, opt => opt.Ignore())
            //    .ForMember(dest => dest.BankCount, opt => opt.Ignore())
            //    .ForMember(dest => dest.Category, opt => opt.MapFrom(src => new Category() { IdCategory = src.IdCategory, Name = src.CatName, Ordering = src.CatOrdering, Label = new Dictionary<string, string>() { { "fr", src.CatLabelFr }, { "en", src.CatLabelEn }, { "es", src.CatLabelEs }, { "de", src.CatLabelDe } } }))
            //    .ForMember(dest => dest.Description, opt => opt.MapFrom(src => new Dictionary<string, string>() { { "fr", src.ItemDescriptionFr }, { "en", src.ItemDescriptionEn }, { "es", src.ItemDescriptionEs }, { "de", src.ItemDescriptionDe } }))
            //    .ForMember(dest => dest.Label, opt => opt.MapFrom(src => new Dictionary<string, string>() { { "fr", src.ItemLabelFr }, { "en", src.ItemLabelEn }, { "es", src.ItemLabelEs }, { "de", src.ItemLabelDe } }))
            //    .ForMember(dest => dest.WishListCount, opt => opt.Ignore())
            //    .ForMember(dest => dest.Recipes, opt => opt.Ignore())
            //    .ForMember(dest => dest.Deco, opt => opt.MapFrom(src => src.ItemDeco))
            //    .ForMember(dest => dest.Guard, opt => opt.MapFrom(src => src.ItemGuard))
            //    .ForMember(dest => dest.IsHeaver, opt => opt.MapFrom(src => src.ItemIsHeaver))
            //    .ForMember(dest => dest.Uid, opt => opt.MapFrom(src => src.ItemUid))
            //    .ForMember(dest => dest.DropRatePraf, opt => opt.MapFrom(src => src.DropRatePraf))
            //    .ForMember(dest => dest.DropRateNotPraf, opt => opt.MapFrom(src => src.DropRateNotPraf));

            //CreateMap<TownCitizenBagItemCompletModel, BagItemDto>()
            //   .ForMember(dest => dest.Item, opt => opt.MapFrom(src => src))
            //   .ForMember(dest => dest.IsBroken, opt => opt.MapFrom(src => src.IsBroken))
            //   .ForMember(dest => dest.Count, opt => opt.MapFrom(src => src.ItemCount));

            // Ruins
            CreateMap<MyHordesOptimizerRuinDto, Ruin>()
                .ForMember(dest => dest.IdRuin, opt => opt.MapFrom(src => src.Id))
                .ForMember(dest => dest.LabelFr, opt => opt.MapFrom(src => src.Label["fr"]))
                .ForMember(dest => dest.LabelEn, opt => opt.MapFrom(src => src.Label["en"]))
                .ForMember(dest => dest.LabelEs, opt => opt.MapFrom(src => src.Label["es"]))
                .ForMember(dest => dest.LabelDe, opt => opt.MapFrom(src => src.Label["de"]))
                .ForMember(dest => dest.DescriptionFr, opt => opt.MapFrom(src => src.Description["fr"]))
                .ForMember(dest => dest.DescriptionEn, opt => opt.MapFrom(src => src.Description["en"]))
                .ForMember(dest => dest.DescriptionEs, opt => opt.MapFrom(src => src.Description["es"]))
                .ForMember(dest => dest.DescriptionDe, opt => opt.MapFrom(src => src.Description["de"]))
                .ForMember(dest => dest.Img, opt => opt.MapFrom(src => src.Img))
                .ForMember(dest => dest.Camping, opt => opt.MapFrom(src => src.Camping))
                .ForMember(dest => dest.MaxDist, opt => opt.MapFrom(src => src.MaxDist))
                .ForMember(dest => dest.MinDist, opt => opt.MapFrom(src => src.MinDist))
                .ForMember(dest => dest.Explorable, opt => opt.MapFrom(src => src.Explorable));

            CreateMap<RuinComplete, MyHordesOptimizerRuinDto>()
                .ForMember(dest => dest.Chance, opt => opt.MapFrom(src => src.RuinChance))
                .ForMember(dest => dest.Camping, opt => opt.MapFrom(src => src.RuinCamping))
                .ForMember(dest => dest.Description, opt => opt.MapFrom(src => new Dictionary<string, string>() { { "fr", src.RuinDescriptionFr }, { "en", src.RuinDescriptionEn }, { "es", src.RuinDescriptionEs }, { "de", src.RuinDescriptionDe } }))
                .ForMember(dest => dest.Label, opt => opt.MapFrom(src => new Dictionary<string, string>() { { "fr", src.RuinLabelFr }, { "en", src.RuinLabelEn }, { "es", src.RuinLabelEs }, { "de", src.RuinLabelDe } }))
                .ForMember(dest => dest.MaxDist, opt => opt.MapFrom(src => src.RuinMaxDist))
                .ForMember(dest => dest.MinDist, opt => opt.MapFrom(src => src.RuinMinDist))
                .ForMember(dest => dest.Id, opt => opt.MapFrom(src => src.IdRuin))
                .ForMember(dest => dest.Explorable, opt => opt.MapFrom(src => src.RuinExplorable))
                .ForMember(dest => dest.Img, opt => opt.MapFrom(src => src.RuinImg))
                .ForMember(dest => dest.Capacity, opt => opt.MapFrom(src => src.RuinCapacity))
                .ForMember(dest => dest.Drops, opt => opt.Ignore());

            //Recipes
            CreateMap<RecipeComplet, ItemRecipeDto>()
                .ForMember(dest => dest.Name, opt => opt.MapFrom(src => src.RecipeName))
                .ForMember(dest => dest.Type, opt => opt.MapFrom(src => src.Type))
                .ForMember(dest => dest.Actions, opt => opt.MapFrom(src => new Dictionary<string, string>() { { "fr", src.ActionFr }, { "en", src.ActionEn }, { "es", src.ActionEs }, { "de", src.ActionDe } }))
                .ForMember(dest => dest.Components, opt => opt.Ignore())
                .ForMember(dest => dest.Result, opt => opt.Ignore());

            //Town
            CreateMap<TownDto, Town>()
                .ForMember(dest => dest.IdTown, opt => opt.MapFrom(src => src.Id))
                .ForMember(dest => dest.WishlistDateUpdate, opt => opt.Ignore())
                .ForMember(dest => dest.IdUserWishListUpdater, opt => opt.Ignore());

            //User
            CreateMap<CitizenDto, User>()
                .ForMember(dest => dest.IdUser, opt => opt.MapFrom(src => src.Id))
                .ForMember(dest => dest.Name, opt => opt.MapFrom(src => src.Name))
                .ForMember(dest => dest.UserKey, opt => opt.Ignore());

            CreateMap<CadaverDto, User>()
               .ForMember(dest => dest.IdUser, opt => opt.MapFrom(src => src.Id))
               .ForMember(dest => dest.Name, opt => opt.MapFrom(src => src.Name))
               .ForMember(dest => dest.UserKey, opt => opt.Ignore());

            //TownCitizen
            CreateMap<CitizenDto, TownCitizen>()
                .ForMember(dest => dest.IdTown, opt => opt.Ignore())
                .ForMember(dest => dest.IdLastUpdateInfo, opt => opt.Ignore())
                .ForMember(dest => dest.IdUser, opt => opt.MapFrom(src => src.Id))
                .ForMember(dest => dest.HomeMessage, opt => opt.MapFrom(src => src.HomeMessage))
                .ForMember(dest => dest.PositionY, opt => opt.MapFrom(src => src.Y))
                .ForMember(dest => dest.PositionX, opt => opt.MapFrom(src => src.X))
                .ForMember(dest => dest.JobUid, opt => opt.MapFrom(src => src.JobUid))
                .ForMember(dest => dest.JobName, opt => opt.MapFrom(src => src.JobName))
                .ForMember(dest => dest.IsGhost, opt => opt.MapFrom(src => src.IsGhost))
                .ForMember(dest => dest.Dead, opt => opt.MapFrom(src => src.Dead))
                .ForMember(dest => dest.IdBag, opt => opt.Ignore());

            //CreateMap<TownCitizenBagItemCompletModel, CitizenDto>()
            //    .ForMember(dest => dest.Name, opt => opt.MapFrom(src => src.CitizenName))
            //    .ForMember(dest => dest.NombreJourHero, opt => opt.Ignore())
            //    .ForMember(dest => dest.Avatar, opt => opt.MapFrom(src => src.Avatar))
            //    .ForMember(dest => dest.HomeMessage, opt => opt.MapFrom(src => src.CitizenHomeMessage))
            //    .ForMember(dest => dest.Id, opt => opt.MapFrom(src => src.CitizenId))
            //    .ForMember(dest => dest.IsGhost, opt => opt.MapFrom(src => src.CitizenIsGhost))
            //    .ForMember(dest => dest.Dead, opt => opt.MapFrom(src => src.CitizenIsDead))
            //    .ForMember(dest => dest.JobName, opt => opt.MapFrom(src => src.CitizenJobName))
            //    .ForMember(dest => dest.JobUid, opt => opt.MapFrom(src => src.CitizenJobUID))
            //    .ForMember(dest => dest.X, opt => opt.MapFrom(src => src.CitizenPositionX))
            //    .ForMember(dest => dest.Y, opt => opt.MapFrom(src => src.CitizenPositionY))
            //    .ForMember(dest => dest.Home, opt => opt.MapFrom(src => src))
            //    .ForMember(dest => dest.ActionsHeroic, opt => opt.MapFrom(src => src))
            //    .ForMember(dest => dest.Cadaver, opt => opt.Ignore())
            //    .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src))
            //    .ForMember(dest => dest.Bag, opt => opt.Ignore());

            ////LastUpdate
            //CreateMap<LastUpdateInfoDto, LastUpdateInfo>()
            //    .ForMember(dest => dest.IdUser, opt => opt.MapFrom(src => src.UserId))
            //    .ForMember(dest => dest.DateUpdate, opt => opt.MapFrom(src => src.UpdateTime))
            //    .ForMember(dest => dest.IdLastUpdateInfo, opt => opt.Ignore())

            //CreateMap<TownCitizenBagItemCompletModel, LastUpdateInfo>()
            //   .ForMember(dest => dest.UserId, opt => opt.MapFrom(src => src.LastUpdateInfoUserId))
            //   .ForMember(dest => dest.UpdateTime, opt => opt.MapFrom(src => src.LastUpdateDateUpdate))
            //   .ForMember(dest => dest.UserName, opt => opt.MapFrom(src => src.LastUpdateInfoUserName));

            //TownCadaver
            CreateMap<CadaverDto, TownCadaver>()
                .ForMember(dest => dest.IdCadaver, opt => opt.Ignore())
                .ForMember(dest => dest.IdCitizen, opt => opt.MapFrom(src => src.Id))
                .ForMember(dest => dest.CadaverName, opt => opt.MapFrom(src => src.Name))
                .ForMember(dest => dest.Avatar, opt => opt.MapFrom(src => src.Avatar))
                .ForMember(dest => dest.CauseOfDeath, opt => opt.Ignore())
                .ForMember(dest => dest.DeathMessage, opt => opt.MapFrom(src => src.Msg))
                .ForMember(dest => dest.TownMessage, opt => opt.MapFrom(src => src.TownMsg))
                .ForMember(dest => dest.SurvivalDay, opt => opt.MapFrom(src => src.Survival))
                .ForMember(dest => dest.Score, opt => opt.MapFrom(src => src.Score))
                .ForMember(dest => dest.IdLastUpdateInfo, opt => opt.Ignore())
                .ForMember(dest => dest.CleanUp, opt => opt.Ignore());

            // CauseOfDeath
            CreateMap<CauseOfDeathDto, CauseOfDeath>()
                .ForMember(dest => dest.Ref, opt => opt.MapFrom(src => src.Ref))
                .ForMember(dest => dest.Dtype, opt => opt.MapFrom(src => src.Dtype))
                .ForMember(dest => dest.Icon, opt => opt.MapFrom(src => src.Icon))
                .ForMember(dest => dest.DescriptionDe, opt => opt.MapFrom(src => src.Description.GetValueOrDefault("de")))
                .ForMember(dest => dest.DescriptionFr, opt => opt.MapFrom(src => src.Description.GetValueOrDefault("fr")))
                .ForMember(dest => dest.DescriptionEs, opt => opt.MapFrom(src => src.Description.GetValueOrDefault("es")))
                .ForMember(dest => dest.DescriptionEn, opt => opt.MapFrom(src => src.Description.GetValueOrDefault("en")))
                .ForMember(dest => dest.LabelDe, opt => opt.MapFrom(src => src.Label.GetValueOrDefault("de")))
                .ForMember(dest => dest.LabelFr, opt => opt.MapFrom(src => src.Label.GetValueOrDefault("fr")))
                .ForMember(dest => dest.LabelEs, opt => opt.MapFrom(src => src.Label.GetValueOrDefault("es")))
                .ForMember(dest => dest.LabelEn, opt => opt.MapFrom(src => src.Label.GetValueOrDefault("en")));

            //// CleanUpType
            //CreateMap<CleanUpTypeDto, CleanUpType>()
            //    .ForMember(dest => dest.IdType, opt => opt.MapFrom(src => src.Id))
            //    .ForMember(dest => dest.TypeName, opt => opt.MapFrom(src => src.Name))
            //    .ForMember(dest => dest.MyHordesApiName, opt => opt.MapFrom(src => src.MyHordesApiName));

            //// CleanUp
            //CreateMap<CleanUpDto, CleanUp>()
            //    .ForMember(dest => dest.IdCleanUp, opt => opt.MapFrom(src => src.IdCleanUp))
            //    .ForMember(dest => dest.IdCleanUpType, opt => opt.MapFrom(src => src.Type.Id))
            //    .ForMember(dest => dest.IdUserCleanUp, opt => opt.MapFrom(src => src.CitizenCleanUp.Id));

            //CreateMap<IGrouping<BankItemCompletKeyModel, BankItemCompletModel>, StackableItemDto>()
            //    .ForMember(dest => dest.Count, opt => opt.MapFrom(src => src.First().BankCount))
            //    .ForMember(dest => dest.IsBroken, opt => opt.MapFrom(src => src.First().BankIsBroken))
            //    .ForMember(dest => dest.Item, opt => opt.MapFrom(src => new Item() { Id = src.Key.ItemId }));

            //CreateMap<BankItemCompletModel, Item>()
            //    .ForMember(dest => dest.Img, opt => opt.MapFrom(src => src.ItemImg))
            //    .ForMember(dest => dest.Actions, opt => opt.MapFrom(src => src.ActionName))
            //    .ForMember(dest => dest.Deco, opt => opt.MapFrom(src => src.ItemDeco))
            //    .ForMember(dest => dest.Description, opt => opt.MapFrom(src => new Dictionary<string, string>() { { "fr", src.ItemDescriptionFr }, { "en", src.ItemDescriptionEn }, { "es", src.ItemDescriptionEs }, { "de", src.ItemDescriptionDe } }))
            //    .ForMember(dest => dest.IsHeaver, opt => opt.MapFrom(src => src.ItemIsHeaver))
            //    .ForMember(dest => dest.Properties, opt => opt.Ignore())
            //    .ForMember(dest => dest.Actions, opt => opt.Ignore())
            //    .ForMember(dest => dest.Guard, opt => opt.MapFrom(src => src.ItemGuard))
            //    .ForMember(dest => dest.BankCount, opt => opt.MapFrom(src => src.BankCount))
            //    .ForMember(dest => dest.Label, opt => opt.MapFrom(src => new Dictionary<string, string>() { { "fr", src.ItemLabelFr }, { "en", src.ItemLabelEn }, { "es", src.ItemLabelEs }, { "de", src.ItemLabelDe } }))
            //    .ForMember(dest => dest.Recipes, opt => opt.Ignore())
            //    .ForMember(dest => dest.Category, opt => opt.MapFrom(src => new Category() { IdCategory = src.CategoryId, Name = src.CategoryName, Ordering = src.CategoryOrdering, Label = new Dictionary<string, string>() { { "fr", src.CategoryLabelFr }, { "en", src.CategoryLabelEn }, { "es", src.CategoryLabelEs }, { "de", src.CategoryLabelDe } } }))
            //    .ForMember(dest => dest.Id, opt => opt.MapFrom(src => src.ItemId))
            //    .ForMember(dest => dest.Uid, opt => opt.MapFrom(src => src.ItemUid))
            //    .ForMember(dest => dest.WishListCount, opt => opt.Ignore())
            //    .ForMember(dest => dest.Img, opt => opt.MapFrom(src => src.ItemImg));

            //CreateMap<BankItemCompletModel, LastUpdateInfo>()
            //     .ForMember(dest => dest.UserId, opt => opt.MapFrom(src => src.LastUpdateInfoUserId))
            //     .ForMember(dest => dest.UpdateTime, opt => opt.MapFrom(src => src.LastUpdateDateUpdate))
            //     .ForMember(dest => dest.UserName, opt => opt.MapFrom(src => src.LastUpdateInfoUserName));
     

            //CreateMap<TownWishlistItemCompletModel, Item>()
            //    .ForMember(dest => dest.Img, opt => opt.MapFrom(src => src.ItemImg))
            //    .ForMember(dest => dest.Actions, opt => opt.MapFrom(src => src.ActionName))
            //    .ForMember(dest => dest.Deco, opt => opt.MapFrom(src => src.ItemDeco))
            //    .ForMember(dest => dest.Description, opt => opt.MapFrom(src => new Dictionary<string, string>() { { "fr", src.ItemDescriptionFr }, { "en", src.ItemDescriptionEn }, { "es", src.ItemDescriptionEs }, { "de", src.ItemDescriptionDe } }))
            //    .ForMember(dest => dest.IsHeaver, opt => opt.MapFrom(src => src.ItemIsHeaver))
            //    .ForMember(dest => dest.Properties, opt => opt.Ignore())
            //    .ForMember(dest => dest.Actions, opt => opt.Ignore())
            //    .ForMember(dest => dest.Guard, opt => opt.MapFrom(src => src.ItemGuard))
            //    .ForMember(dest => dest.BankCount, opt => opt.Ignore())
            //    .ForMember(dest => dest.Label, opt => opt.MapFrom(src => new Dictionary<string, string>() { { "fr", src.ItemLabelFr }, { "en", src.ItemLabelEn }, { "es", src.ItemLabelEs }, { "de", src.ItemLabelDe } }))
            //    .ForMember(dest => dest.Recipes, opt => opt.Ignore())
            //    .ForMember(dest => dest.Category, opt => opt.MapFrom(src => new Category() { IdCategory = src.CategoryId, Name = src.CategoryName, Ordering = src.CategoryOrdering, Label = new Dictionary<string, string>() { { "fr", src.CategoryLabelFr }, { "en", src.CategoryLabelEn }, { "es", src.CategoryLabelEs }, { "de", src.CategoryLabelDe } } }))
            //    .ForMember(dest => dest.Id, opt => opt.MapFrom(src => src.ItemId))
            //    .ForMember(dest => dest.Uid, opt => opt.MapFrom(src => src.ItemUid))
            //    .ForMember(dest => dest.WishListCount, opt => opt.MapFrom(src => src.WishlistCount))
            //    .ForMember(dest => dest.Img, opt => opt.MapFrom(src => src.ItemImg));

            //CreateMap<TownWishlistItemCompletModel, LastUpdateInfo>()
            //     .ForMember(dest => dest.UserId, opt => opt.MapFrom(src => src.LastUpdateInfoUserId))
            //     .ForMember(dest => dest.UpdateTime, opt => opt.MapFrom(src => src.LastUpdateDateUpdate))
            //     .ForMember(dest => dest.UserName, opt => opt.MapFrom(src => src.LastUpdateInfoUserName));

            //CreateMap<IGrouping<int, WishlistCategorieCompletModel>, WishlistCategorieDto>()
            //     .ForMember(dest => dest.IdCategory, opt => opt.MapFrom(src => src.First().IdCategory))
            //     .ForMember(dest => dest.IdUserAuthor, opt => opt.MapFrom(src => src.First().IdUserAuthor))
            //     .ForMember(dest => dest.Name, opt => opt.MapFrom(src => src.First().Name))
            //     .ForMember(dest => dest.Labels, opt => opt.MapFrom(src => new Dictionary<string, string>() { { "fr", src.First().LabelFr }, { "en", src.First().LabelEn }, { "es", src.First().LabelEs }, { "de", src.First().LabelDe } }))
            //     .ForMember(dest => dest.Items, opt => opt.MapFrom(src => src.ToList().Select(x => x.IdItem).ToList()));

            CreateMap<DefaultWishlistItem, TownWishListItem>()
              .ForMember(dest => dest.IdTown, opt => opt.Ignore())
              .ForMember(dest => dest.IdItem, opt => opt.MapFrom(src => src.IdItem))
              .ForMember(dest => dest.Depot, opt => opt.MapFrom(src => src.Depot))
              .ForMember(dest => dest.ShouldSignal, opt => opt.MapFrom(src => src.ShouldSignal))
              .ForMember(dest => dest.Priority, opt => opt.MapFrom(src => src.Priority))
              .ForMember(dest => dest.ZoneXpa, opt => opt.MapFrom(src => src.ZoneXpa))
              .ForMember(dest => dest.Count, opt => opt.MapFrom(src => src.Count));

            CreateMap<IGrouping<int, DefaultWishlistItem>, WishlistTemplateDto>()
               .ForMember(dest => dest.IdTemplate, opt => opt.MapFrom(src => src.First().IdDefaultWishlist))
               .ForMember(dest => dest.IdUserAuthor, opt => opt.MapFrom(src => src.First().IdUserAuthor))
               .ForMember(dest => dest.Name, opt => opt.MapFrom(src => src.First().Name))
               .ForMember(dest => dest.Labels, opt => opt.MapFrom(src => new Dictionary<string, string>() { { "fr", src.First().LabelFr }, { "en", src.First().LabelEn }, { "es", src.First().LabelEs }, { "de", src.First().LabelDe } }))
               .ForMember(dest => dest.Items, opt => opt.MapFrom(src => src.ToList()));

            CreateMap<DefaultWishlistItem, WishListItemDto>()
                .ForMember(dest => dest.Item, opt => opt.MapFrom(src => new Item() { IdItem = src.IdItem }))
                .ForMember(dest => dest.Count, opt => opt.MapFrom(src => src.Count))
                .ForMember(dest => dest.Depot, opt => opt.MapFrom(src => src.Depot))
                .ForMember(dest => dest.ShouldSignal, opt => opt.MapFrom(src => src.ShouldSignal))
                .ForMember(dest => dest.Priority, opt => opt.MapFrom(src => src.Priority))
                .ForMember(dest => dest.BankCount, opt => opt.Ignore())
                .ForMember(dest => dest.IsWorkshop, opt => opt.Ignore())
                .ForMember(dest => dest.BagCount, opt => opt.Ignore())
                .ForMember(dest => dest.ZoneXPa, opt => opt.MapFrom(src => src.Count));

            CreateMap<HomeUpgradeDetailsDto, TownCitizen>()
                .ForMember(dest => dest.Apagcharges, opt => opt.Ignore())
                .ForMember(dest => dest.ChestLevel, opt => opt.MapFrom(src => src.Chest))
                .ForMember(dest => dest.HasAlarm, opt => opt.MapFrom(src => src.Alarm))
                .ForMember(dest => dest.HasCheatDeath, opt => opt.Ignore())
                .ForMember(dest => dest.HasCurtain, opt => opt.MapFrom(src => src.Curtain))
                .ForMember(dest => dest.HasHeroicReturn, opt => opt.Ignore())
                .ForMember(dest => dest.HasLock, opt => opt.MapFrom(src => src.Lock))
                .ForMember(dest => dest.HasLuckyFind, opt => opt.Ignore())
                .ForMember(dest => dest.HasRescue, opt => opt.Ignore())
                .ForMember(dest => dest.HasSecondWind, opt => opt.Ignore())
                .ForMember(dest => dest.HasUppercut, opt => opt.Ignore())
                .ForMember(dest => dest.RenfortLevel, opt => opt.MapFrom(src => src.Defense))
                .ForMember(dest => dest.HasFence, opt => opt.MapFrom(src => src.Fence))
                .ForMember(dest => dest.HouseLevel, opt => opt.MapFrom(src => src.House))
                .ForMember(dest => dest.IdTown, opt => opt.Ignore())
                .ForMember(dest => dest.IdUser, opt => opt.Ignore())
                .ForMember(dest => dest.IsAddict, opt => opt.Ignore())
                .ForMember(dest => dest.IsArmWounded, opt => opt.Ignore())
                .ForMember(dest => dest.IsCamper, opt => opt.Ignore())
                .ForMember(dest => dest.IsCheatingDeathActive, opt => opt.Ignore())
                .ForMember(dest => dest.IsCleanBody, opt => opt.Ignore())
                .ForMember(dest => dest.IsConvalescent, opt => opt.Ignore())
                .ForMember(dest => dest.IsDesy, opt => opt.Ignore())
                .ForMember(dest => dest.IsDrugged, opt => opt.Ignore())
                .ForMember(dest => dest.IsDrunk, opt => opt.Ignore())
                .ForMember(dest => dest.IsEyeWounded, opt => opt.Ignore())
                .ForMember(dest => dest.IsFootWounded, opt => opt.Ignore())
                .ForMember(dest => dest.IsGhoul, opt => opt.Ignore())
                .ForMember(dest => dest.IsHandWounded, opt => opt.Ignore())
                .ForMember(dest => dest.IsHungOver, opt => opt.Ignore())
                .ForMember(dest => dest.IsHeadWounded, opt => opt.Ignore())
                .ForMember(dest => dest.IsImmune, opt => opt.Ignore())
                .ForMember(dest => dest.IsInfected, opt => opt.Ignore())
                .ForMember(dest => dest.IsLegWounded, opt => opt.Ignore())
                .ForMember(dest => dest.IsQuenched, opt => opt.Ignore())
                .ForMember(dest => dest.IsSated, opt => opt.Ignore())
                .ForMember(dest => dest.IsTerrorised, opt => opt.Ignore())
                .ForMember(dest => dest.IsThirsty, opt => opt.Ignore())
                .ForMember(dest => dest.IsTired, opt => opt.Ignore())
                .ForMember(dest => dest.KitchenLevel, opt => opt.MapFrom(src => src.Kitchen))
                .ForMember(dest => dest.LaboLevel, opt => opt.MapFrom(src => src.Lab))
                .ForMember(dest => dest.RestLevel, opt => opt.MapFrom(src => src.Rest));

            CreateMap<CitizenActionsHeroicValue, TownCitizen>()
                .ForMember(dest => dest.Apagcharges, opt => opt.MapFrom(src => src.ApagCharges))
                .ForMember(dest => dest.HasCheatDeath, opt => opt.MapFrom(src => src.HasCheatDeath))
                .ForMember(dest => dest.HasHeroicReturn, opt => opt.MapFrom(src => src.HasHeroicReturn))
                .ForMember(dest => dest.HasLuckyFind, opt => opt.MapFrom(src => src.HasLuckyFind))
                .ForMember(dest => dest.HasRescue, opt => opt.MapFrom(src => src.HasRescue))
                .ForMember(dest => dest.HasSecondWind, opt => opt.MapFrom(src => src.HasSecondWind))
                .ForMember(dest => dest.HasUppercut, opt => opt.MapFrom(src => src.HasUppercut))
                .ForMember(dest => dest.HasBreakThrough, opt => opt.MapFrom(src => src.HasBreakThrough))
                .ForMember(dest => dest.HasBrotherInArms, opt => opt.MapFrom(src => src.HasBrotherInArms))
                .ForMember(dest => dest.ChestLevel, opt => opt.Ignore())
                .ForMember(dest => dest.HasAlarm, opt => opt.Ignore())
                .ForMember(dest => dest.HasCurtain, opt => opt.Ignore())
                .ForMember(dest => dest.HasLock, opt => opt.Ignore())
                .ForMember(dest => dest.RenfortLevel, opt => opt.Ignore())
                .ForMember(dest => dest.HasFence, opt => opt.Ignore())
                .ForMember(dest => dest.HouseLevel, opt => opt.Ignore())
                .ForMember(dest => dest.IdTown, opt => opt.Ignore())
                .ForMember(dest => dest.IdUser, opt => opt.Ignore())
                .ForMember(dest => dest.IsAddict, opt => opt.Ignore())
                .ForMember(dest => dest.IsArmWounded, opt => opt.Ignore())
                .ForMember(dest => dest.IsCamper, opt => opt.Ignore())
                .ForMember(dest => dest.IsCheatingDeathActive, opt => opt.Ignore())
                .ForMember(dest => dest.IsCleanBody, opt => opt.Ignore())
                .ForMember(dest => dest.IsConvalescent, opt => opt.Ignore())
                .ForMember(dest => dest.IsDesy, opt => opt.Ignore())
                .ForMember(dest => dest.IsDrugged, opt => opt.Ignore())
                .ForMember(dest => dest.IsDrunk, opt => opt.Ignore())
                .ForMember(dest => dest.IsEyeWounded, opt => opt.Ignore())
                .ForMember(dest => dest.IsFootWounded, opt => opt.Ignore())
                .ForMember(dest => dest.IsGhoul, opt => opt.Ignore())
                .ForMember(dest => dest.IsHandWounded, opt => opt.Ignore())
                .ForMember(dest => dest.IsHungOver, opt => opt.Ignore())
                .ForMember(dest => dest.IsHeadWounded, opt => opt.Ignore())
                .ForMember(dest => dest.IsImmune, opt => opt.Ignore())
                .ForMember(dest => dest.IsInfected, opt => opt.Ignore())
                .ForMember(dest => dest.IsLegWounded, opt => opt.Ignore())
                .ForMember(dest => dest.IsQuenched, opt => opt.Ignore())
                .ForMember(dest => dest.IsSated, opt => opt.Ignore())
                .ForMember(dest => dest.IsTerrorised, opt => opt.Ignore())
                .ForMember(dest => dest.IsThirsty, opt => opt.Ignore())
                .ForMember(dest => dest.IsTired, opt => opt.Ignore())
                .ForMember(dest => dest.KitchenLevel, opt => opt.Ignore())
                .ForMember(dest => dest.LaboLevel, opt => opt.Ignore())
                .ForMember(dest => dest.RestLevel, opt => opt.Ignore());

            CreateMap<CitizenHomeValueDto, TownCitizen>()
                .ForMember(dest => dest.Apagcharges, opt => opt.Ignore())
                .ForMember(dest => dest.HasCheatDeath, opt => opt.Ignore())
                .ForMember(dest => dest.HasHeroicReturn, opt => opt.Ignore())
                .ForMember(dest => dest.HasLuckyFind, opt => opt.Ignore())
                .ForMember(dest => dest.HasRescue, opt => opt.Ignore())
                .ForMember(dest => dest.HasSecondWind, opt => opt.Ignore())
                .ForMember(dest => dest.HasUppercut, opt => opt.Ignore())
                .ForMember(dest => dest.ChestLevel, opt => opt.MapFrom(src => src.ChestLevel))
                .ForMember(dest => dest.HasAlarm, opt => opt.MapFrom(src => src.HasAlarm))
                .ForMember(dest => dest.HasCurtain, opt => opt.MapFrom(src => src.HasCurtain))
                .ForMember(dest => dest.HasLock, opt => opt.MapFrom(src => src.HasLock))
                .ForMember(dest => dest.RenfortLevel, opt => opt.MapFrom(src => src.RenfortLevel))
                .ForMember(dest => dest.HasFence, opt => opt.MapFrom(src => src.HasFence))
                .ForMember(dest => dest.HouseLevel, opt => opt.MapFrom(src => src.HouseLevel))
                .ForMember(dest => dest.KitchenLevel, opt => opt.MapFrom(src => src.KitchenLevel))
                .ForMember(dest => dest.LaboLevel, opt => opt.MapFrom(src => src.LaboLevel))
                .ForMember(dest => dest.RestLevel, opt => opt.MapFrom(src => src.RestLevel))
                .ForMember(dest => dest.IdTown, opt => opt.Ignore())
                .ForMember(dest => dest.IdUser, opt => opt.Ignore())
                .ForMember(dest => dest.IsAddict, opt => opt.Ignore())
                .ForMember(dest => dest.IsArmWounded, opt => opt.Ignore())
                .ForMember(dest => dest.IsCamper, opt => opt.Ignore())
                .ForMember(dest => dest.IsCheatingDeathActive, opt => opt.Ignore())
                .ForMember(dest => dest.IsCleanBody, opt => opt.Ignore())
                .ForMember(dest => dest.IsConvalescent, opt => opt.Ignore())
                .ForMember(dest => dest.IsDesy, opt => opt.Ignore())
                .ForMember(dest => dest.IsDrugged, opt => opt.Ignore())
                .ForMember(dest => dest.IsDrunk, opt => opt.Ignore())
                .ForMember(dest => dest.IsEyeWounded, opt => opt.Ignore())
                .ForMember(dest => dest.IsFootWounded, opt => opt.Ignore())
                .ForMember(dest => dest.IsGhoul, opt => opt.Ignore())
                .ForMember(dest => dest.IsHandWounded, opt => opt.Ignore())
                .ForMember(dest => dest.IsHungOver, opt => opt.Ignore())
                .ForMember(dest => dest.IsHeadWounded, opt => opt.Ignore())
                .ForMember(dest => dest.IsImmune, opt => opt.Ignore())
                .ForMember(dest => dest.IsInfected, opt => opt.Ignore())
                .ForMember(dest => dest.IsLegWounded, opt => opt.Ignore())
                .ForMember(dest => dest.IsQuenched, opt => opt.Ignore())
                .ForMember(dest => dest.IsSated, opt => opt.Ignore())
                .ForMember(dest => dest.IsTerrorised, opt => opt.Ignore())
                .ForMember(dest => dest.IsThirsty, opt => opt.Ignore())
                .ForMember(dest => dest.IsTired, opt => opt.Ignore());


            //CreateMap<TownCitizenBagItemCompletModel, CitizenHomeDto>()
            //    .ForMember(dest => dest.Content, opt => opt.MapFrom(src => src))
            //    .ForMember(dest => dest.LastUpdateInfo, opt => { opt.MapFrom(src => new LastUpdateInfo() { UpdateTime = src.HomeLastUpdateDateUpdate.Value, UserName = src.HomeLastUpdateInfoUserName }); opt.PreCondition(src => src.HomeLastUpdateDateUpdate.HasValue); });
            //CreateMap<TownCitizenBagItemCompletModel, CitizenStatusDto>()
            //    .ForMember(dest => dest.Content, opt => opt.MapFrom(src => src))
            //    .ForMember(dest => dest.LastUpdateInfo, opt => { opt.MapFrom(src => new LastUpdateInfo() { UpdateTime = src.StatusLastUpdateDateUpdate.Value, UserName = src.StatusLastUpdateInfoUserName }); opt.PreCondition(src => src.StatusLastUpdateDateUpdate.HasValue); })
            //    .ForMember(dest => dest.Icons, opt => opt.MapFrom(src => GetStatusIcons(src)))
            //    .ForMember(dest => dest.GhoulStatusLastUpdateInfo, opt => { opt.MapFrom(src => new LastUpdateInfo() { UpdateTime = src.GhoulStatusLastUpdateDateUpdate.Value, UserName = src.GhoulStatusLastUpdateInfoUserName }); opt.PreCondition(src => src.GhoulStatusLastUpdateDateUpdate.HasValue); })
            //    .ForMember(dest => dest.IsGhoul, opt => opt.MapFrom(src => src.IsGhoul))
            //    .ForMember(dest => dest.GhoulVoracity, opt => opt.MapFrom(src => src.GhoulVoracity));

            //CreateMap<TownCitizenBagItemCompletModel, CitizenActionsHeroic>()
            //    .ForMember(dest => dest.Content, opt => opt.MapFrom(src => src))
            //    .ForMember(dest => dest.LastUpdateInfo, opt => { opt.MapFrom(src => new LastUpdateInfo() { UpdateTime = src.HeroicActionLastUpdateDateUpdate.Value, UserName = src.HeroicActionLastUpdateInfoUserName }); opt.PreCondition(src => src.HeroicActionLastUpdateDateUpdate.HasValue); });


            CreateMap<IEnumerable<MapCellComplet>, MyHordesOptimizerMapDto>()
                .ForMember(dest => dest.Day, opt => opt.MapFrom(src => src.First().Day))
                .ForMember(dest => dest.IsChaos, opt => opt.MapFrom(src => src.First().IsChaos))
                .ForMember(dest => dest.IsDevasted, opt => opt.MapFrom(src => src.First().IsDevasted))
                .ForMember(dest => dest.IsDoorOpen, opt => opt.MapFrom(src => src.First().IsDoorOpen))
                .ForMember(dest => dest.WaterWell, opt => opt.MapFrom(src => src.First().WaterWell))
                .ForMember(dest => dest.TownX, opt => opt.MapFrom(src => src.First().TownX))
                .ForMember(dest => dest.TownY, opt => opt.MapFrom(src => src.First().TownY))
                .ForMember(dest => dest.MapHeight, opt => opt.MapFrom(src => src.First().MapHeight))
                .ForMember(dest => dest.MapWidth, opt => opt.MapFrom(src => src.First().MapWidth))
                .ForMember(dest => dest.TownId, opt => opt.MapFrom(src => src.First().IdTown))
                .ForMember(dest => dest.Cells, opt => { opt.MapFrom(src => src); opt.PreCondition(src => src.First().IdCell != 0); });

            CreateMap<MapCellComplet, MyHordesOptimizerCellDto>()
                .ForMember(dest => dest.CellId, opt => opt.MapFrom(src => src.IdCell))
                .ForMember(dest => dest.ZoneRegen, opt => { opt.MapFrom(src => ((RegenDirectionEnum)src.ZoneRegen.Value).GetDescription()); opt.PreCondition(src => src.ZoneRegen.HasValue); })
                .ForMember(dest => dest.Note, opt => opt.MapFrom(src => src.Note))
                .ForMember(dest => dest.Items, opt => opt.Ignore())
                .ForMember(dest => dest.Citizens, opt => opt.Ignore())
                .ForMember(dest => dest.DisplayX, opt => opt.MapFrom(src => src.X - src.TownX))
                .ForMember(dest => dest.DisplayY, opt => opt.MapFrom(src => src.TownY - src.Y))
                .ForMember(dest => dest.LastUpdateInfo, opt => opt.MapFrom(src => new LastUpdateInfo() { DateUpdate = src.LastUpdateDateUpdate.Value, IdUserNavigation = new User() { Name = src.LastUpdateInfoUserName, IdUser = src.LastUpdateInfoUserId.Value } }));

           
            CreateMap<MapCellComplet, CellCitizenDto>()
               .ForMember(dest => dest.Id, opt => opt.MapFrom(src => src.CitizenId))
               .ForMember(dest => dest.Name, opt => opt.MapFrom(src => src.CitizenName));

            CreateMap<MapCellComplet, MapCell>();

            //CreateMap<TownCitizenBagItemCompletModel, CitizenHomeValueDto>();
            //CreateMap<TownCitizenBagItemCompletModel, CitizenStatusValueDto>();
            //CreateMap<TownCitizenBagItemCompletModel, CitizenActionsHeroicValue>();

          

           

            //CreateMap<MapCellDigCompletModel, MyHordesOptimizerMapDigDto>()
            //    .ForMember(dest => dest.LastUpdateInfo, opt => opt.MapFrom(src => new LastUpdateInfo() { UpdateTime = src.LastUpdateDateUpdate, UserName = src.LastUpdateInfoUserName, UserId = src.LastUpdateInfoUserId }));
            CreateMap<MyHordesOptimizerMapDigDto, MapCellDig>()
                .ForMember(dest => dest.IdLastUpdateInfo, opt => opt.Ignore())
                .ForMember(dest => dest.IdCell, opt => opt.MapFrom(src => src.CellId))
                .ForMember(dest => dest.IdUser, opt => opt.MapFrom(src => src.DiggerId));

           
        }

        //private DateTime? GetBagLastUpdateDateWithNullCheck(IEnumerable<TownCitizenBagItemCompletModel> src)
        //{
        //    var first = src.FirstOrDefault();
        //    if (first != null)
        //    {
        //        return first.BagLastUpdateDateUpdate;
        //    }
        //    else
        //    {
        //        return null;
        //    }
        //}
        //private string GetBagLastUpdateUserNameWithNullCheck(IEnumerable<TownCitizenBagItemCompletModel> src)
        //{
        //    var first = src.FirstOrDefault();
        //    if (first != null)
        //    {
        //        return first.BagLastUpdateUserName;
        //    }
        //    else
        //    {
        //        return null;
        //    }
        //}
        //private int? GetBagIdWithNullCheck(IEnumerable<TownCitizenBagItemCompletModel> src)
        //{
        //    var first = src.FirstOrDefault();
        //    if (first != null)
        //    {
        //        return first.BagId;
        //    }
        //    else
        //    {

        //        return null;
        //    }
        //}
    }
}
