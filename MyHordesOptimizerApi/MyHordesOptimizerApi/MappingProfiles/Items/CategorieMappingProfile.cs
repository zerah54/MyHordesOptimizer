using AutoMapper;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Models;
using System.Collections.Generic;

namespace MyHordesOptimizerApi.MappingProfiles.Items
{
    public class CategorieMappingProfile : Profile
    {
        public CategorieMappingProfile() 
        {
            CreateMap<Category, CategoryDto>()
                .ForMember(dest => dest.IdCategory, opt => opt.MapFrom(src => src.IdCategory))
                .ForMember(dest => dest.Label, opt => opt.MapFrom(src => new Dictionary<string, string>()
                {
                    { "fr", src.LabelFr },
                    { "en", src.LabelEn },
                    { "es", src.LabelEs },
                    { "de", src.LabelDe }
                }))
                .ForMember(dest => dest.Name, opt => opt.MapFrom(src => src.LabelEn))
                .ForMember(dest => dest.Ordering, opt => opt.MapFrom(src => src.Ordering));
        }
    }
}
