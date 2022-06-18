using AutoMapper;
using MyHordesOptimizerApi.Dtos.MyHordes.Items;
using MyHordesOptimizerApi.MappingProfiles.Converters;
using MyHordesOptimizerApi.Models;
using System.Collections.Generic;
using System.Text.RegularExpressions;

namespace MyHordesOptimizerApi.MappingProfiles
{
    public class MyHordesOptimizerModelMapping : Profile
    {
        public MyHordesOptimizerModelMapping()
        {
            CreateMap<KeyValuePair<string, MyHordesItem>, ItemModel>()
                .ForMember(dest => dest.Uid, opt => opt.MapFrom(src => src.Key))
                .ForMember(dest => dest.Img, opt => opt.MapFrom(src => RemoveRandomNumber(src.Value.Img)))
                .ForMember(dest => dest.LabelFr, opt => opt.MapFrom(src => src.Value.Label["fr"]))
                .ForMember(dest => dest.LabelEn, opt => opt.MapFrom(src => src.Value.Label["en"]))
                .ForMember(dest => dest.LabelEs, opt => opt.MapFrom(src => src.Value.Label["es"]))
                .ForMember(dest => dest.LabelDe, opt => opt.MapFrom(src => src.Value.Label["de"]))
                .ForMember(dest => dest.IdCategory, opt => opt.ConvertUsing<DeutchNameToCategoryIdConverter, string>(src => src.Value.Category["de"]))
                .ForMember(dest => dest.DescriptionFr, opt => opt.MapFrom(src => src.Value.Description["fr"]))
                .ForMember(dest => dest.DescriptionEn, opt => opt.MapFrom(src => src.Value.Description["en"]))
                .ForMember(dest => dest.DescriptionEs, opt => opt.MapFrom(src => src.Value.Description["es"]))
                .ForMember(dest => dest.DescriptionDe, opt => opt.MapFrom(src => src.Value.Description["de"]))
                .ForMember(dest => dest.Deco, opt => opt.MapFrom(src => src.Value.Deco))
                .ForMember(dest => dest.Guard, opt => opt.MapFrom(src => src.Value.Guard))
                .ForMember(dest => dest.IsHeaver, opt => opt.MapFrom(src => src.Value.Heavy))
                .ForMember(dest => dest.IdItem, opt => opt.MapFrom(src => src.Value.Id));
        }

        private string RemoveRandomNumber(string img)
        {
            var replaced = Regex.Replace(img, @"(.*)\.(.*)\.(.*)", "$1.$3");
            return replaced;
        }
    }
}
