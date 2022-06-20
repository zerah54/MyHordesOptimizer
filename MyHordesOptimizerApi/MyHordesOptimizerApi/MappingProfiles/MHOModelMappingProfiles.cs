using AutoMapper;
using MyHordesOptimizerApi.Dtos.MyHordes.Items;
using MyHordesOptimizerApi.Dtos.MyHordes.MyHordesOptimizer;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.MappingProfiles.Converters;
using MyHordesOptimizerApi.Models;
using MyHordesOptimizerApi.Models.Views.Items;
using MyHordesOptimizerApi.Models.Views.Recipes;
using MyHordesOptimizerApi.Models.Views.Ruins;
using System.Collections.Generic;
using System.Text.RegularExpressions;

namespace MyHordesOptimizerApi.MappingProfiles
{
    public class MHOModelMappingProfiles : Profile
    {
        public MHOModelMappingProfiles()
        {
            // Items
            CreateMap<KeyValuePair<string, MyHordesItem>, ItemModel>()
                .ForMember(dest => dest.Uid, opt => opt.MapFrom(src => src.Key))
                .ForMember(dest => dest.Img, opt => opt.MapFrom(src => RemoveRandomNumber(src.Value.Img)))
                .ForMember(dest => dest.LabelFr, opt => opt.MapFrom(src => src.Value.Label["fr"]))
                .ForMember(dest => dest.LabelEn, opt => opt.MapFrom(src => src.Value.Label["en"]))
                .ForMember(dest => dest.LabelEs, opt => opt.MapFrom(src => src.Value.Label["es"]))
                .ForMember(dest => dest.LabelDe, opt => opt.MapFrom(src => src.Value.Label["de"]))
                .ForMember(dest => dest.IdCategory, opt => opt.ConvertUsing<DeutchNameToCategoryIdConverter, string>(src => src.Value.Category["de"]))
                .ForMember(dest => dest.DescriptionFr, opt => opt.MapFrom(src => src.Value.Description["fr"]))
                .ForMember(dest => dest.DescriptionEn, opt => opt.MapFrom(src => src.Value.Description["en"]))
                .ForMember(dest => dest.DescriptionEs, opt => opt.MapFrom(src => src.Value.Description["es"]))
                .ForMember(dest => dest.DescriptionDe, opt => opt.MapFrom(src => src.Value.Description["de"]))
                .ForMember(dest => dest.Deco, opt => opt.MapFrom(src => src.Value.Deco))
                .ForMember(dest => dest.Guard, opt => opt.MapFrom(src => src.Value.Guard))
                .ForMember(dest => dest.IsHeaver, opt => opt.MapFrom(src => src.Value.Heavy))
                .ForMember(dest => dest.IdItem, opt => opt.MapFrom(src => src.Value.Id));

            CreateMap<ItemCompletModel, Item>()
                .ForMember(dest => dest.Id, opt => opt.MapFrom(src => src.IdItem))
                .ForMember(dest => dest.Img, opt => opt.MapFrom(src => src.ItemImg))
                .ForMember(dest => dest.Actions, opt => opt.Ignore())
                .ForMember(dest => dest.Properties, opt => opt.Ignore())
                .ForMember(dest => dest.BankCount, opt => opt.Ignore())
                .ForMember(dest => dest.Category, opt => opt.MapFrom(src => new Category() { IdCategory = src.IdCategory, Name = src.CatName, Ordering = src.CatOrdering, Label = new Dictionary<string, string>() { { "fr", src.CatLabelFr }, { "en", src.CatLabelEn }, { "es", src.CatLabelEs }, { "de", src.CatLabelDe } } }))
                .ForMember(dest => dest.Description, opt => opt.MapFrom(src => new Dictionary<string, string>() { { "fr", src.ItemDescriptionFr }, { "en", src.ItemDescriptionEn }, { "es", src.ItemDescriptionEs }, { "de", src.ItemDescriptionDe } }))
                .ForMember(dest => dest.Label, opt => opt.MapFrom(src => new Dictionary<string, string>() { { "fr", src.ItemLabelFr }, { "en", src.ItemLabelEn }, { "es", src.ItemLabelEs }, { "de", src.ItemLabelDe } }))
                .ForMember(dest => dest.WishListCount, opt => opt.Ignore())
                .ForMember(dest => dest.Recipes, opt => opt.Ignore())
                .ForMember(dest => dest.Deco, opt => opt.MapFrom(src => src.ItemDeco))
                .ForMember(dest => dest.Guard, opt => opt.MapFrom(src => src.ItemGuard))
                .ForMember(dest => dest.IsHeaver, opt => opt.MapFrom(src => src.ItemIsHeaver))
                .ForMember(dest => dest.Uid, opt => opt.MapFrom(src => src.ItemUid));

            // Ruins
            CreateMap<MyHordesOptimizerRuin, RuinModel>()
                .ForMember(dest => dest.IdRuin, opt => opt.MapFrom(src => src.Id))
                .ForMember(dest => dest.LabelFr, opt => opt.MapFrom(src => src.Label["fr"]))
                .ForMember(dest => dest.LabelEn, opt => opt.MapFrom(src => src.Label["en"]))
                .ForMember(dest => dest.LabelEs, opt => opt.MapFrom(src => src.Label["es"]))
                .ForMember(dest => dest.LabelDe, opt => opt.MapFrom(src => src.Label["de"]))
                .ForMember(dest => dest.DescriptionFr, opt => opt.MapFrom(src => src.Description["fr"]))
                .ForMember(dest => dest.DescriptionEn, opt => opt.MapFrom(src => src.Description["en"]))
                .ForMember(dest => dest.DescriptionEs, opt => opt.MapFrom(src => src.Description["es"]))
                .ForMember(dest => dest.DescriptionDe, opt => opt.MapFrom(src => src.Description["de"]))
                .ForMember(dest => dest.Img, opt => opt.MapFrom(src => src.Img))
                .ForMember(dest => dest.Camping, opt => opt.MapFrom(src => src.Camping))
                .ForMember(dest => dest.MaxDist, opt => opt.MapFrom(src => src.MaxDist))
                .ForMember(dest => dest.MinDist, opt => opt.MapFrom(src => src.MinDist))
                .ForMember(dest => dest.Explorable, opt => opt.MapFrom(src => src.Explorable));

            CreateMap<RuinCompletModel, MyHordesOptimizerRuin>()
                .ForMember(dest => dest.Chance, opt => opt.MapFrom(src => src.RuinChance))
                .ForMember(dest => dest.Camping, opt => opt.MapFrom(src => src.RuinCamping))
                .ForMember(dest => dest.Description, opt => opt.MapFrom(src => new Dictionary<string, string>() { { "fr", src.RuinDescriptionFr }, { "en", src.RuinDescriptionEn }, { "es", src.RuinDescriptionEs }, { "de", src.RuinDescriptionDe } }))
                .ForMember(dest => dest.Label, opt => opt.MapFrom(src => new Dictionary<string, string>() { { "fr", src.RuinLabelFr }, { "en", src.RuinLabelEn }, { "es", src.RuinLabelEs }, { "de", src.RuinLabelDe } }))
                .ForMember(dest => dest.MaxDist, opt => opt.MapFrom(src => src.RuinMaxDist))
                .ForMember(dest => dest.MinDist, opt => opt.MapFrom(src => src.RuinMinDist))
                .ForMember(dest => dest.Id, opt => opt.MapFrom(src => src.IdRuin))
                .ForMember(dest => dest.Explorable, opt => opt.MapFrom(src => src.RuinExplorable))
                .ForMember(dest => dest.Img, opt => opt.MapFrom(src => src.RuinImg))
                .ForMember(dest => dest.Drops, opt => opt.Ignore());

            //HeroSkills
            CreateMap<HeroSkillsModel, HeroSkill>()
                .ForMember(dest => dest.Name, opt => opt.MapFrom(src => src.Name))
                .ForMember(dest => dest.DaysNeeded, opt => opt.MapFrom(src => src.DaysNeeded))
                .ForMember(dest => dest.Icon, opt => opt.MapFrom(src => src.Icon))
                .ForMember(dest => dest.NbUses, opt => opt.MapFrom(src => src.NbUses))
                .ForMember(dest => dest.Description, opt => opt.MapFrom(src => new Dictionary<string, string>() { { "fr", src.DescriptionFr }, { "en", src.DescriptionEn }, { "es", src.DescriptionEs }, { "de", src.DescriptionDe } }))
                .ForMember(dest => dest.Label, opt => opt.MapFrom(src => new Dictionary<string, string>() { { "fr", src.LabelFr }, { "en", src.LabelEn }, { "es", src.LabelEs }, { "de", src.LabelDe } }));

            //Recipes
            CreateMap<RecipeCompletModel, ItemRecipe>()
                .ForMember(dest => dest.Name, opt => opt.MapFrom(src => src.RecipeName))
                .ForMember(dest => dest.Type, opt => opt.MapFrom(src => src.Type))
                .ForMember(dest => dest.Actions, opt => opt.MapFrom(src => new Dictionary<string, string>() { { "fr", src.ActionFr }, { "en", src.ActionEn }, { "es", src.ActionEs }, { "de", src.ActionDe } }))
                .ForMember(dest => dest.Components, opt => opt.Ignore())
                .ForMember(dest => dest.Result, opt => opt.Ignore());
        }

        private string RemoveRandomNumber(string img)
        {
            var replaced = Regex.Replace(img, @"(.*)\.(.*)\.(.*)", "$1.$3");
            return replaced;
        }
    }
}
