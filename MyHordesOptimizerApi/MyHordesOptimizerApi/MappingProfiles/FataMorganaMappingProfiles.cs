using AutoMapper;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.FataMorgana;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.Map;

namespace MyHordesOptimizerApi.MappingProfiles
{
    public class FataMorganaMappingProfiles : Profile
    {
        public FataMorganaMappingProfiles()
        {
            CreateMap<UpdateRequestDto, FataMorganaUpdateRequestDto>()
                .ForMember(dest => dest.AccessKey, opt => opt.Ignore())
                .ForMember(dest => dest.Items, opt => opt.MapFrom(src => src.Map.Cell.Objects))
                .ForMember(dest => dest.MapId, opt => opt.MapFrom(src => src.TownDetails.TownId))
                .ForMember(dest => dest.NbrKill, opt => opt.MapFrom(src => src.Map.Cell.DeadZombies))
                .ForMember(dest => dest.NbrZombie, opt => opt.MapFrom(src => src.Map.Cell.Zombies))
                .ForMember(dest => dest.PlayerList, opt => opt.MapFrom(src => src.Map.Cell.CitizenId))
                .ForMember(dest => dest.ScavRadar, opt => opt.MapFrom(src => src.Map.Cell.ScavNextCells))
                .ForMember(dest => dest.ScoutRadar, opt => opt.MapFrom(src => src.Map.Cell.ScoutNextCells))
                // FataMorgana attend une valeur de 1 à 3. Le niveau 0 du jeu signifie
                // « zone épuisée » et est transmis via zoneDepleted.
                .ForMember(dest => dest.ScavZoneStatus, opt => opt.MapFrom(src =>
                    src.Map != null && src.Map.Cell != null && src.Map.Cell.ScavZoneLevel.HasValue && src.Map.Cell.ScavZoneLevel.Value > 0
                        ? src.Map.Cell.ScavZoneLevel
                        : null))
                .ForMember(dest => dest.UserId, opt => opt.Ignore())
                .ForMember(dest => dest.UserKey, opt => opt.Ignore())
                .ForMember(dest => dest.X, opt => opt.MapFrom(src => src.Map.Cell.X))
                .ForMember(dest => dest.Y, opt => opt.MapFrom(src => src.Map.Cell.Y))
                .ForMember(dest => dest.ZoneDepleted, opt => opt.MapFrom(src =>
                    src.Map != null && src.Map.Cell != null && src.Map.Cell.ScavZoneLevel.HasValue && src.Map.Cell.ScavZoneLevel.Value == 0
                        ? true
                        : src.Map.Cell.ZoneEmpty));

            CreateMap<ScavNextCellsDto, FataMorganaScavRadarDto>()
                .ForMember(dest => dest.East, opt => opt.MapFrom(src => src.East))
                .ForMember(dest => dest.North, opt => opt.MapFrom(src => src.North))
                .ForMember(dest => dest.South, opt => opt.MapFrom(src => src.South))
                .ForMember(dest => dest.West, opt => opt.MapFrom(src => src.West));

            CreateMap<ScoutNextCellsDto, FataMorganaScoutRadarDto>()
                .ForMember(dest => dest.East, opt => opt.MapFrom(src => src.East))
                .ForMember(dest => dest.North, opt => opt.MapFrom(src => src.North))
                .ForMember(dest => dest.South, opt => opt.MapFrom(src => src.South))
                .ForMember(dest => dest.West, opt => opt.MapFrom(src => src.West));
        }
    }
}
