using AutoMapper;
using MyHordesOptimizerApi.Dtos.MyHordes.Items;
using MyHordesOptimizerApi.Dtos.MyHordes.MyHordesOptimizer;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.MappingProfiles.Converters;
using MyHordesOptimizerApi.Models;
using MyHordesOptimizerApi.Models.Views.Items;
using System.Collections.Generic;
using System.Text.RegularExpressions;

namespace MyHordesOptimizerApi.MappingProfiles
{
    public class MyHordesOptimizerModelMapping : Profile
    {
        public MyHordesOptimizerModelMapping()
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
        }

        private string RemoveRandomNumber(string img)
        {
            var replaced = Regex.Replace(img, @"(.*)\.(.*)\.(.*)", "$1.$3");
            return replaced;
        }
    }
}
