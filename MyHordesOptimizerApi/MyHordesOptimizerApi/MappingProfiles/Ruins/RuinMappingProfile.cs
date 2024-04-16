using AutoMapper;
using MyHordesOptimizerApi.Data.Ruins;
using MyHordesOptimizerApi.Dtos.MyHordes;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Models;
using System.Collections.Generic;

namespace MyHordesOptimizerApi.MappingProfiles.Ruins
{
    public class RuinMappingProfile : Profile
    {
        public RuinMappingProfile()
        {
            CreateMap<Ruin, MyHordesOptimizerRuinDto>()
                 .ForMember(dto => dto.Camping, opt => opt.MapFrom(model => model.Camping))
                 .ForMember(dto => dto.Capacity, opt => opt.MapFrom(model => model.Capacity))
                 .ForMember(dto => dto.Chance, opt => opt.MapFrom(model => model.Chance))
                 .ForMember(dto => dto.Description, opt => opt.MapFrom(model => new Dictionary<string, string>()
                 {
                     { "fr", model.DescriptionFr },
                     { "en", model.DescriptionEn },
                     { "es", model.DescriptionEs },
                     { "de", model.DescriptionDe }
                 }))
                 .ForMember(dto => dto.Drops, opt => opt.MapFrom(model => model.RuinItemDrops)) // Todo
                 .ForMember(dto => dto.Explorable, opt => opt.MapFrom(model => model.Explorable))
                 .ForMember(dto => dto.Id, opt => opt.MapFrom(model => model.IdRuin))
                 .ForMember(dto => dto.Img, opt => opt.MapFrom(model => model.Img))
                 .ForMember(dto => dto.Label, opt => opt.MapFrom(model => new Dictionary<string, string>()
                 {
                     { "fr", model.LabelFr },
                     { "en", model.LabelEn },
                     { "es", model.LabelEs },
                     { "de", model.LabelDe }
                 }))
                 .ForMember(dto => dto.MaxDist, opt => opt.MapFrom(model => model.MaxDist))
                 .ForMember(dto => dto.MinDist, opt => opt.MapFrom(model => model.MinDist));


            CreateMap<KeyValuePair<string, MyHordesRuinCodeModel>, Ruin>()
                .ForMember(dest => dest.Camping, opt => opt.MapFrom(src => src.Value.Camping))
                .ForMember(dest => dest.Capacity, opt => opt.MapFrom(src => src.Value.Capacity))
                .ForMember(dest => dest.Chance, opt => opt.MapFrom(src => src.Value.Chance))
                .ForMember(dest => dest.DescriptionDe, opt => opt.Ignore())
                .ForMember(dest => dest.DescriptionEn, opt => opt.Ignore())
                .ForMember(dest => dest.DescriptionEs, opt => opt.Ignore())
                .ForMember(dest => dest.DescriptionFr, opt => opt.Ignore())
                .ForMember(dest => dest.Explorable, opt => opt.Ignore())
                .ForMember(dest => dest.IdRuin, opt => opt.Ignore())
                .ForMember(dest => dest.Img, opt => opt.MapFrom(src => src.Value.Icon))
                .ForMember(dest => dest.LabelDe, opt => opt.Ignore())
                .ForMember(dest => dest.LabelEn, opt => opt.Ignore())
                .ForMember(dest => dest.LabelEs, opt => opt.Ignore())
                .ForMember(dest => dest.LabelFr, opt => opt.Ignore())
                .ForMember(dest => dest.MapCells, opt => opt.Ignore())
                .ForMember(dest => dest.MaxDist, opt => opt.MapFrom(src => src.Value.MaxDist))
                .ForMember(dest => dest.MinDist, opt => opt.MapFrom(src => src.Value.MinDist))
                .ForMember(dest => dest.RuinItemDrops, opt => opt.Ignore());

            CreateMap<KeyValuePair<string, MyHordesApiRuinDto>, Ruin>()
                .ForMember(dest => dest.Camping, opt => opt.Ignore())
                .ForMember(dest => dest.Capacity, opt => opt.Ignore())
                .ForMember(dest => dest.Chance, opt => opt.Ignore())
                .ForMember(dest => dest.DescriptionDe, opt => opt.MapFrom(src => src.Value.Desc["de"]))
                .ForMember(dest => dest.DescriptionEn, opt => opt.MapFrom(src => src.Value.Desc["en"]))
                .ForMember(dest => dest.DescriptionEs, opt => opt.MapFrom(src => src.Value.Desc["es"]))
                .ForMember(dest => dest.DescriptionFr, opt => opt.MapFrom(src => src.Value.Desc["fr"]))
                .ForMember(dest => dest.Explorable, opt => opt.MapFrom(src => src.Value.Explorable))
                .ForMember(dest => dest.IdRuin, opt => opt.MapFrom(src => src.Value.Id))
                .ForMember(dest => dest.Img, opt => opt.MapFrom(src => GetNameIdFromImg(src.Value.Img)))
                .ForMember(dest => dest.LabelDe, opt => opt.MapFrom(src => src.Value.Name["de"]))
                .ForMember(dest => dest.LabelEn, opt => opt.MapFrom(src => src.Value.Name["en"]))
                .ForMember(dest => dest.LabelEs, opt => opt.MapFrom(src => src.Value.Name["es"]))
                .ForMember(dest => dest.LabelFr, opt => opt.MapFrom(src => src.Value.Name["fr"]))
                .ForMember(dest => dest.MapCells, opt => opt.Ignore())
                .ForMember(dest => dest.MaxDist, opt => opt.Ignore())
                .ForMember(dest => dest.MinDist, opt => opt.Ignore())
                .ForMember(dest => dest.RuinItemDrops, opt => opt.Ignore());
        }


        private object GetNameIdFromImg(string img)
        {
            var sub = img.Substring(img.IndexOf("/") + 1).Split(".")[0];
            return sub.Split(".")[0];
        }
    }
}
