using AutoMapper;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Extensions.Models;
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
                }))
                // Colonnes nulles tant que l'import n'a pas été rejoué après leur ajout : hors arbre par défaut.
                .ForMember(dest => dest.Legacy, opt => opt.MapFrom(src => src.Legacy ?? false))
                .ForMember(dest => dest.GroupSort, opt => opt.MapFrom(src => src.GroupSort))
                .ForMember(dest => dest.Level, opt => opt.MapFrom(src => src.Level))
                // Null hors de l'arbre. AllowNull : sans lui, AutoMapper change une collection nulle en collection vide.
                // Une traduction absente retombe sur l'allemand, comme à l'import.
                .ForMember(dest => dest.Group, opt =>
                {
                    opt.AllowNull();
                    opt.MapFrom(src => src.GroupDe == null ? null : new Dictionary<string, string>() {
                        { "fr", src.GroupFr ?? src.GroupDe },
                        { "en", src.GroupEn ?? src.GroupDe },
                        { "es", src.GroupEs ?? src.GroupDe },
                        { "de", src.GroupDe }
                    });
                })
                .ForMember(dest => dest.Bullets, opt => opt.MapFrom(src => new Dictionary<string, List<string>>() {
                    { "fr", HeroSkillBullets.Deserialize(src.BulletsFr) },
                    { "en", HeroSkillBullets.Deserialize(src.BulletsEn) },
                    { "es", HeroSkillBullets.Deserialize(src.BulletsEs) },
                    { "de", HeroSkillBullets.Deserialize(src.BulletsDe) }
                }));
        }
    }
}
