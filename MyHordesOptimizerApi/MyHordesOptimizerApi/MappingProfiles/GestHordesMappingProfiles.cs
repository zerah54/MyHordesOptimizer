using AutoMapper;
using MyHordesOptimizerApi.Dtos.ExternalTools.GestHordes;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools;

namespace MyHordesOptimizerApi.MappingProfiles
{
    public class GestHordesMappingProfiles : Profile
    {
        public GestHordesMappingProfiles()
        {
            CreateMap<UpdateCellInfoDto, GestHordesUpdateCaseRequest>()
                .ForMember(dest => dest.NbrZombie, opt => opt.MapFrom(src => src.Zombies))
                .ForMember(dest => dest.IdMap, opt => opt.MapFrom(src => src.TownId))
                .ForMember(dest => dest.Epuise, opt => opt.MapFrom(src => src.ZoneEmpty))
                .ForMember(dest => dest.Y, opt => opt.MapFrom(src => src.TownY - src.Y))
                .ForMember(dest => dest.X, opt => opt.MapFrom(src => src.TownX + src.X));
        }
    }
}
