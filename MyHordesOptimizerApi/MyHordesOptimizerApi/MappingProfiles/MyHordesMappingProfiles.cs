using AutoMapper;
using MyHordesOptimizerApi.Dtos.MyHordes;
using MyHordesOptimizerApi.Dtos.MyHordes.MyHordesOptimizer;
using System.Collections.Generic;

namespace MyHordesOptimizerApi.MappingProfiles
{
    public class MyHordesMappingProfiles : Profile
    {
        public MyHordesMappingProfiles()
        {
            CreateMap<KeyValuePair<string, MyHordesItem>, Item>()
                .ForMember(dest => dest.IdName, opt => opt.MapFrom(src => src.Key))
                .ForMember(dest => dest.Img, opt => opt.MapFrom(src => src.Value.Img))
                .ForMember(dest => dest.Labels, opt => opt.MapFrom(src => src.Value.Name));
        }
    }
}
