using AutoMapper;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Models;

namespace MyHordesOptimizerApi.MappingProfiles.Parameters
{
    public class ParameterMappingProfiles : Profile
    {
        public ParameterMappingProfiles()
        {
            CreateMap<Parameter, ParametersDto>()
              .ReverseMap();
        }
    }
}
