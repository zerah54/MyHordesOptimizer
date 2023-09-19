using AutoMapper;
using MyHordesOptimizerApi.Data.CauseOfDeath;
using MyHordesOptimizerApi.Data.Heroes;
using MyHordesOptimizerApi.Data.Items;
using MyHordesOptimizerApi.Data.Wishlist;
using MyHordesOptimizerApi.Models;
using MyHordesOptimizerApi.Models.Wishlist;
using System.Collections.Generic;

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


            CreateMap<MyHordesHerosCapacitiesCodeModel, HeroSkillsModel>()
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

            CreateMap<MyHordesCauseOfDeathModel, CauseOfDeathModel>()
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

            CreateMap<MyHordesCleanUpTypeModel, CleanUpTypeModel>()
                .ForMember(dest => dest.IdType, opt => opt.MapFrom(src => src.Id))
                .ForMember(dest => dest.TypeName, opt => opt.MapFrom(src => src.Name))
                .ForMember(dest => dest.MyHordesApiName, opt => opt.MapFrom(src => src.MyHordesApiName));

            CreateMap<KeyValuePair<string, MyHordesRecipeCodeModel>, RecipeModel>()
                .ForMember(dest => dest.Name, opt => opt.MapFrom(src => src.Key))
                .ForMember(dest => dest.Type, opt => opt.MapFrom(src => src.Value.Type))
                .ForMember(dest => dest.ActionDe, opt => opt.MapFrom(src => src.Value.Action))
                .ForMember(dest => dest.Stealthy, opt => opt.MapFrom(src => src.Value.Stealthy))
                .ForMember(dest => dest.PictoUid, opt => opt.MapFrom(src => src.Value.Picto))
                .ForMember(dest => dest.ActionFr, opt => opt.Ignore())
                .ForMember(dest => dest.ActionEs, opt => opt.Ignore())
                .ForMember(dest => dest.ActionEn, opt => opt.Ignore());


            CreateMap<MyHordesOptimizerWishlistItemCategorie, WishlistCategorieModel>()
                .ForMember(dest => dest.IdCategory, opt => opt.MapFrom(src => src.Id))
                .ForMember(dest => dest.IdUserAuthor, opt => opt.Ignore())
                .ForMember(dest => dest.Name, opt => opt.MapFrom(src => src.Name["fr"]))
                .ForMember(dest => dest.LabelFr, opt => opt.MapFrom(src => src.Name["fr"]))
                .ForMember(dest => dest.LabelEs, opt => opt.MapFrom(src => src.Name["es"]))
                .ForMember(dest => dest.LabelEn, opt => opt.MapFrom(src => src.Name["en"]))
                .ForMember(dest => dest.LabelDe, opt => opt.MapFrom(src => src.Name["de"]));
        }
    }
}
