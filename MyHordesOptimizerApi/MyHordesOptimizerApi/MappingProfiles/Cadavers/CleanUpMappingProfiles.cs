using AutoMapper;
using MyHordesOptimizerApi.Dtos.MyHordes;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Models;

namespace MyHordesOptimizerApi.MappingProfiles.Cadavers
{
    public class CleanUpMappingProfiles : Profile
    {
        public CleanUpMappingProfiles()
        {
            CreateMap<TownCadaverCleanUpType, CleanUpTypeDto>()
                .ForMember(dest => dest.Id, opt => opt.MapFrom(src => src.IdType))
                .ForMember(dest => dest.Name, opt => opt.MapFrom(src => src.TypeName))
                .ForMember(dest => dest.MyHordesApiName, opt => opt.MapFrom(src => src.MyHordesApiName));

            //CleanUp
            CreateMap<TownCadaverCleanUp, CleanUpDto>()
                .ForMember(dest => dest.IdCleanUp, opt => opt.MapFrom(src => src.IdCleanUp))
                .ForMember(dest => dest.CitizenCleanUp, opt => opt.Ignore())
                .ForMember(dest => dest.Type, opt => opt.Ignore());

        }
    }
}
