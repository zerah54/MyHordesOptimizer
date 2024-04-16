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

              CreateMap<MyHordesOptimizerMapDigDto, MapCellDig>()
                .ForMember(dest => dest.IdLastUpdateInfo, opt => opt.Ignore())
                .ForMember(dest => dest.IdCell, opt => opt.MapFrom(src => src.CellId))
                .ForMember(dest => dest.IdUser, opt => opt.MapFrom(src => src.DiggerId));

           
        }    
    }
}
