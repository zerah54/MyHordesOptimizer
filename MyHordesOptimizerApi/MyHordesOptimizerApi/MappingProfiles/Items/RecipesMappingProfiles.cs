using AutoMapper;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Models;
using System.Collections.Generic;
using System.Linq;

namespace MyHordesOptimizerApi.MappingProfiles.Items
{
    public class RecipesMappingProfiles : Profile
    {
        public RecipesMappingProfiles()
        {
            CreateMap<RecipeItemComponent, ItemRecipeDto>()
                .ForMember(dest => dest.Actions, opt => opt.MapFrom(src => new Dictionary<string, string>()
                {
                    { "fr", src.RecipeNameNavigation.ActionFr },
                    { "en", src.RecipeNameNavigation.ActionEn },
                    { "es", src.RecipeNameNavigation.ActionEs },
                    { "de", src.RecipeNameNavigation.ActionDe }
                }))
                .ForMember(dest => dest.Components, opt => opt.MapFrom(src => src.RecipeNameNavigation.RecipeItemComponents.Select(ric => ric.IdItemNavigation)))
                .ForMember(dest => dest.Name, opt => opt.MapFrom(src => src.RecipeName))
                .ForMember(dest => dest.Result, opt => opt.MapFrom(src => src.RecipeNameNavigation.RecipeItemResults.Select(ric => ric.IdItemNavigation)))
                .ForMember(dest => dest.Type, opt => opt.MapFrom(src => src.RecipeNameNavigation.Type));
        }
    }
}
