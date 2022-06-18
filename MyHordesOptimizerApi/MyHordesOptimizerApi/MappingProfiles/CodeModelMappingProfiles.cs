using AutoMapper;
using MyHordesOptimizerApi.Data.Items;
using MyHordesOptimizerApi.Models;

namespace MyHordesOptimizerApi.MappingProfiles
{
    public class CodeModelMappingProfiles : Profile
    {
        public CodeModelMappingProfiles()
        {
            CreateMap<MyHordesCategoryCodeModel, CategoryModel>()
                .ForMember(dest => dest.IdCategory, opt => opt.Ignore())
                .ForMember(dest => dest.LabelFr, opt => opt.Ignore())
                .ForMember(dest => dest.LabelDe, opt => opt.MapFrom(src => src.Label))
                .ForMember(dest => dest.LabelEn, opt => opt.Ignore())
                .ForMember(dest => dest.LabelEs, opt => opt.Ignore())
                .ForMember(dest => dest.Ordering, opt => opt.MapFrom(src => src.Ordering))
                .ForMember(dest => dest.Name, opt => opt.MapFrom(src => src.Name));
        }
    }
}
