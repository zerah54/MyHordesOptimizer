using AutoMapper;
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
        }
    }
}
