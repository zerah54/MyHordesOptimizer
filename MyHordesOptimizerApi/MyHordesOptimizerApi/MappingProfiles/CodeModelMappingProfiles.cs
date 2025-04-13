using AutoMapper;
using Microsoft.EntityFrameworkCore;
using MyHordesOptimizerApi.Data.Camping;
using MyHordesOptimizerApi.Data.CauseOfDeath;
using MyHordesOptimizerApi.Data.Heroes;
using MyHordesOptimizerApi.Data.Items;
using MyHordesOptimizerApi.Data.Wishlist;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Camping;
using MyHordesOptimizerApi.Extensions;
using MyHordesOptimizerApi.Models;
using System.Collections.Generic;
using System.Linq;

namespace MyHordesOptimizerApi.MappingProfiles
{
    public class CodeModelMappingProfiles : Profile
    {
        public CodeModelMappingProfiles()
        {
            CreateMap<MyHordesCategoryCodeModel, Category>()
                .ForMember(dest => dest.IdCategory, opt => opt.Ignore())
                .ForMember(dest => dest.LabelFr, opt => opt.Ignore())
                .ForMember(dest => dest.LabelDe, opt => opt.MapFrom(src => src.Label))
                .ForMember(dest => dest.LabelEn, opt => opt.Ignore())
                .ForMember(dest => dest.LabelEs, opt => opt.Ignore())
                .ForMember(dest => dest.Ordering, opt => opt.MapFrom(src => src.Ordering))
                .ForMember(dest => dest.Name, opt => opt.MapFrom(src => src.Name));


            CreateMap<MyHordesHerosCapacitiesCodeModel, HeroSkill>()
                .ForMember(dest => dest.Name, opt => opt.MapFrom(src => src.Name))
                .ForMember(dest => dest.DaysNeeded, opt => opt.MapFrom(src => src.DaysNeeded))
                .ForMember(dest => dest.NbUses, opt => opt.Ignore())
                .ForMember(dest => dest.Icon, opt => opt.MapFrom(src => src.Icon))
                .ForMember(dest => dest.LabelDe, opt => opt.MapFrom(src => src.Title))
                .ForMember(dest => dest.LabelFr, opt => opt.Ignore())
                .ForMember(dest => dest.LabelEn, opt => opt.Ignore())
                .ForMember(dest => dest.LabelEs, opt => opt.Ignore())
                .ForMember(dest => dest.DescriptionDe, opt => opt.MapFrom(src => src.Description))
                .ForMember(dest => dest.DescriptionFr, opt => opt.Ignore())
                .ForMember(dest => dest.DescriptionEn, opt => opt.Ignore())
                .ForMember(dest => dest.DescriptionEs, opt => opt.Ignore());

            CreateMap<MyHordesCauseOfDeathModel, CauseOfDeath>()
                .ForMember(dest => dest.Dtype, opt => opt.MapFrom(src => src.Dtype))
                .ForMember(dest => dest.Ref, opt => opt.MapFrom(src => src.Ref))
                .ForMember(dest => dest.Icon, opt => opt.MapFrom(src => src.Icon))
                .ForMember(dest => dest.LabelDe, opt => opt.MapFrom(src => src.Label))
                .ForMember(dest => dest.LabelFr, opt => opt.Ignore())
                .ForMember(dest => dest.LabelEn, opt => opt.Ignore())
                .ForMember(dest => dest.LabelEs, opt => opt.Ignore())
                .ForMember(dest => dest.DescriptionDe, opt => opt.MapFrom(src => src.Description))
                .ForMember(dest => dest.DescriptionFr, opt => opt.Ignore())
                .ForMember(dest => dest.DescriptionEn, opt => opt.Ignore())
                .ForMember(dest => dest.DescriptionEs, opt => opt.Ignore());

            CreateMap<MyHordesCleanUpTypeModel, TownCadaverCleanUpType>()
                .ForMember(dest => dest.IdType, opt => opt.MapFrom(src => src.Id))
                .ForMember(dest => dest.TypeName, opt => opt.MapFrom(src => src.Name))
                .ForMember(dest => dest.MyHordesApiName, opt => opt.MapFrom(src => src.MyHordesApiName));

            CreateMap<KeyValuePair<string, MyHordesRecipeCodeModel>, Recipe>()
                .ForMember(dest => dest.Name, opt => opt.MapFrom(src => src.Key))
                .ForMember(dest => dest.Type, opt => opt.MapFrom(src => src.Value.Type))
                .ForMember(dest => dest.ActionDe, opt => opt.MapFrom(src => src.Value.Action))
                .ForMember(dest => dest.Stealthy, opt => opt.MapFrom(src => src.Value.Stealthy))
                .ForMember(dest => dest.PictoUid, opt => opt.MapFrom(src => src.Value.Picto))
                .ForMember(dest => dest.ActionFr, opt => opt.Ignore())
                .ForMember(dest => dest.ActionEs, opt => opt.Ignore())
                .ForMember(dest => dest.ActionEn, opt => opt.Ignore())
                .ForMember(dest => dest.ProvokingItem, opt => opt.MapFrom((codeModel, recipe, srcMember, context) =>
                {
                    Item provokingItem = null;
                    var provokingUid = codeModel.Value.Provoking;
                    if (!string.IsNullOrEmpty(provokingUid))
                    {
                        var dbContext = context.GetDbContext();
                        provokingItem = dbContext.Items.AsNoTracking()
                        .First(x => x.Uid == provokingUid);
                    }
                    return provokingItem;
                }));


            CreateMap<MyHordesCampingBonusModel, CampingBonusDto>()
                .ForMember(dest => dest.Tomb, opt => opt.MapFrom(src => src.Tomb))
                .ForMember(dest => dest.Pande, opt => opt.MapFrom(src => src.Pande))
                .ForMember(dest => dest.Improve, opt => opt.MapFrom(src => src.Improve))
                .ForMember(dest => dest.ObjectImprove, opt => opt.MapFrom(src => src.ObjectImprove))
                .ForMember(dest => dest.Lighthouse, opt => opt.MapFrom(src => src.Lighthouse))
                .ForMember(dest => dest.CampItems, opt => opt.MapFrom(src => src.CampItems))
                .ForMember(dest => dest.ZombieVest, opt => opt.MapFrom(src => src.ZombieVest))
                .ForMember(dest => dest.ZombieNoVest, opt => opt.MapFrom(src => src.ZombieNoVest))
                .ForMember(dest => dest.Night, opt => opt.MapFrom(src => src.Night))
                .ForMember(dest => dest.Devastated, opt => opt.MapFrom(src => src.Devastated))
                .ForMember(dest => dest.DistChances, opt => opt.MapFrom(src => src.DistChances))
                .ForMember(dest => dest.CrowdChances, opt => opt.MapFrom(src => src.CrowdChances))
                .ForMember(dest => dest.PandaProCamperByAlreadyCamped, opt => opt.MapFrom(src => src.PandaProCamperByAlreadyCamped.Concat(src.CommonByAlreadyCamped)))
                .ForMember(dest => dest.PandaNoProCamperByAlreadyCamped, opt => opt.MapFrom(src => src.PandaNoProCamperByAlreadyCamped.Concat(src.CommonByAlreadyCamped)))
                .ForMember(dest => dest.NormalProCamperByAlreadyCamped, opt => opt.MapFrom(src => src.NormalProCamperByAlreadyCamped.Concat(src.CommonByAlreadyCamped)))
                .ForMember(dest => dest.NormalNoProCamperByAlreadyCamped, opt => opt.MapFrom(src => src.NormalNoProCamperByAlreadyCamped.Concat(src.CommonByAlreadyCamped)))
                .ForMember(dest => dest.DesertBonus, opt => opt.MapFrom(src => src.DesertBonus));

            CreateMap<MyHordesCampingResultModel, CampingResultDto>()
                .ForMember(dest => dest.Probability, opt => opt.MapFrom(src => src.Probability))
                .ForMember(dest => dest.Strict, opt => opt.MapFrom(src => src.Strict));
        }
    }
}
