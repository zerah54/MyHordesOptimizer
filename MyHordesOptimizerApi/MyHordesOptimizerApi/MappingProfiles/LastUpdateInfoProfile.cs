using AutoMapper;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Models;

namespace MyHordesOptimizerApi.MappingProfiles
{
    public class LastUpdateInfoProfile : Profile
    {
        public LastUpdateInfoProfile()
        {
            CreateMap<LastUpdateInfoDto, LastUpdateInfo>()
                .ForMember(model => model.DateUpdate, opt => opt.MapFrom(src => src.UpdateTime))
                .ForMember(model => model.Expeditions, opt => opt.Ignore())
                .ForMember(model => model.IdLastUpdateInfo, opt => opt.Ignore())
                // IdUser directement depuis le DTO (toujours renseigné par GenerateLastUpdateInfo) :
                // mapper IdUserNavigation créerait un User quasi-vide (seuls IdUser/Name sont connus
                // du DTO), qu'Update() attacherait en Modified sur TOUTES ses colonnes, écrasant
                // avatar/stats/dates d'import déjà en base (lost update).
                .ForMember(model => model.IdUser, opt => opt.MapFrom(src => src.UserId))
                .ForMember(model => model.IdUserNavigation, opt => opt.Ignore())
                .ForMember(model => model.MapCellDigs, opt => opt.Ignore())
                .ForMember(model => model.MapCells, opt => opt.Ignore())
                .ForMember(model => model.TownBankItems, opt => opt.Ignore())
                .ForMember(model => model.TownCadavers, opt => opt.Ignore())
                .ForMember(model => model.TownCitizenIdLastUpdateInfoGhoulStatusNavigations, opt => opt.Ignore())
                .ForMember(model => model.TownCitizenIdLastUpdateInfoHeroicActionNavigations, opt => opt.Ignore())
                .ForMember(model => model.TownCitizenIdLastUpdateInfoHomeNavigations, opt => opt.Ignore())
                .ForMember(model => model.TownCitizenIdLastUpdateInfoNavigations, opt => opt.Ignore())
                .ForMember(model => model.TownCitizenIdLastUpdateInfoStatusNavigations, opt => opt.Ignore())
                .ForMember(model => model.TownEstimations, opt => opt.Ignore());

            CreateMap<LastUpdateInfo, LastUpdateInfoDto>()
                .ForMember(dto => dto.UserId, opt => opt.MapFrom(model => model.IdUser))
                .ForMember(dto => dto.UserName, opt => opt.MapFrom(model => model.IdUserNavigation.Name))
                .ForMember(dto => dto.UpdateTime, opt => opt.MapFrom(model => model.DateUpdate));
        }
    }
}
