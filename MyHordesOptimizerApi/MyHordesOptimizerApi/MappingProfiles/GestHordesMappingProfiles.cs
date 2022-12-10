using AutoMapper;
using MyHordesOptimizerApi.Dtos.ExternalTools.GestHordes;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools;

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
        }
    }
}
