using AutoMapper;
using AutoMapper.EquivalencyExpression;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Models;

namespace MyHordesOptimizerApi.MappingProfiles
{
    public class LastUpdateInfoProfile : Profile
    {
        public LastUpdateInfoProfile()
        {
            CreateMap<LastUpdateInfoDto, LastUpdateInfo>()
                .ForMember(dest => dest.DateUpdate, opt => opt.MapFrom(src => src.UpdateTime))
                .ForMember(dest => dest.Expeditions, opt => opt.Ignore())
                .ForMember(dest => dest.IdLastUpdateInfo, opt => opt.Ignore())
                .ForMember(dest => dest.IdUser, opt => opt.Ignore())
                .ForMember(dest => dest.IdUserNavigation, opt => opt.MapFrom(src => src))
                .ForMember(dest => dest.MapCellDigs, opt => opt.Ignore())
                .ForMember(dest => dest.MapCells, opt => opt.Ignore())
                .ForMember(dest => dest.TownBankItems, opt => opt.Ignore())
                .ForMember(dest => dest.TownCadavers, opt => opt.Ignore())
                .ForMember(dest => dest.TownCitizenIdLastUpdateInfoGhoulStatusNavigations, opt => opt.Ignore())
                .ForMember(dest => dest.TownCitizenIdLastUpdateInfoHeroicActionNavigations, opt => opt.Ignore())
                .ForMember(dest => dest.TownCitizenIdLastUpdateInfoHomeNavigations, opt => opt.Ignore())
                .ForMember(dest => dest.TownCitizenIdLastUpdateInfoNavigations, opt => opt.Ignore())
                .ForMember(dest => dest.TownCitizenIdLastUpdateInfoStatusNavigations, opt => opt.Ignore())
                .ForMember(dest => dest.TownEstimations, opt => opt.Ignore());

            CreateMap<LastUpdateInfoDto, User>()
                .EqualityComparison((dto, model) => dto.UserId == model.IdUser)
                .ForMember(dest => dest.ExpeditionCitizens, opt => opt.Ignore())
                .ForMember(dest => dest.IdUser, opt => opt.MapFrom(src => src.UserId))
                .ForMember(dest => dest.LastUpdateInfos, opt => opt.Ignore())
                .ForMember(dest => dest.MapCellDigs, opt => opt.Ignore())
                .ForMember(dest => dest.Name, opt => opt.MapFrom(src => src.UserName))
                .ForMember(dest => dest.TownCadavers, opt => opt.Ignore())
                .ForMember(dest => dest.TownCitizens, opt => opt.Ignore())
                .ForMember(dest => dest.UserKey, opt => opt.Ignore())
                .ForMember(dest => dest.WishlistCategories, opt => opt.Ignore());
        }
    }
}
