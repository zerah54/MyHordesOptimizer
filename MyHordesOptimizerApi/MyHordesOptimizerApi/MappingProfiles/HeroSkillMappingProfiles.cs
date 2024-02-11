using AutoMapper;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Models;
using System.Collections.Generic;

namespace MyHordesOptimizerApi.MappingProfiles
{
    public class HeroSkillMappingProfiles : Profile
    {
        public HeroSkillMappingProfiles()
        {
            CreateMap<HeroSkill, HeroSkillDto>()
                .ForMember(dest => dest.Name, opt => opt.MapFrom(src => src.Name))
                .ForMember(dest => dest.DaysNeeded, opt => opt.MapFrom(src => src.DaysNeeded))
                .ForMember(dest => dest.Icon, opt => opt.MapFrom(src => src.Icon))
                .ForMember(dest => dest.NbUses, opt => opt.MapFrom(src => src.NbUses))
                .ForMember(dest => dest.Description, opt => opt.MapFrom(src => new Dictionary<string, string>() {
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
