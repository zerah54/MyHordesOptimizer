using AutoMapper;
using MyHordesOptimizerApi.Dtos.MyHordes;
using MyHordesOptimizerApi.Dtos.MyHordes.Me;
using MyHordesOptimizerApi.MappingProfiles.Resolvers.MyHordes;
using MyHordesOptimizerApi.Models;
using System.Collections.Generic;

namespace MyHordesOptimizerApi.MappingProfiles.Towns
{
    public class TownMappingProfile : Profile
    {

        public TownMappingProfile()
        {
            CreateMap<MyHordesMeResponseDto, Town>()
                .ForMember(dest => dest.Day, opt => opt.MapFrom(src => src.Map.Days))
                .ForMember(dest => dest.Expeditions, opt => opt.Ignore())
                .ForMember(dest => dest.Height, opt => opt.MapFrom(src => src.Map.Hei))
                .ForMember(dest => dest.IdTown, opt => opt.MapFrom(src => src.MapId))
                .ForMember(dest => dest.IdUserWishListUpdater, opt => opt.Ignore())
                .ForMember(dest => dest.IsChaos, opt => opt.MapFrom(src => src.Map.City.Chaos))
                .ForMember(dest => dest.IsDevasted, opt => opt.MapFrom(src => src.Map.City.Devast))
                .ForMember(dest => dest.IsDoorOpen, opt => opt.MapFrom(src => src.Map.City.Door))
                .ForMember(dest => dest.MapCellDigUpdates, opt => opt.Ignore())
                .ForMember(dest => dest.MapCells, opt => opt.Ignore())
                .ForMember(dest => dest.TownBankItems, opt => opt.MapFrom((src, dest, srcMember, context) =>
                {
                    var results = new List<TownBankItem>();
                    foreach (var myHordesBank in src.Map.City.Bank)
                    {
                        var model = context.Mapper.Map<TownBankItem>(myHordesBank);
                        model.IdLastUpdateInfo = src.Map.LastUpdateInfo.IdLastUpdateInfo;
                        model.IdLastUpdateInfoNavigation = src.Map.LastUpdateInfo;
                        model.IdTown = src.MapId;
                        results.Add(model);
                    }
                    return results;
                }))
                .ForMember(dest => dest.TownCitizens, opt => opt.MapFrom((src, dest, srcMember, context) =>
                {
                    var results = new List<TownCitizen>();
                    foreach (var myHordeCitizen in src.Map.Citizens)
                    {
                        var model = context.Mapper.Map<TownCitizen>(myHordeCitizen);
                        model.IdLastUpdateInfo = src.Map.LastUpdateInfo.IdLastUpdateInfo;
                        model.IdLastUpdateInfoNavigation = src.Map.LastUpdateInfo;
                        model.IdTown = src.MapId;
                        results.Add(model);
                    }
                    return results;
                }))
                .ForMember(dest => dest.TownEstimations, opt => opt.Ignore())
                .ForMember(dest => dest.TownWishListItems, opt => opt.Ignore())
                .ForMember(dest => dest.WaterWell, opt => opt.MapFrom(src => src.Map.City.Water))
                .ForMember(dest => dest.Width, opt => opt.MapFrom(src => src.Map.Wid))
                .ForMember(dest => dest.WishlistDateUpdate, opt => opt.Ignore())
                .ForMember(dest => dest.X, opt => opt.MapFrom(src => src.Map.City.X))
                .ForMember(dest => dest.Y, opt => opt.MapFrom(src => src.Map.City.Y));

            CreateMap<MyHordesBank, TownBankItem>()
                .ForMember(dest => dest.Count, opt => opt.MapFrom(src => src.Count))
                .ForMember(dest => dest.IdItem, opt => opt.MapFrom(src => src.Id))
                .ForMember(dest => dest.IdItemNavigation, opt => opt.Ignore())
                .ForMember(dest => dest.IdLastUpdateInfo, opt => opt.Ignore())
                .ForMember(dest => dest.IdLastUpdateInfoNavigation, opt => opt.Ignore())
                .ForMember(dest => dest.IdTown, opt => opt.Ignore())
                .ForMember(dest => dest.IdTownNavigation, opt => opt.Ignore())
                .ForMember(dest => dest.IsBroken, opt => opt.MapFrom(src => src.Broken));

            CreateMap<MyHordesCitizen, TownCitizen>()
                .ForMember(dest => dest.Apagcharges, opt => opt.Ignore())
                .ForMember(dest => dest.Avatar, opt => opt.MapFrom(src => src.Avatar))
                .ForMember(dest => dest.ChestLevel, opt => opt.Ignore())
                .ForMember(dest => dest.Dead, opt => opt.MapFrom(src => src.Dead))
                .ForMember(dest => dest.GhoulVoracity, opt => opt.Ignore())
                .ForMember(dest => dest.HasAlarm, opt => opt.Ignore())
                .ForMember(dest => dest.HasBreakThrough, opt => opt.Ignore())
                .ForMember(dest => dest.HasBrotherInArms, opt => opt.Ignore())
                .ForMember(dest => dest.HasCheatDeath, opt => opt.Ignore())
                .ForMember(dest => dest.HasCurtain, opt => opt.Ignore())
                .ForMember(dest => dest.HasFence, opt => opt.Ignore())
                .ForMember(dest => dest.HasHeroicReturn, opt => opt.Ignore())
                .ForMember(dest => dest.HasLock, opt => opt.Ignore())
                .ForMember(dest => dest.HasLuckyFind, opt => opt.Ignore())
                .ForMember(dest => dest.HasRescue, opt => opt.Ignore())
                .ForMember(dest => dest.HasUppercut, opt => opt.Ignore())
                .ForMember(dest => dest.HomeMessage, opt => opt.MapFrom(src => src.HomeMessage))
                .ForMember(dest => dest.HouseDefense, opt => opt.MapFrom(src => src.BaseDef))
                .ForMember(dest => dest.HouseLevel, opt => opt.Ignore())
                .ForMember(dest => dest.IdBag, opt => opt.Ignore())
                .ForMember(dest => dest.IdBagNavigation, opt => opt.Ignore())
                .ForMember(dest => dest.IdCadaver, opt => opt.Ignore())
                .ForMember(dest => dest.IdLastUpdateInfo, opt => opt.Ignore())
                .ForMember(dest => dest.IdLastUpdateInfoGhoulStatus, opt => opt.Ignore())
                .ForMember(dest => dest.IdLastUpdateInfoGhoulStatusNavigation, opt => opt.Ignore())
                .ForMember(dest => dest.IdLastUpdateInfoHeroicAction, opt => opt.Ignore())
                .ForMember(dest => dest.IdLastUpdateInfoHeroicActionNavigation, opt => opt.Ignore())
                .ForMember(dest => dest.IdLastUpdateInfoHome, opt => opt.Ignore())
                .ForMember(dest => dest.IdLastUpdateInfoHomeNavigation, opt => opt.Ignore())
                .ForMember(dest => dest.IdLastUpdateInfoNavigation, opt => opt.Ignore())
                .ForMember(dest => dest.IdLastUpdateInfoStatus, opt => opt.Ignore())
                .ForMember(dest => dest.IdLastUpdateInfoStatusNavigation, opt => opt.Ignore())
                .ForMember(dest => dest.IdTown, opt => opt.Ignore())
                .ForMember(dest => dest.IdTownNavigation, opt => opt.Ignore())
                .ForMember(dest => dest.IdUser, opt => opt.MapFrom(src => src.Id))
                .ForMember(dest => dest.IdUserNavigation, opt => opt.MapFrom<MyHordeCitizenToUserValueResolver>())
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
                .ForMember(dest => dest.IsGhost, opt => opt.MapFrom(src => src.IsGhost))
                .ForMember(dest => dest.IsGhoul, opt => opt.Ignore())
                .ForMember(dest => dest.IsHandWounded, opt => opt.Ignore())
                .ForMember(dest => dest.IsHeadWounded, opt => opt.Ignore())
                .ForMember(dest => dest.IsHungOver, opt => opt.Ignore())
                .ForMember(dest => dest.IsImmune, opt => opt.Ignore())
                .ForMember(dest => dest.IsInfected, opt => opt.Ignore())
                .ForMember(dest => dest.IsLegWounded, opt => opt.Ignore())
                .ForMember(dest => dest.IsQuenched, opt => opt.Ignore())
                .ForMember(dest => dest.IsSated, opt => opt.Ignore())
                .ForMember(dest => dest.IsShunned, opt => opt.MapFrom(src => src.Ban))
                .ForMember(dest => dest.IsTerrorised, opt => opt.Ignore())
                .ForMember(dest => dest.IsThirsty, opt => opt.Ignore())
                .ForMember(dest => dest.IsTired, opt => opt.Ignore())
                .ForMember(dest => dest.JobName, opt => opt.MapFrom(src => src.Job.Name))
                .ForMember(dest => dest.JobUid, opt => opt.MapFrom(src => src.Job.Uid))
                .ForMember(dest => dest.KitchenLevel, opt => opt.Ignore())
                .ForMember(dest => dest.LaboLevel, opt => opt.Ignore())
                .ForMember(dest => dest.PositionX, opt => opt.MapFrom(src => src.X))
                .ForMember(dest => dest.PositionY, opt => opt.MapFrom(src => src.Y))
                .ForMember(dest => dest.RenfortLevel, opt => opt.Ignore())
                .ForMember(dest => dest.RestLevel, opt => opt.Ignore());

            CreateMap<MyHordesCitizen, User>()
                .ForMember(dest => dest.ExpeditionCitizens, opt => opt.Ignore())
                .ForMember(dest => dest.IdUser, opt => opt.MapFrom(src => src.Id))
                .ForMember(dest => dest.LastUpdateInfos, opt => opt.Ignore())
                .ForMember(dest => dest.MapCellDigs, opt => opt.Ignore())
                .ForMember(dest => dest.Name, opt => opt.MapFrom(src => src.Name))
                .ForMember(dest => dest.TownCadavers, opt => opt.Ignore())
                .ForMember(dest => dest.TownCitizens, opt => opt.Ignore())
                .ForMember(dest => dest.UserKey, opt => opt.Ignore())
                .ForMember(dest => dest.WishlistCategories, opt => opt.Ignore());

        }
    }
}
