using AutoMapper;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Models;
using System.Collections.Generic;

namespace MyHordesOptimizerApi.MappingProfiles.Cadavers
{
    public class CauseOfDeathProfiles : Profile
    {
        public CauseOfDeathProfiles()
        {
            CreateMap<CauseOfDeath, CauseOfDeathDto>()
                .ForMember(dest => dest.Dtype, opt => opt.MapFrom(src => src.Dtype))
                .ForMember(dest => dest.Ref, opt => opt.MapFrom(src => src.Ref))
                .ForMember(dest => dest.Icon, opt => opt.MapFrom(src => src.Icon))
                .ForMember(dest => dest.Description, opt => opt.MapFrom(src => new Dictionary<string, string>() 
                { 
                    { "fr", src.DescriptionFr }, 
                    { "en", src.DescriptionEn },
                    { "es", src.DescriptionEs }, 
                    { "de", src.DescriptionDe } 
                }))
                .ForMember(dest => dest.Label, opt => opt.MapFrom(src => new Dictionary<string, string>() { 
                    { "fr", src.LabelFr },
                    { "en", src.LabelEn }, 
                    { "es", src.LabelEs }, 
                    { "de", src.LabelDe } 
                }));

        }
    }
}
