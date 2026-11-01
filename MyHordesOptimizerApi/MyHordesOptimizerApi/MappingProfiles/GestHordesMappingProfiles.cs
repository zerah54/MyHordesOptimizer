using AutoMapper;
using MyHordesOptimizerApi.Dtos.ExternalTools.GestHordes;
using MyHordesOptimizerApi.Dtos.ExternalTools.GestHordes.Citizen;
using MyHordesOptimizerApi.Dtos.ExternalTools.GestHordes.MajCase;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.Bags;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.Home;
using MyHordesOptimizerApi.Models;

namespace MyHordesOptimizerApi.MappingProfiles
{
    public class GestHordesMappingProfiles : Profile
    {
        public GestHordesMappingProfiles()
        {
            // Case de GH, ou case partagée pour les addons antérieurs (cf. ExternalToolsService.GestHordesCellOf)
            CreateMap<UpdateRequestDto, GestHordesMajCaseRequestDto>()
                .ForMember(dest => dest.NbrZombie, opt => opt.MapFrom(src => (src.Map!.GestHordesCell ?? src.Map.Cell!).Zombies))
                .ForMember(dest => dest.IdMap, opt => opt.MapFrom(src => src.TownDetails.TownId))
                .ForMember(dest => dest.Epuise, opt => opt.MapFrom(src => (src.Map!.GestHordesCell ?? src.Map.Cell!).ZoneEmpty))
                .ForMember(dest => dest.Y, opt => opt.MapFrom(src => src.TownDetails.TownY - (src.Map!.GestHordesCell ?? src.Map.Cell!).Y))
                .ForMember(dest => dest.X, opt => opt.MapFrom(src => src.TownDetails.TownX + (src.Map!.GestHordesCell ?? src.Map.Cell!).X))
                .ForMember(dest => dest.Items, opt => opt.MapFrom(src => (src.Map!.GestHordesCell ?? src.Map.Cell!).Objects))
                .ForMember(dest => dest.UserKey, opt => opt.Ignore());

            CreateMap<UpdateRequestDto, GestHordesMajScriptRequest>()
                .ForMember(dest => dest.Key, opt => opt.Ignore())
                .ForMember(dest => dest.X, opt => opt.MapFrom(src => src.TownDetails.TownX + src.Map!.GestHordesCell!.X))
                .ForMember(dest => dest.Y, opt => opt.MapFrom(src => src.TownDetails.TownY - src.Map!.GestHordesCell!.Y))
                .ForMember(dest => dest.FouilleLvl, opt => opt.MapFrom(src => src.Map!.GestHordesCell!.ScavZoneLevel))
                .ForMember(dest => dest.BalisageLvl, opt => opt.MapFrom(src => src.Map!.GestHordesCell!.ScoutZoneLvl))
                .ForMember(dest => dest.EstimationZombie, opt => opt.MapFrom(src => src.Map!.GestHordesCell!.ScoutNextCells))
                .ForMember(dest => dest.RegenerationZone, opt => opt.MapFrom(src => src.Map!.GestHordesCell!.ScavNextCells));

            CreateMap<UpdateRequestDto, GestHordesMajCaseZombiesDto>()
                .ForMember(dest => dest.UserKey, opt => opt.Ignore())
                .ForMember(dest => dest.IdMap, opt => opt.MapFrom(src => src.TownDetails.TownId))
                .ForMember(dest => dest.NbrKill, opt => opt.MapFrom(src => (src.Map!.GestHordesCell ?? src.Map.Cell!).DeadZombies))
                .ForMember(dest => dest.Y, opt => opt.MapFrom(src => src.TownDetails.TownY - (src.Map!.GestHordesCell ?? src.Map.Cell!).Y))
                .ForMember(dest => dest.X, opt => opt.MapFrom(src => src.TownDetails.TownX + (src.Map!.GestHordesCell ?? src.Map.Cell!).X));

            CreateMap<UpdateObjectDto, GestHordesMajCaseItemDto>()
                .ForMember(dest => dest.Type, opt => opt.MapFrom(src => src.IsBroken ? 2 : 1))
                .ForMember(dest => dest.IdObjet, opt => opt.MapFrom(src => src.Id))
                .ForMember(dest => dest.Nombre, opt => opt.MapFrom(src => src.Count));

            CreateMap<HomeUpgradeDetailsDto, GestHordesMajCitizenMaisonDto>()
                .ForMember(dest => dest.Rangement, opt => opt.MapFrom(src => src.Chest))
                .ForMember(dest => dest.Cloture, opt => opt.MapFrom(src => src.Fence))
                .ForMember(dest => dest.Labo, opt => opt.MapFrom(src => src.Lab))
                .ForMember(dest => dest.Renfort, opt => opt.MapFrom(src => src.Defense))
                .ForMember(dest => dest.Cuisine, opt => opt.MapFrom(src => src.Kitchen))
                .ForMember(dest => dest.Cs, opt => opt.MapFrom(src => src.Rest));

            CreateMap<TownCitizen, GestHordesMajCitizenActionsHeroDto>()
                .ForMember(dest => dest.Apag, opt => opt.MapFrom(src => src.Apagcharges))
                .ForMember(dest => dest.CorpsSain, opt => opt.MapFrom(src => src.IsCleanBody))
                .ForMember(dest => dest.DonJH, opt => opt.Ignore())
                .ForMember(dest => dest.Pef, opt => opt.MapFrom(src => src.HasBreakThrough))
                .ForMember(dest => dest.Rdh, opt => opt.MapFrom(src => src.HasHeroicReturn))
                .ForMember(dest => dest.Sauvetage, opt => opt.MapFrom(src => src.HasRescue))
                .ForMember(dest => dest.SecondSouffle, opt => opt.MapFrom(src => src.HasSecondWind))
                .ForMember(dest => dest.Trouvaille, opt => opt.MapFrom(src => src.HasLuckyFind))
                .ForMember(dest => dest.Us, opt => opt.MapFrom(src => src.HasUppercut))
                .ForMember(dest => dest.Vlm, opt => opt.MapFrom(src => src.HasCheatDeath));
        }
    }
}
