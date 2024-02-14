using AutoMapper;
using MyHordesOptimizerApi.Dtos.MyHordes.MyHordesOptimizer;
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
                .ForMember(dest => dest.Result, opt => opt.MapFrom((src, dest, srcMember, context) =>
                {
                    var results = new List<ItemResultDto>();
                    foreach (var rir in src.RecipeNameNavigation.RecipeItemResults)
                    {
                        var item = context.Mapper.Map<ItemWithoutRecipeDto>(rir.IdItemNavigation);
                        results.Add(new ItemResultDto()
                        {
                            Item = item,
                            Probability = rir.Probability,
                            Weight = rir.Weight.GetValueOrDefault()
                        });
                    }
                    return results;
                }))
                .ForMember(dest => dest.Type, opt => opt.MapFrom<string>(src => src.RecipeNameNavigation.Type));
        }
    }
}
