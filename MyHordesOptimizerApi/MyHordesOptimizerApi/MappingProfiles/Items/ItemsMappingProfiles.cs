using AutoMapper;
using MyHordesOptimizerApi.Dtos.MyHordes.MyHordesOptimizer;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Models;
using System.Collections.Generic;
using System.Linq;

namespace MyHordesOptimizerApi.MappingProfiles.Items
{
    public class ItemsMappingProfiles : Profile
    {
        public ItemsMappingProfiles()
        {
            CreateMap<Item, ItemDto>()
                .ForMember(dest => dest.Actions, opt => opt.MapFrom(src => src.ActionNames.Select(action => action.Name)))
                .ForMember(dest => dest.BankCount, opt => opt.MapFrom((src, dest, srcMember, context) =>
                {
                    if (src.TownBankItems.FirstOrDefault() == null)
                    {
                        return 0;
                    }
                    else
                    {
                        return src.TownBankItems.First().Count;
                    }
                }))
                .ForMember(dest => dest.Category, opt => opt.MapFrom(src => src.IdCategoryNavigation))
                .ForMember(dest => dest.Deco, opt => opt.MapFrom(src => src.Deco))
                .ForMember(dest => dest.Description, opt => opt.MapFrom(src => new Dictionary<string, string>()
                {
                    { "fr", src.DescriptionFr },
                    { "en", src.DescriptionEn },
                    { "es", src.DescriptionEs },
                    { "de", src.DescriptionDe }
                }))
                .ForMember(dest => dest.DropRateNotPraf, opt => opt.MapFrom(src => src.DropRateNotPraf))
                .ForMember(dest => dest.DropRatePraf, opt => opt.MapFrom(src => src.DropRatePraf))
                .ForMember(dest => dest.Guard, opt => opt.MapFrom(src => src.Guard))
                .ForMember(dest => dest.Id, opt => opt.MapFrom(src => src.IdItem))
                .ForMember(dest => dest.Img, opt => opt.MapFrom(src => src.Img))
                .ForMember(dest => dest.IsHeaver, opt => opt.MapFrom(src => src.IsHeaver))
                .ForMember(dest => dest.Label, opt => opt.MapFrom(src => new Dictionary<string, string>()
                {
                    { "fr", src.LabelFr },
                    { "en", src.LabelEn },
                    { "es", src.LabelEs },
                    { "de", src.LabelDe }
                }))
                .ForMember(dest => dest.Properties, opt => opt.MapFrom(src => src.PropertyNames.Select(prop => prop.Name)))
                .ForMember(dest => dest.Recipes, opt => opt.MapFrom(src => src.RecipeItemComponents))
                .ForMember(dest => dest.Uid, opt => opt.MapFrom(src => src.Uid))
                .ForMember(dest => dest.WishListCount, opt => opt.MapFrom((src, dest, srcMember, context) =>
                {
                    if (src.TownWishListItems.FirstOrDefault() == null)
                    {
                        return 0;
                    }
                    else
                    {
                        return src.TownWishListItems.First().Count;
                    }
                }));
        }
    }
}
