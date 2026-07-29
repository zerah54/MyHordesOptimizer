using AutoMapper;
using MyHordesOptimizerApi.Dtos.MyHordes.Items;
using MyHordesOptimizerApi.Dtos.MyHordes.MyHordesOptimizer;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.Bags;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Map;
using MyHordesOptimizerApi.MappingProfiles.Converters;
using MyHordesOptimizerApi.Models;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;

namespace MyHordesOptimizerApi.MappingProfiles.Items
{
    public class ItemsMappingProfiles : Profile
    {
        public ItemsMappingProfiles()
        {
            CreateMap<Item, ItemWithoutRecipeDto>()
                .ForMember(dest => dest.Actions, opt => opt.MapFrom(src => src.ActionNames.Select(action => action.Name)))
                .ForMember(dest => dest.BankCount, opt => opt.MapFrom((src, dest, srcMember, context) =>
                {
                    if (src.TownBankItems.FirstOrDefault() == null)
                    {
                        return 0;
                    }
                    else
                    {
                        // On compte le nombre d'item total (cassé et pas cassé) pour la dernière maj de la banque
                        var max = src.TownBankItems.GroupBy(tbi => tbi.IdLastUpdateInfo)            
                        .OrderByDescending(g => g.Key)
                        .First()
                        .Key;
                        var count = src.TownBankItems.Where(tbi => tbi.IdItem == src.IdItem && tbi.IdLastUpdateInfo == max).Sum(tbi => tbi.Count);
                        return count;
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
                .ForMember(dest => dest.ImgBroken, opt => opt.MapFrom(src => src.ImgBroken))
                .ForMember(dest => dest.IsHeaver, opt => opt.MapFrom(src => src.IsHeaver))
                .ForMember(dest => dest.Label, opt => opt.MapFrom(src => new Dictionary<string, string>()
                {
                    { "fr", src.LabelFr },
                    { "en", src.LabelEn },
                    { "es", src.LabelEs },
                    { "de", src.LabelDe }
                }))
                .ForMember(dest => dest.Properties, opt => opt.MapFrom(src => src.PropertyNames.Select(prop => prop.Name)))
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
                }))
                .Include<Item, ItemDto>();

            CreateMap<Item, ItemDto>()
                // Les recettes à erreur forcée n'assemblent jamais rien : elles ne sont pas
                // exposées. La garde sur la navigation préserve le comportement des requêtes
                // qui ne l'incluent pas.
                .ForMember(dest => dest.Recipes, opt => opt.MapFrom(src => src.RecipeItemComponents
                    .Where(ric => ric.RecipeNameNavigation == null || ric.RecipeNameNavigation.ForcedErrorMessage == null)
                    .Select(ric => ric.RecipeNameNavigation)));

            CreateMap<TownBankItem, StackableItemDto>()
                .ForMember(dest => dest.Count, opt => opt.MapFrom(src => src.Count))
                .ForMember(dest => dest.IsBroken, opt => opt.MapFrom(src => src.IsBroken))
                .ForMember(dest => dest.Item, opt => opt.MapFrom(src => src.IdItemNavigation))
                .ForMember(dest => dest.WishListCount, opt => opt.MapFrom(src => src.IdItemNavigation.TownWishListItems.Count));

            CreateMap<BagItem, StackableItemDto>()
               .ForMember(dest => dest.Count, opt => opt.MapFrom(src => src.Count))
               .ForMember(dest => dest.IsBroken, opt => opt.MapFrom(src => src.IsBroken))
               .ForMember(dest => dest.Item, opt => opt.MapFrom(src => src.IdItemNavigation))
               .ForMember(dest => dest.WishListCount, opt => opt.Ignore());

            CreateMap<RuinItemDrop, ItemResultDto>()
                .ForMember(dest => dest.Item, opt => opt.MapFrom(src => src.IdItemNavigation))
                .ForMember(dest => dest.Probability, opt => opt.MapFrom(src => src.Probability))
                .ForMember(dest => dest.Weight, opt => opt.MapFrom(src => src.Weight));

            CreateMap<MapCellItem, UpdateObjectDto>()
                .ForMember(dto => dto.IsBroken, opt => opt.MapFrom(src => src.IsBroken))
                .ForMember(dto => dto.Count, opt => opt.MapFrom(src => src.Count))
                .ForMember(dto => dto.Id, opt => opt.MapFrom(src => src.IdItem))
                .ReverseMap()
                .ForMember(dest => dest.IdCell, opt => opt.Ignore())
                .ForMember(dest => dest.IdItem, opt => opt.MapFrom(src => src.Id))
                .ForMember(dest => dest.Count, opt => opt.MapFrom(src => src.Count))
                .ForMember(dest => dest.IsBroken, opt => opt.MapFrom(src => src.IsBroken));

            CreateMap<KeyValuePair<string, MyHordesItem>, Item>()
                .ForMember(dest => dest.ActionNames, opt => opt.Ignore())
                .ForMember(dest => dest.BagItems, opt => opt.Ignore())
                .ForMember(dest => dest.Deco, opt => opt.MapFrom(src => src.Value.Deco))
                .ForMember(dest => dest.DefaultWishlistItems, opt => opt.Ignore())
                .ForMember(dest => dest.DescriptionDe, opt => opt.MapFrom(src => src.Value.Description["de"]))
                .ForMember(dest => dest.DescriptionEn, opt => opt.MapFrom(src => src.Value.Description["en"]))
                .ForMember(dest => dest.DescriptionEs, opt => opt.MapFrom(src => src.Value.Description["es"]))
                .ForMember(dest => dest.DescriptionFr, opt => opt.MapFrom(src => src.Value.Description["fr"]))
                .ForMember(dest => dest.DropRateNotPraf, opt => opt.Ignore())
                .ForMember(dest => dest.DropRatePraf, opt => opt.Ignore())
                .ForMember(dest => dest.Guard, opt => opt.MapFrom(src => src.Value.Guard))
                .ForMember(dest => dest.IdCategories, opt => opt.Ignore())
                .ForMember(dest => dest.IdCategory, opt => opt.ConvertUsing<DeutchNameToCategoryIdConverter, string>(src => src.Value.Category["de"]))
                .ForMember(dest => dest.IdCategoryNavigation, opt => opt.Ignore())
                // La clé appartient à MHO et n'est PAS celle de MyHordes : celle-ci n'est qu'un
                // auto-incrément de fixtures, instable d'une instance du jeu à l'autre. Le service
                // d'import l'attribue après rapprochement sur le uid.
                .ForMember(dest => dest.IdItem, opt => opt.Ignore())
                // .Value volontairement explicite : si un jour l'appelant cesse de filtrer les
                // objets sans id, on veut une exception bruyante plutôt qu'un mhId à 0.
                .ForMember(dest => dest.MhId, opt => opt.MapFrom(src => src.Value.Id.Value))
                .ForMember(dest => dest.IsObsolete, opt => opt.Ignore())
                .ForMember(dest => dest.Img, opt => opt.MapFrom(src => SansEmpreinte(src.Value.Img)))
                // MyHordes n'émet `img_b` que s'il DIFFÈRE de `img`. Son absence signifie donc
                // « pas d'icône cassée propre », et non « non transmis » : on écrit null, sans
                // jamais recopier `Img`. Replier ici détruirait l'information, et c'est au rendu
                // de décider — le jeu lui-même n'utilise l'icône cassée que dans son infobulle
                // de détail, et garde l'icône normale dans ses listes.
                .ForMember(dest => dest.ImgBroken, opt => opt.MapFrom(src => SansEmpreinte(src.Value.ImgBroken)))
                .ForMember(dest => dest.IsHeaver, opt => opt.MapFrom(src => src.Value.Heavy))
                .ForMember(dest => dest.LabelDe, opt => opt.MapFrom(src => src.Value.Label["de"]))
                .ForMember(dest => dest.LabelEn, opt => opt.MapFrom(src => src.Value.Label["en"]))
                .ForMember(dest => dest.LabelEs, opt => opt.MapFrom(src => src.Value.Label["es"]))
                .ForMember(dest => dest.LabelFr, opt => opt.MapFrom(src => src.Value.Label["fr"]))
                .ForMember(dest => dest.MapCellItems, opt => opt.Ignore())
                .ForMember(dest => dest.PropertyNames, opt => opt.Ignore())
                .ForMember(dest => dest.RecipeItemComponents, opt => opt.Ignore())
                .ForMember(dest => dest.RecipeItemResults, opt => opt.Ignore())
                .ForMember(dest => dest.RuinItemDrops, opt => opt.Ignore())
                .ForMember(dest => dest.TownBankItems, opt => opt.Ignore())
                .ForMember(dest => dest.TownWishListItems, opt => opt.Ignore())
                .ForMember(dest => dest.Uid, opt => opt.MapFrom(src => src.Key));
        }

        /// <summary>
        /// Ramène un chemin d'image MyHordes à sa forme stable en retirant l'empreinte de version :
        /// <c>item/item_lawn.b5d3807d.gif</c> devient <c>item/item_lawn.gif</c>.
        /// </summary>
        /// <remarks>
        /// Le quantificateur gourmand fait que la même expression convient à l'icône cassée, dont
        /// le nom porte un point de plus : <c>item/item_lawn.b.b5d3807d.gif</c> devient
        /// <c>item/item_lawn.b.gif</c>. Le null est rendu tel quel — il porte une information.
        /// </remarks>
        private static string SansEmpreinte(string chemin)
        {
            return chemin == null ? null : Regex.Replace(chemin, @"(.*)\.(.*)\.(.*)", "$1.$3");
        }
    }
}
