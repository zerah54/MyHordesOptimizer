using AutoMapper;
using MyHordesOptimizerApi.Data.Wishlist;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.WishList;
using MyHordesOptimizerApi.Extensions;
using MyHordesOptimizerApi.Models;
using System.Collections.Generic;
using System.Linq;

namespace MyHordesOptimizerApi.MappingProfiles.Wishlists
{
    public class WishListMappingProfile : Profile
    {
        public WishListMappingProfile()
        {
            CreateMap<MyHordesOptimizerWishlistItemCategorie, WishlistCategorie>()
                .ForMember(dest => dest.IdCategory, opt => opt.MapFrom(src => src.Id))
                .ForMember(dest => dest.IdUserAuthor, opt => opt.Ignore())
                .ForMember(dest => dest.IdItems, opt => opt.MapFrom(src => src.Items))
                .ForMember(dest => dest.Name, opt => opt.MapFrom(src => src.Name["fr"]))
                .ForMember(dest => dest.LabelFr, opt => opt.MapFrom(src => src.Name["fr"]))
                .ForMember(dest => dest.LabelEs, opt => opt.MapFrom(src => src.Name["es"]))
                .ForMember(dest => dest.LabelEn, opt => opt.MapFrom(src => src.Name["en"]))
                .ForMember(dest => dest.LabelDe, opt => opt.MapFrom(src => src.Name["de"]));
            CreateMap<int, Item>()
                .ConvertUsing<IntToItemConverter>();

            CreateMap<TownWishListItem, WishListItemDto>()
               .ForMember(dest => dest.Count, opt => opt.MapFrom(src => src.Count))
               .ForMember(dest => dest.Depot, opt => opt.MapFrom(src => src.Depot))
               .ForMember(dest => dest.ShouldSignal, opt => opt.MapFrom(src => src.ShouldSignal))
               .ForMember(dest => dest.Priority, opt => opt.MapFrom(src => src.Priority))
               .ForMember(dest => dest.ZoneXPa, opt => opt.MapFrom(src => src.ZoneXpa))
               .ForMember(dest => dest.BankCount, opt => opt.Ignore())
               .ForMember(dest => dest.IsWorkshop, opt => opt.Ignore())
               .ForMember(dest => dest.Item, opt => opt.MapFrom(src => src.IdItemNavigation));

            CreateMap<WishListPutResquestDto, TownWishListItem>()
              .ForMember(dest => dest.IdTown, opt => opt.Ignore())
              .ForMember(dest => dest.IdItem, opt => opt.MapFrom(src => src.Id))
              .ForMember(dest => dest.Depot, opt => opt.MapFrom(src => src.Depot))
              .ForMember(dest => dest.ShouldSignal, opt => opt.MapFrom(src => src.ShouldSignal))
              .ForMember(dest => dest.Priority, opt => opt.MapFrom(src => src.Priority))
              .ForMember(dest => dest.ZoneXpa, opt => opt.MapFrom(src => src.ZoneXPa))
              .ForMember(dest => dest.Count, opt => opt.MapFrom(src => src.Count));

            CreateMap<DefaultWishlistItem, TownWishListItem>()
             .ForMember(dest => dest.IdTown, opt => opt.Ignore())
             .ForMember(dest => dest.IdItem, opt => opt.MapFrom(src => src.IdItem))
             .ForMember(dest => dest.Depot, opt => opt.MapFrom(src => src.Depot))
             .ForMember(dest => dest.ShouldSignal, opt => opt.MapFrom(src => src.ShouldSignal))
             .ForMember(dest => dest.Priority, opt => opt.MapFrom(src => src.Priority))
             .ForMember(dest => dest.ZoneXpa, opt => opt.MapFrom(src => src.ZoneXpa))
             .ForMember(dest => dest.Count, opt => opt.MapFrom(src => src.Count));

            CreateMap<WishlistCategorie, WishlistCategorieDto>()
                 .ForMember(dest => dest.IdCategory, opt => opt.MapFrom(src => src.IdCategory))
                 .ForMember(dest => dest.IdUserAuthor, opt => opt.MapFrom(src => src.IdUserAuthor))
                 .ForMember(dest => dest.Name, opt => opt.MapFrom(src => src.Name))
                 .ForMember(dest => dest.Labels, opt => opt.MapFrom(src => new Dictionary<string, string>() { { "fr", src.LabelFr }, { "en", src.LabelEn }, { "es", src.LabelEs }, { "de", src.LabelDe } }))
                 .ForMember(dest => dest.Items, opt => opt.MapFrom(src => src.IdItems.Select(item => item.IdItem).ToList()));
        }

        private class IntToItemConverter : ITypeConverter<int, Item>
        {
            public Item Convert(int source, Item destination, ResolutionContext context)
            {
                var dbContext = context.GetDbContext();
                return dbContext.Items.Single(item => item.IdItem == source);
            }
        }
    }
}
