using AutoMapper;
using MyHordesOptimizerApi.Data.Wishlist;
using MyHordesOptimizerApi.Extensions;
using MyHordesOptimizerApi.Models;
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
