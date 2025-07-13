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
            CreateMap<Recipe, ItemRecipeDto>()
                 .ForMember(dest => dest.Actions, opt => opt.MapFrom(src => new Dictionary<string, string>()
                {
                    { "fr", src.ActionFr },
                    { "en", src.ActionEn },
                    { "es", src.ActionEs },
                    { "de", src.ActionDe }
                }))
                .ForMember(dest => dest.Components, opt => opt.MapFrom((src, dest, srcMember, context) => src.RecipeItemComponents.Select(ric => new ItemComponentRecipeDto
                {
                    Item = context.Mapper.Map<ItemWithoutRecipeDto>(ric.IdItemNavigation),
                    Count = ric.Count ?? 0
                })))
                .ForMember(dest => dest.Name, opt => opt.MapFrom(src => src.Name))
                .ForMember(dest => dest.Result, opt => opt.MapFrom((src, dest, srcMember, context) =>
                {
                    var results = new List<ItemResultDto>();
                    foreach (var rir in src.RecipeItemResults)
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
                .ForMember(dest => dest.Type, opt => opt.MapFrom<string>(src => src.Type));
        }
    }
}
