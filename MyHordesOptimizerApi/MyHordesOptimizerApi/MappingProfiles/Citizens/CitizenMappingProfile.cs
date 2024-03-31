using AutoMapper;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Bag;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Citizens;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.Status;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Map;
using MyHordesOptimizerApi.Extensions;
using MyHordesOptimizerApi.Models;
using System.Collections.Generic;
using System.Linq;

namespace MyHordesOptimizerApi.MappingProfiles.Citizens
{
    public class CitizenMappingProfile : Profile
    {
        public CitizenMappingProfile()
        {
            CreateMap<List<TownCitizen>, CitizensLastUpdateDto>()
                .ForMember(dto => dto.LastUpdateInfo, opt => opt.MapFrom(list => list.First().IdLastUpdateInfoNavigation))
                .ForMember(dto => dto.Citizens, opt => opt.MapFrom(list => list));

            CreateMap<TownCitizen, CitizenDto>()
                .ForMember(dto => dto.ActionsHeroic, opt => opt.MapFrom(model => model))
                .ForMember(dto => dto.Avatar, opt => opt.MapFrom(model => model.Avatar))
                .ForMember(dto => dto.Bag, opt => opt.MapFrom(model => model.IdBagNavigation))
                .ForMember(dto => dto.Cadaver, opt => opt.Ignore()) // ??
                .ForMember(dto => dto.Dead, opt => opt.MapFrom(model => model.Dead))
                .ForMember(dto => dto.Home, opt => opt.MapFrom(model => model))
                .ForMember(dto => dto.HomeMessage, opt => opt.MapFrom(model => model.HomeMessage))
                .ForMember(dto => dto.Id, opt => opt.MapFrom(model => model.IdUser))
                .ForMember(dto => dto.IsGhost, opt => opt.MapFrom(model => model.IsGhost))
                .ForMember(dto => dto.JobName, opt => opt.MapFrom(model => model.JobName))
                .ForMember(dto => dto.JobUid, opt => opt.MapFrom(model => model.JobUid))
                .ForMember(dto => dto.Name, opt => opt.MapFrom(model => model.IdUserNavigation.Name))
                .ForMember(dto => dto.NombreJourHero, opt => opt.Ignore()) // Plus tard
                .ForMember(dto => dto.Status, opt => opt.MapFrom(model => model))
                .ForMember(dto => dto.X, opt => opt.MapFrom(model => model.PositionX))
                .ForMember(dto => dto.Y, opt => opt.MapFrom(model => model.PositionY));

            CreateMap<TownCitizen, CitizenHomeDto>()
                .ForMember(dest => dest.Content, opt => opt.MapFrom(src => src))
                .ForMember(dest => dest.LastUpdateInfo, opt => opt.MapFrom(src => src.IdLastUpdateInfoHomeNavigation));
            CreateMap<TownCitizen, CitizenStatusDto>()
                .ForMember(dest => dest.Content, opt => opt.MapFrom(src => src))
                .ForMember(dest => dest.LastUpdateInfo, opt => opt.MapFrom(src => src.IdLastUpdateInfoStatusNavigation))
                .ForMember(dest => dest.Icons, opt => opt.MapFrom(src => GetStatusIcons(src)))
                .ForMember(dest => dest.GhoulStatusLastUpdateInfo, opt => opt.MapFrom(src => src.IdLastUpdateInfoGhoulStatusNavigation))
                .ForMember(dest => dest.IsGhoul, opt => opt.MapFrom(src => src.IsGhoul))
                .ForMember(dest => dest.GhoulVoracity, opt => opt.MapFrom(src => src.GhoulVoracity));
            CreateMap<TownCitizen, CitizenActionsHeroic>()
                .ForMember(dest => dest.Content, opt => opt.MapFrom(src => src))
                .ForMember(dest => dest.LastUpdateInfo, opt => opt.MapFrom(src => src.IdLastUpdateInfoHeroicActionNavigation));

            CreateMap<Bag, BagDto>()
                .ForMember(dto => dto.Items, opt => opt.MapFrom(model => model.BagItems))
                .ForMember(dto => dto.LastUpdateInfo, opt => opt.MapFrom(model => model.IdLastUpdateInfoNavigation))
                .ForMember(dto => dto.IdBag, opt => opt.MapFrom(model => model.IdBag))
                .ReverseMap()
                .ForMember(model => model.BagItems, opt => opt.MapFrom(dto => dto.Items))
                .ForMember(model => model.IdLastUpdateInfo, opt => opt.Ignore())
                .ForMember(model => model.IdLastUpdateInfoNavigation, opt => opt.MapFrom(dto => dto.LastUpdateInfo))
                .ForMember(model => model.IdBag, opt => opt.MapFrom(dto => dto.IdBag));

            CreateMap<TownCitizen, CitizenHomeValueDto>()
                .ForMember(dest => dest.ChestLevel, opt => opt.MapFrom(src => src.ChestLevel))
                .ForMember(dest => dest.HasAlarm, opt => opt.MapFrom(src => src.HasAlarm))
                .ForMember(dest => dest.HasCurtain, opt => opt.MapFrom(src => src.HasCurtain))
                .ForMember(dest => dest.HasFence, opt => opt.MapFrom(src => src.HasFence))
                .ForMember(dest => dest.HasLock, opt => opt.MapFrom(src => src.HasLock))
                .ForMember(dest => dest.HouseLevel, opt => opt.MapFrom(src => src.HouseLevel))
                .ForMember(dest => dest.KitchenLevel, opt => opt.MapFrom(src => src.KitchenLevel))
                .ForMember(dest => dest.LaboLevel, opt => opt.MapFrom(src => src.LaboLevel))
                .ForMember(dest => dest.RenfortLevel, opt => opt.MapFrom(src => src.RenfortLevel))
                .ForMember(dest => dest.RestLevel, opt => opt.MapFrom(src => src.RestLevel));
            CreateMap<TownCitizen, CitizenStatusValueDto>()
                .ForMember(dest => dest.IsAddict, opt => opt.MapFrom(src => src.IsAddict))
                .ForMember(dest => dest.IsArmWounded, opt => opt.MapFrom(src => src.IsArmWounded))
                .ForMember(dest => dest.IsCamper, opt => opt.MapFrom(src => src.IsCamper))
                .ForMember(dest => dest.IsCheatingDeathActive, opt => opt.MapFrom(src => src.IsCheatingDeathActive))
                .ForMember(dest => dest.IsCleanBody, opt => opt.MapFrom(src => src.IsCleanBody))
                .ForMember(dest => dest.IsConvalescent, opt => opt.MapFrom(src => src.IsConvalescent))
                .ForMember(dest => dest.IsDesy, opt => opt.MapFrom(src => src.IsDesy))
                .ForMember(dest => dest.IsDrugged, opt => opt.MapFrom(src => src.IsDrugged))
                .ForMember(dest => dest.IsDrunk, opt => opt.MapFrom(src => src.IsDrunk))
                .ForMember(dest => dest.IsEyeWounded, opt => opt.MapFrom(src => src.IsEyeWounded))
                .ForMember(dest => dest.IsFootWounded, opt => opt.MapFrom(src => src.IsFootWounded))
                .ForMember(dest => dest.IsGhoul, opt => opt.MapFrom(src => src.IsGhoul))
                .ForMember(dest => dest.IsHandWounded, opt => opt.MapFrom(src => src.IsHandWounded))
                .ForMember(dest => dest.IsHangOver, opt => opt.MapFrom(src => src.IsHungOver))
                .ForMember(dest => dest.IsHeadWounded, opt => opt.MapFrom(src => src.IsHeadWounded))
                .ForMember(dest => dest.IsImmune, opt => opt.MapFrom(src => src.IsImmune))
                .ForMember(dest => dest.IsInfected, opt => opt.MapFrom(src => src.IsInfected))
                .ForMember(dest => dest.IsLegWounded, opt => opt.MapFrom(src => src.IsLegWounded))
                .ForMember(dest => dest.IsQuenched, opt => opt.MapFrom(src => src.IsQuenched))
                .ForMember(dest => dest.IsSated, opt => opt.MapFrom(src => src.IsSated))
                .ForMember(dest => dest.IsTerrorised, opt => opt.MapFrom(src => src.IsTerrorised))
                .ForMember(dest => dest.IsThirsty, opt => opt.MapFrom(src => src.IsThirsty))
                .ForMember(dest => dest.IsTired, opt => opt.MapFrom(src => src.IsTired));
            CreateMap<TownCitizen, CitizenActionsHeroicValue>()
                .ForMember(dest => dest.ApagCharges, opt => opt.MapFrom(src => src.Apagcharges))
                .ForMember(dest => dest.HasBreakThrough, opt => opt.MapFrom(src => src.HasBreakThrough))
                .ForMember(dest => dest.HasBrotherInArms, opt => opt.MapFrom(src => src.HasBrotherInArms))
                .ForMember(dest => dest.HasCheatDeath, opt => opt.MapFrom(src => src.HasCheatDeath))
                .ForMember(dest => dest.HasHeroicReturn, opt => opt.MapFrom(src => src.HasHeroicReturn))
                .ForMember(dest => dest.HasLuckyFind, opt => opt.MapFrom(src => src.HasLuckyFind))
                .ForMember(dest => dest.HasRescue, opt => opt.MapFrom(src => src.HasRescue))
                .ForMember(dest => dest.HasSecondWind, opt => opt.MapFrom(src => src.HasSecondWind))
                .ForMember(dest => dest.HasUppercut, opt => opt.MapFrom(src => src.HasUppercut));

            CreateMap<TownCitizen, CellCitizenDto>()
                .ForMember(cellCitizenDto => cellCitizenDto.Id, opt => opt.MapFrom(townCitizen => townCitizen.IdUser))
                .ForMember(cellCitizenDto => cellCitizenDto.Name, opt => opt.MapFrom(townCitizen => townCitizen.IdUserNavigation.Name));
        }

        #region private helpers

        private List<string> GetStatusIcons(TownCitizen src)
        {
            var result = new List<string>();
            if (src.IsCleanBody.HasValue && src.IsCleanBody.Value)
            {
                result.Add(StatusValue.CleanBody.GetDescription());
            }
            if (src.IsCamper.HasValue && src.IsCamper.Value)
            {
                result.Add(StatusValue.Camper.GetDescription());
            }
            if (src.IsAddict.HasValue && src.IsAddict.Value)
            {
                result.Add(StatusValue.Addict.GetDescription());
            }
            if (src.IsDrugged.HasValue && src.IsDrugged.Value)
            {
                result.Add(StatusValue.Drugged.GetDescription());
            }
            if (src.IsDrunk.HasValue && src.IsDrunk.Value)
            {
                result.Add(StatusValue.Drunk.GetDescription());
            }
            if (src.IsGhoul.HasValue && src.IsGhoul.Value)
            {
                result.Add(StatusValue.Ghoul.GetDescription());
            }
            if (src.IsQuenched.HasValue && src.IsQuenched.Value)
            {
                result.Add(StatusValue.Quenched.GetDescription());
            }
            if (src.IsConvalescent.HasValue && src.IsConvalescent.Value)
            {
                result.Add(StatusValue.Convalescent.GetDescription());
            }
            if (src.IsSated.HasValue && src.IsSated.Value)
            {
                result.Add(StatusValue.Sated.GetDescription());
            }
            if (src.IsCheatingDeathActive.HasValue && src.IsCheatingDeathActive.Value)
            {
                result.Add(StatusValue.CheatingDeathActive.GetDescription());
            }
            if (src.IsHungOver.HasValue && src.IsHungOver.Value)
            {
                result.Add(StatusValue.HangOver.GetDescription());
            }
            if (src.IsImmune.HasValue && src.IsImmune.Value)
            {
                result.Add(StatusValue.Immune.GetDescription());
            }
            if (src.IsInfected.HasValue && src.IsInfected.Value)
            {
                result.Add(StatusValue.Infected.GetDescription());
            }
            if (src.IsTerrorised.HasValue && src.IsTerrorised.Value)
            {
                result.Add(StatusValue.Terrorised.GetDescription());
            }
            if (src.IsThirsty.HasValue && src.IsThirsty.Value)
            {
                result.Add(StatusValue.Thirsty.GetDescription());
            }
            if (src.IsDesy.HasValue && src.IsDesy.Value)
            {
                result.Add(StatusValue.Desy.GetDescription());
            }
            if (src.IsTired.HasValue && src.IsTired.Value)
            {
                result.Add(StatusValue.Tired.GetDescription());
            }
            if (src.IsHeadWounded.HasValue && src.IsHeadWounded.Value)
            {
                result.Add(StatusValue.HeadWounded.GetDescription());
            }
            if (src.IsHandWounded.HasValue && src.IsHandWounded.Value)
            {
                result.Add(StatusValue.HandWounded.GetDescription());
            }
            if (src.IsArmWounded.HasValue && src.IsArmWounded.Value)
            {
                result.Add(StatusValue.ArmWounded.GetDescription());
            }
            if (src.IsLegWounded.HasValue && src.IsLegWounded.Value)
            {
                result.Add(StatusValue.LegWounded.GetDescription());
            }
            if (src.IsEyeWounded.HasValue && src.IsEyeWounded.Value)
            {
                result.Add(StatusValue.EyeWounded.GetDescription());
            }
            if (src.IsFootWounded.HasValue && src.IsFootWounded.Value)
            {
                result.Add(StatusValue.FootWounded.GetDescription());
            }
            return result;
        }
        #endregion
    }
}
