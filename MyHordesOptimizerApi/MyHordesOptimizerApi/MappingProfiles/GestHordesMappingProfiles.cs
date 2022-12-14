using AutoMapper;
using MyHordesOptimizerApi.Dtos.ExternalTools.GestHordes;
using MyHordesOptimizerApi.Dtos.ExternalTools.GestHordes.Citizen;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.HeroicAction;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.Home;
using MyHordesOptimizerApi.Models.Citizen;

namespace MyHordesOptimizerApi.MappingProfiles
{
    public class GestHordesMappingProfiles : Profile
    {
        public GestHordesMappingProfiles()
        {
            CreateMap<UpdateRequestDto, GestHordesUpdateCaseRequest>()
                .ForMember(dest => dest.NbrZombie, opt => opt.MapFrom(src => src.Map.Cell.Zombies))
                .ForMember(dest => dest.IdMap, opt => opt.MapFrom(src => src.TownDetails.TownId))
                .ForMember(dest => dest.Epuise, opt => opt.MapFrom(src => src.Map.Cell.ZoneEmpty))
                .ForMember(dest => dest.Y, opt => opt.MapFrom(src => src.TownDetails.TownY - src.Map.Cell.Y))
                .ForMember(dest => dest.X, opt => opt.MapFrom(src => src.TownDetails.TownX + src.Map.Cell.X));

            CreateMap<HomeUpgradeDetailsDto, GestHordesMajCitizenMaisonDto>()
                .ForMember(dest => dest.Rangement, opt => opt.MapFrom(src => src.Chest))
                .ForMember(dest => dest.Cloture, opt => opt.MapFrom(src => src.Fence))
                .ForMember(dest => dest.Labo, opt => opt.MapFrom(src => src.Lab))
                .ForMember(dest => dest.Renfort, opt => opt.MapFrom(src => src.Defense))
                .ForMember(dest => dest.Cuisine, opt => opt.MapFrom(src => src.Kitchen))
                .ForMember(dest => dest.Cs, opt => opt.MapFrom(src => src.Rest));

            CreateMap<TownCitizenDetailModel, GestHordesMajCitizenActionsHeroDto>()
                .ForMember(dest => dest.Apag, opt => opt.MapFrom(src => src.ApagCharges))
                .ForMember(dest => dest.CorpsSain, opt => opt.MapFrom(src => src.IsCleanBody))
                .ForMember(dest => dest.DonJH, opt => opt.Ignore())
                .ForMember(dest => dest.Pef, opt => opt.Ignore())
                .ForMember(dest => dest.Rdh, opt => opt.MapFrom(src => src.HasHeroicReturn))
                .ForMember(dest => dest.Sauvetage, opt => opt.MapFrom(src => src.HasRescue))
                .ForMember(dest => dest.SecondSouffle, opt => opt.MapFrom(src => src.HasSecondWind))
                .ForMember(dest => dest.Trouvaille, opt => opt.MapFrom(src => src.HasLuckyFind))
                .ForMember(dest => dest.Us, opt => opt.MapFrom(src => src.HasUppercut))
                .ForMember(dest => dest.Vlm, opt => opt.MapFrom(src => src.HasCheatDeath));
        }
    }
}
