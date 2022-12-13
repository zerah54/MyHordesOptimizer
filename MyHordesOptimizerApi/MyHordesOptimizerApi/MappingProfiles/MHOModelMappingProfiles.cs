using AutoMapper;
using MyHordesOptimizerApi.Dtos.MyHordes.Items;
using MyHordesOptimizerApi.Dtos.MyHordes.MyHordesOptimizer;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Citizens;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.Home;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.Status;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.WishList;
using MyHordesOptimizerApi.Extensions;
using MyHordesOptimizerApi.MappingProfiles.Converters;
using MyHordesOptimizerApi.Models;
using MyHordesOptimizerApi.Models.Citizen;
using MyHordesOptimizerApi.Models.Views.Items;
using MyHordesOptimizerApi.Models.Views.Items.Bank;
using MyHordesOptimizerApi.Models.Views.Items.Citizen;
using MyHordesOptimizerApi.Models.Views.Items.Wishlist;
using MyHordesOptimizerApi.Models.Views.Recipes;
using MyHordesOptimizerApi.Models.Views.Ruins;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;

namespace MyHordesOptimizerApi.MappingProfiles
{
    public class MHOModelMappingProfiles : Profile
    {
        public MHOModelMappingProfiles()
        {
            // Items
            CreateMap<KeyValuePair<string, MyHordesItem>, ItemModel>()
                .ForMember(dest => dest.Uid, opt => opt.MapFrom(src => src.Key))
                .ForMember(dest => dest.Img, opt => opt.MapFrom(src => RemoveRandomNumber(src.Value.Img)))
                .ForMember(dest => dest.LabelFr, opt => opt.MapFrom(src => src.Value.Label["fr"]))
                .ForMember(dest => dest.LabelEn, opt => opt.MapFrom(src => src.Value.Label["en"]))
                .ForMember(dest => dest.LabelEs, opt => opt.MapFrom(src => src.Value.Label["es"]))
                .ForMember(dest => dest.LabelDe, opt => opt.MapFrom(src => src.Value.Label["de"]))
                .ForMember(dest => dest.IdCategory, opt => opt.ConvertUsing<DeutchNameToCategoryIdConverter, string>(src => src.Value.Category["de"]))
                .ForMember(dest => dest.DescriptionFr, opt => opt.MapFrom(src => src.Value.Description["fr"]))
                .ForMember(dest => dest.DescriptionEn, opt => opt.MapFrom(src => src.Value.Description["en"]))
                .ForMember(dest => dest.DescriptionEs, opt => opt.MapFrom(src => src.Value.Description["es"]))
                .ForMember(dest => dest.DescriptionDe, opt => opt.MapFrom(src => src.Value.Description["de"]))
                .ForMember(dest => dest.Deco, opt => opt.MapFrom(src => src.Value.Deco))
                .ForMember(dest => dest.Guard, opt => opt.MapFrom(src => src.Value.Guard))
                .ForMember(dest => dest.IsHeaver, opt => opt.MapFrom(src => src.Value.Heavy))
                .ForMember(dest => dest.IdItem, opt => opt.MapFrom(src => src.Value.Id))
                .ForMember(dest => dest.DropRateNotPraf, opt => opt.Ignore())
                .ForMember(dest => dest.DropRatePraf, opt => opt.Ignore());

            CreateMap<ItemCompletModel, Item>()
                .ForMember(dest => dest.Id, opt => opt.MapFrom(src => src.IdItem))
                .ForMember(dest => dest.Img, opt => opt.MapFrom(src => src.ItemImg))
                .ForMember(dest => dest.Actions, opt => opt.Ignore())
                .ForMember(dest => dest.Properties, opt => opt.Ignore())
                .ForMember(dest => dest.BankCount, opt => opt.Ignore())
                .ForMember(dest => dest.Category, opt => opt.MapFrom(src => new Category() { IdCategory = src.IdCategory, Name = src.CatName, Ordering = src.CatOrdering, Label = new Dictionary<string, string>() { { "fr", src.CatLabelFr }, { "en", src.CatLabelEn }, { "es", src.CatLabelEs }, { "de", src.CatLabelDe } } }))
                .ForMember(dest => dest.Description, opt => opt.MapFrom(src => new Dictionary<string, string>() { { "fr", src.ItemDescriptionFr }, { "en", src.ItemDescriptionEn }, { "es", src.ItemDescriptionEs }, { "de", src.ItemDescriptionDe } }))
                .ForMember(dest => dest.Label, opt => opt.MapFrom(src => new Dictionary<string, string>() { { "fr", src.ItemLabelFr }, { "en", src.ItemLabelEn }, { "es", src.ItemLabelEs }, { "de", src.ItemLabelDe } }))
                .ForMember(dest => dest.WishListCount, opt => opt.Ignore())
                .ForMember(dest => dest.Recipes, opt => opt.Ignore())
                .ForMember(dest => dest.Deco, opt => opt.MapFrom(src => src.ItemDeco))
                .ForMember(dest => dest.Guard, opt => opt.MapFrom(src => src.ItemGuard))
                .ForMember(dest => dest.IsHeaver, opt => opt.MapFrom(src => src.ItemIsHeaver))
                .ForMember(dest => dest.Uid, opt => opt.MapFrom(src => src.ItemUid))
                .ForMember(dest => dest.DropRatePraf, opt => opt.MapFrom(src => src.DropRatePraf))
                .ForMember(dest => dest.DropRateNotPraf, opt => opt.MapFrom(src => src.DropRateNotPraf));

            CreateMap<TownCitizenBagItemCompletModel, Item>()
                .ForMember(dest => dest.Id, opt => opt.MapFrom(src => src.IdItem))
                .ForMember(dest => dest.Img, opt => opt.MapFrom(src => src.ItemImg))
                .ForMember(dest => dest.Actions, opt => opt.Ignore())
                .ForMember(dest => dest.Properties, opt => opt.Ignore())
                .ForMember(dest => dest.BankCount, opt => opt.Ignore())
                .ForMember(dest => dest.Category, opt => opt.MapFrom(src => new Category() { IdCategory = src.IdCategory, Name = src.CatName, Ordering = src.CatOrdering, Label = new Dictionary<string, string>() { { "fr", src.CatLabelFr }, { "en", src.CatLabelEn }, { "es", src.CatLabelEs }, { "de", src.CatLabelDe } } }))
                .ForMember(dest => dest.Description, opt => opt.MapFrom(src => new Dictionary<string, string>() { { "fr", src.ItemDescriptionFr }, { "en", src.ItemDescriptionEn }, { "es", src.ItemDescriptionEs }, { "de", src.ItemDescriptionDe } }))
                .ForMember(dest => dest.Label, opt => opt.MapFrom(src => new Dictionary<string, string>() { { "fr", src.ItemLabelFr }, { "en", src.ItemLabelEn }, { "es", src.ItemLabelEs }, { "de", src.ItemLabelDe } }))
                .ForMember(dest => dest.WishListCount, opt => opt.Ignore())
                .ForMember(dest => dest.Recipes, opt => opt.Ignore())
                .ForMember(dest => dest.Deco, opt => opt.MapFrom(src => src.ItemDeco))
                .ForMember(dest => dest.Guard, opt => opt.MapFrom(src => src.ItemGuard))
                .ForMember(dest => dest.IsHeaver, opt => opt.MapFrom(src => src.ItemIsHeaver))
                .ForMember(dest => dest.Uid, opt => opt.MapFrom(src => src.ItemUid))
                .ForMember(dest => dest.DropRatePraf, opt => opt.MapFrom(src => src.DropRatePraf))
                .ForMember(dest => dest.DropRateNotPraf, opt => opt.MapFrom(src => src.DropRateNotPraf));

            CreateMap<TownCitizenBagItemCompletModel, CitizenItem>()
               .ForMember(dest => dest.Item, opt => opt.MapFrom(src => src))
               .ForMember(dest => dest.IsBroken, opt => opt.MapFrom(src => src.IsBroken))
               .ForMember(dest => dest.Count, opt => opt.MapFrom(src => src.ItemCount));

            CreateMap<IEnumerable<TownCitizenBagItemCompletModel>, CitizenBag>()
                .ForMember(dest => dest.Items, opt => opt.MapFrom(src => src))
                .ForMember(dest => dest.LastUpdateInfo, opt => { opt.MapFrom(src => new LastUpdateInfo() { UpdateTime = GetBagLastUpdateDateWithNullCheck(src).Value, UserName = GetBagLastUpdateUserNameWithNullCheck(src) }); opt.PreCondition(src => GetBagLastUpdateDateWithNullCheck(src).HasValue); })
                .ForMember(dest => dest.IdBag, opt => opt.MapFrom(src => GetBagIdWithNullCheck(src)));

            // Ruins
            CreateMap<MyHordesOptimizerRuin, RuinModel>()
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

            CreateMap<RuinCompletModel, MyHordesOptimizerRuin>()
                .ForMember(dest => dest.Chance, opt => opt.MapFrom(src => src.RuinChance))
                .ForMember(dest => dest.Camping, opt => opt.MapFrom(src => src.RuinCamping))
                .ForMember(dest => dest.Description, opt => opt.MapFrom(src => new Dictionary<string, string>() { { "fr", src.RuinDescriptionFr }, { "en", src.RuinDescriptionEn }, { "es", src.RuinDescriptionEs }, { "de", src.RuinDescriptionDe } }))
                .ForMember(dest => dest.Label, opt => opt.MapFrom(src => new Dictionary<string, string>() { { "fr", src.RuinLabelFr }, { "en", src.RuinLabelEn }, { "es", src.RuinLabelEs }, { "de", src.RuinLabelDe } }))
                .ForMember(dest => dest.MaxDist, opt => opt.MapFrom(src => src.RuinMaxDist))
                .ForMember(dest => dest.MinDist, opt => opt.MapFrom(src => src.RuinMinDist))
                .ForMember(dest => dest.Id, opt => opt.MapFrom(src => src.IdRuin))
                .ForMember(dest => dest.Explorable, opt => opt.MapFrom(src => src.RuinExplorable))
                .ForMember(dest => dest.Img, opt => opt.MapFrom(src => src.RuinImg))
                .ForMember(dest => dest.Drops, opt => opt.Ignore());

            //HeroSkills
            CreateMap<HeroSkillsModel, HeroSkill>()
                .ForMember(dest => dest.Name, opt => opt.MapFrom(src => src.Name))
                .ForMember(dest => dest.DaysNeeded, opt => opt.MapFrom(src => src.DaysNeeded))
                .ForMember(dest => dest.Icon, opt => opt.MapFrom(src => src.Icon))
                .ForMember(dest => dest.NbUses, opt => opt.MapFrom(src => src.NbUses))
                .ForMember(dest => dest.Description, opt => opt.MapFrom(src => new Dictionary<string, string>() { { "fr", src.DescriptionFr }, { "en", src.DescriptionEn }, { "es", src.DescriptionEs }, { "de", src.DescriptionDe } }))
                .ForMember(dest => dest.Label, opt => opt.MapFrom(src => new Dictionary<string, string>() { { "fr", src.LabelFr }, { "en", src.LabelEn }, { "es", src.LabelEs }, { "de", src.LabelDe } }));

            //Recipes
            CreateMap<RecipeCompletModel, ItemRecipe>()
                .ForMember(dest => dest.Name, opt => opt.MapFrom(src => src.RecipeName))
                .ForMember(dest => dest.Type, opt => opt.MapFrom(src => src.Type))
                .ForMember(dest => dest.Actions, opt => opt.MapFrom(src => new Dictionary<string, string>() { { "fr", src.ActionFr }, { "en", src.ActionEn }, { "es", src.ActionEs }, { "de", src.ActionDe } }))
                .ForMember(dest => dest.Components, opt => opt.Ignore())
                .ForMember(dest => dest.Result, opt => opt.Ignore());

            //Town
            CreateMap<Town, TownModel>()
                .ForMember(dest => dest.IdTown, opt => opt.MapFrom(src => src.Id))
                .ForMember(dest => dest.WishlistDateUpdate, opt => opt.Ignore())
                .ForMember(dest => dest.IdUserWishListUpdater, opt => opt.Ignore());

            //User
            CreateMap<Citizen, UsersModel>()
                .ForMember(dest => dest.IdUser, opt => opt.MapFrom(src => src.Id))
                .ForMember(dest => dest.Name, opt => opt.MapFrom(src => src.Name))
                .ForMember(dest => dest.UserKey, opt => opt.Ignore());

            //TownCitizen
            CreateMap<Citizen, TownCitizenModel>()
                .ForMember(dest => dest.IdTown, opt => opt.Ignore())
                .ForMember(dest => dest.IdLastUpdateInfo, opt => opt.Ignore())
                .ForMember(dest => dest.IdUser, opt => opt.MapFrom(src => src.Id))
                .ForMember(dest => dest.HomeMessage, opt => opt.MapFrom(src => src.HomeMessage))
                .ForMember(dest => dest.PositionY, opt => opt.MapFrom(src => src.Y))
                .ForMember(dest => dest.PositionX, opt => opt.MapFrom(src => src.X))
                .ForMember(dest => dest.JobUID, opt => opt.MapFrom(src => src.JobName))
                .ForMember(dest => dest.JobName, opt => opt.MapFrom(src => src.JobName))
                .ForMember(dest => dest.IsGhost, opt => opt.MapFrom(src => src.IsGhost))
                .ForMember(dest => dest.IdBag, opt => opt.Ignore());

            CreateMap<TownCitizenBagItemCompletModel, Citizen>()
                .ForMember(dest => dest.Name, opt => opt.MapFrom(src => src.CitizenName))
                .ForMember(dest => dest.NombreJourHero, opt => opt.Ignore())
                .ForMember(dest => dest.Avatar, opt => opt.MapFrom(src => src.Avatar))
                .ForMember(dest => dest.HomeMessage, opt => opt.MapFrom(src => src.CitizenHomeMessage))
                .ForMember(dest => dest.Id, opt => opt.MapFrom(src => src.CitizenId))
                .ForMember(dest => dest.IsGhost, opt => opt.MapFrom(src => src.CitizenIsGhost))
                .ForMember(dest => dest.JobName, opt => opt.MapFrom(src => src.CitizenJobName))
                .ForMember(dest => dest.X, opt => opt.MapFrom(src => src.CitizenPositionX))
                .ForMember(dest => dest.Y, opt => opt.MapFrom(src => src.CitizenPositionY))
                .ForMember(dest => dest.Home, opt => opt.MapFrom(src => src))
                .ForMember(dest => dest.ActionsHeroic, opt => opt.MapFrom(src => src))
                .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src))
                .ForMember(dest => dest.Bag, opt => opt.Ignore());

            //LastUpdate
            CreateMap<LastUpdateInfo, LastUpdateInfoModel>()
                .ForMember(dest => dest.IdUser, opt => opt.MapFrom(src => src.UserId))
                .ForMember(dest => dest.DateUpdate, opt => opt.MapFrom(src => src.UpdateTime))
                .ForMember(dest => dest.IdLastUpdateInfo, opt => opt.Ignore());

            CreateMap<TownCitizenBagItemCompletModel, LastUpdateInfo>()
               .ForMember(dest => dest.UserKey, opt => opt.Ignore())
               .ForMember(dest => dest.UserId, opt => opt.MapFrom(src => src.LastUpdateInfoUserId))
               .ForMember(dest => dest.UpdateTime, opt => opt.MapFrom(src => src.LastUpdateDateUpdate))
               .ForMember(dest => dest.UserName, opt => opt.MapFrom(src => src.LastUpdateInfoUserName));

            //TownBankItem
            CreateMap<BankItem, TownBankItemModel>()
                .ForMember(dest => dest.IdItem, opt => opt.MapFrom(src => src.Item.Id))
                .ForMember(dest => dest.Count, opt => opt.MapFrom(src => src.Count))
                .ForMember(dest => dest.IsBroken, opt => opt.MapFrom(src => src.IsBroken))
                .ForMember(dest => dest.IdTown, opt => opt.Ignore())
                .ForMember(dest => dest.IdLastUpdateInfo, opt => opt.Ignore());

            CreateMap<IGrouping<BankItemCompletKeyModel, BankItemCompletModel>, BankItem>()
                .ForMember(dest => dest.Count, opt => opt.MapFrom(src => src.First().BankCount))
                .ForMember(dest => dest.IsBroken, opt => opt.MapFrom(src => src.First().BankIsBroken))
                .ForMember(dest => dest.Item, opt => opt.MapFrom(src => new Item() { Id = src.Key.ItemId }));

            CreateMap<BankItemCompletModel, Item>()
                .ForMember(dest => dest.Img, opt => opt.MapFrom(src => src.ItemImg))
                .ForMember(dest => dest.Actions, opt => opt.MapFrom(src => src.ActionName))
                .ForMember(dest => dest.Deco, opt => opt.MapFrom(src => src.ItemDeco))
                .ForMember(dest => dest.Description, opt => opt.MapFrom(src => new Dictionary<string, string>() { { "fr", src.ItemDescriptionFr }, { "en", src.ItemDescriptionEn }, { "es", src.ItemDescriptionEs }, { "de", src.ItemDescriptionDe } }))
                .ForMember(dest => dest.IsHeaver, opt => opt.MapFrom(src => src.ItemIsHeaver))
                .ForMember(dest => dest.Properties, opt => opt.Ignore())
                .ForMember(dest => dest.Actions, opt => opt.Ignore())
                .ForMember(dest => dest.Guard, opt => opt.MapFrom(src => src.ItemGuard))
                .ForMember(dest => dest.BankCount, opt => opt.MapFrom(src => src.BankCount))
                .ForMember(dest => dest.Label, opt => opt.MapFrom(src => new Dictionary<string, string>() { { "fr", src.ItemLabelFr }, { "en", src.ItemLabelEn }, { "es", src.ItemLabelEs }, { "de", src.ItemLabelDe } }))
                .ForMember(dest => dest.Recipes, opt => opt.Ignore())
                .ForMember(dest => dest.Category, opt => opt.MapFrom(src => new Category() { IdCategory = src.CategoryId, Name = src.CategoryName, Ordering = src.CategoryOrdering, Label = new Dictionary<string, string>() { { "fr", src.CategoryLabelFr }, { "en", src.CategoryLabelEn }, { "es", src.CategoryLabelEs }, { "de", src.CategoryLabelDe } } }))
                .ForMember(dest => dest.Id, opt => opt.MapFrom(src => src.ItemId))
                .ForMember(dest => dest.Uid, opt => opt.MapFrom(src => src.ItemUid))
                .ForMember(dest => dest.WishListCount, opt => opt.Ignore())
                .ForMember(dest => dest.Img, opt => opt.MapFrom(src => src.ItemImg));

            CreateMap<BankItemCompletModel, LastUpdateInfo>()
                 .ForMember(dest => dest.UserKey, opt => opt.Ignore())
                 .ForMember(dest => dest.UserId, opt => opt.MapFrom(src => src.LastUpdateInfoUserId))
                 .ForMember(dest => dest.UpdateTime, opt => opt.MapFrom(src => src.LastUpdateDateUpdate))
                 .ForMember(dest => dest.UserName, opt => opt.MapFrom(src => src.LastUpdateInfoUserName));

            // Wishlist
            CreateMap<WishListPutResquestDto, TownWishlistItemModel>()
                .ForMember(dest => dest.IdTown, opt => opt.Ignore())
                .ForMember(dest => dest.IdItem, opt => opt.MapFrom(src => src.Id))
                .ForMember(dest => dest.Depot, opt => opt.MapFrom(src => src.Depot))
                .ForMember(dest => dest.Priority, opt => opt.MapFrom(src => src.Priority))
                .ForMember(dest => dest.Count, opt => opt.MapFrom(src => src.Count));

            CreateMap<IGrouping<TownWishlistItemCompletKeyModel, TownWishlistItemCompletModel>, WishListItem>()
               .ForMember(dest => dest.Count, opt => opt.MapFrom(src => src.First().WishlistCount))
               .ForMember(dest => dest.Depot, opt => opt.MapFrom(src => src.First().WishlistDepot))
               .ForMember(dest => dest.Priority, opt => opt.MapFrom(src => src.First().WishlistPriority))
               .ForMember(dest => dest.BankCount, opt => opt.Ignore())
               .ForMember(dest => dest.IsWorkshop, opt => opt.Ignore())
               .ForMember(dest => dest.Item, opt => opt.MapFrom(src => new Item() { Id = src.Key.ItemId }));

            CreateMap<TownWishlistItemCompletModel, Item>()
                .ForMember(dest => dest.Img, opt => opt.MapFrom(src => src.ItemImg))
                .ForMember(dest => dest.Actions, opt => opt.MapFrom(src => src.ActionName))
                .ForMember(dest => dest.Deco, opt => opt.MapFrom(src => src.ItemDeco))
                .ForMember(dest => dest.Description, opt => opt.MapFrom(src => new Dictionary<string, string>() { { "fr", src.ItemDescriptionFr }, { "en", src.ItemDescriptionEn }, { "es", src.ItemDescriptionEs }, { "de", src.ItemDescriptionDe } }))
                .ForMember(dest => dest.IsHeaver, opt => opt.MapFrom(src => src.ItemIsHeaver))
                .ForMember(dest => dest.Properties, opt => opt.Ignore())
                .ForMember(dest => dest.Actions, opt => opt.Ignore())
                .ForMember(dest => dest.Guard, opt => opt.MapFrom(src => src.ItemGuard))
                .ForMember(dest => dest.BankCount, opt => opt.Ignore())
                .ForMember(dest => dest.Label, opt => opt.MapFrom(src => new Dictionary<string, string>() { { "fr", src.ItemLabelFr }, { "en", src.ItemLabelEn }, { "es", src.ItemLabelEs }, { "de", src.ItemLabelDe } }))
                .ForMember(dest => dest.Recipes, opt => opt.Ignore())
                .ForMember(dest => dest.Category, opt => opt.MapFrom(src => new Category() { IdCategory = src.CategoryId, Name = src.CategoryName, Ordering = src.CategoryOrdering, Label = new Dictionary<string, string>() { { "fr", src.CategoryLabelFr }, { "en", src.CategoryLabelEn }, { "es", src.CategoryLabelEs }, { "de", src.CategoryLabelDe } } }))
                .ForMember(dest => dest.Id, opt => opt.MapFrom(src => src.ItemId))
                .ForMember(dest => dest.Uid, opt => opt.MapFrom(src => src.ItemUid))
                .ForMember(dest => dest.WishListCount, opt => opt.MapFrom(src => src.WishlistCount))
                .ForMember(dest => dest.Img, opt => opt.MapFrom(src => src.ItemImg));

            CreateMap<TownWishlistItemCompletModel, LastUpdateInfo>()
                 .ForMember(dest => dest.UserKey, opt => opt.Ignore())
                 .ForMember(dest => dest.UserId, opt => opt.MapFrom(src => src.LastUpdateInfoUserId))
                 .ForMember(dest => dest.UpdateTime, opt => opt.MapFrom(src => src.LastUpdateDateUpdate))
                 .ForMember(dest => dest.UserName, opt => opt.MapFrom(src => src.LastUpdateInfoUserName));

            CreateMap<HomeUpgradeDetailsDto, TownCitizenDetailModel>()
                .ForMember(dest => dest.ApagCharges, opt => opt.Ignore())
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

            CreateMap<TownCitizenBagItemCompletModel, CitizenHome>()
                .ForMember(dest => dest.Content, opt => opt.MapFrom(src => src))
                .ForMember(dest => dest.LastUpdateInfo, opt => { opt.MapFrom(src => new LastUpdateInfo() { UpdateTime = src.HomeLastUpdateDateUpdate.Value, UserName = src.HomeLastUpdateInfoUserName }); opt.PreCondition(src => src.HomeLastUpdateDateUpdate.HasValue); });
            CreateMap<TownCitizenBagItemCompletModel, CitizenStatus>()
                .ForMember(dest => dest.Content, opt => opt.MapFrom(src => src))
                .ForMember(dest => dest.LastUpdateInfo, opt => { opt.MapFrom(src => new LastUpdateInfo() { UpdateTime = src.StatusLastUpdateDateUpdate.Value, UserName = src.StatusLastUpdateInfoUserName }); opt.PreCondition(src => src.StatusLastUpdateDateUpdate.HasValue); })
                .ForMember(dest => dest.Icons, opt => opt.MapFrom(src => GetStatusIcons(src)));
            CreateMap<TownCitizenBagItemCompletModel, CitizenActionsHeroic>()
                .ForMember(dest => dest.Content, opt => opt.MapFrom(src => src))
                .ForMember(dest => dest.LastUpdateInfo, opt => { opt.MapFrom(src => new LastUpdateInfo() { UpdateTime = src.HeroicActionLastUpdateDateUpdate.Value, UserName = src.HeroicActionLastUpdateInfoUserName }); opt.PreCondition(src => src.HeroicActionLastUpdateDateUpdate.HasValue); });


            CreateMap<TownCitizenBagItemCompletModel, CitizenHomeValue>();
            CreateMap<TownCitizenBagItemCompletModel, CitizenStatusValue>();
            CreateMap<TownCitizenBagItemCompletModel, CitizenActionsHeroicValue>();
        }

        private List<string> GetStatusIcons(TownCitizenBagItemCompletModel src)
        {
            var result = new List<string>();
            if (src.IsCleanBody)
            {
                result.Add(StatusValue.CleanBody.GetDescription());
            }
            if (src.IsCamper)
            {
                result.Add(StatusValue.Camper.GetDescription());
            }
            if (src.IsAddict)
            {
                result.Add(StatusValue.Addict.GetDescription());
            }
            if (src.IsDrugged)
            {
                result.Add(StatusValue.Drugged.GetDescription());
            }
            if (src.IsDrunk)
            {
                result.Add(StatusValue.Drunk.GetDescription());
            }
            if (src.IsGhoul)
            {
                result.Add(StatusValue.Ghoul.GetDescription());
            }
            if (src.IsQuenched)
            {
                result.Add(StatusValue.Quenched.GetDescription());
            }
            if (src.IsConvalescent)
            {
                result.Add(StatusValue.Convalescent.GetDescription());
            }
            if (src.IsSated)
            {
                result.Add(StatusValue.Sated.GetDescription());
            }
            if (src.IsCheatingDeathActive)
            {
                result.Add(StatusValue.CheatingDeathActive.GetDescription());
            }
            if (src.IsHangOver)
            {
                result.Add(StatusValue.HangOver.GetDescription());
            }
            if (src.IsImmune)
            {
                result.Add(StatusValue.Immune.GetDescription());
            }
            if (src.IsInfected)
            {
                result.Add(StatusValue.Infected.GetDescription());
            }
            if (src.IsTerrorised)
            {
                result.Add(StatusValue.Terrorised.GetDescription());
            }
            if (src.IsThirsty)
            {
                result.Add(StatusValue.Thirsty.GetDescription());
            }
            if (src.IsDesy)
            {
                result.Add(StatusValue.Desy.GetDescription());
            }
            if (src.IsTired)
            {
                result.Add(StatusValue.Tired.GetDescription());
            }
            if (src.IsHeadWounded)
            {
                result.Add(StatusValue.HeadWounded.GetDescription());
            }
            if (src.IsHandWounded)
            {
                result.Add(StatusValue.HandWounded.GetDescription());
            }
            if (src.IsArmWounded)
            {
                result.Add(StatusValue.ArmWounded.GetDescription());
            }
            if (src.IsLegWounded)
            {
                result.Add(StatusValue.LegWounded.GetDescription());
            }
            if (src.IsEyeWounded)
            {
                result.Add(StatusValue.EyeWounded.GetDescription());
            }
            if (src.IsFootWounded)
            {
                result.Add(StatusValue.FootWounded.GetDescription());
            }
            return result;
        }

        private DateTime? GetBagLastUpdateDateWithNullCheck(IEnumerable<TownCitizenBagItemCompletModel> src)
        {
            var first = src.FirstOrDefault();
            if (first != null)
            {
                return first.BagLastUpdateDateUpdate;
            }
            else
            {
                return null;
            }
        }
        private string GetBagLastUpdateUserNameWithNullCheck(IEnumerable<TownCitizenBagItemCompletModel> src)
        {
            var first = src.FirstOrDefault();
            if (first != null)
            {
                return first.BagLastUpdateUserName;
            }
            else
            {
                return null;
            }
        }
        private int? GetBagIdWithNullCheck(IEnumerable<TownCitizenBagItemCompletModel> src)
        {
            var first = src.FirstOrDefault();
            if (first != null)
            {
                return first.BagId;
            }
            else
            {

                return null;
            }
        }

        private string RemoveRandomNumber(string img)
        {
            var replaced = Regex.Replace(img, @"(.*)\.(.*)\.(.*)", "$1.$3");
            return replaced;
        }
    }
}
