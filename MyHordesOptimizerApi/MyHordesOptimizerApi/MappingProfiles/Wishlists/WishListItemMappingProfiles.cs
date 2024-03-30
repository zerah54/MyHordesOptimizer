using AutoMapper;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Models;

namespace MyHordesOptimizerApi.MappingProfiles.Wishlists
{
    public class WishListItemMappingProfiles : Profile
    {
        public WishListItemMappingProfiles()
        {
            CreateMap<DefaultWishlistItem, WishListItemDto>()
                .ForMember(dto => dto.BagCount, opt => opt.Ignore())
                .ForMember(dto => dto.BankCount, opt => opt.Ignore())
                .ForMember(dto => dto.Count, opt => opt.MapFrom(src => src.Count))
                .ForMember(dto => dto.Depot, opt => opt.MapFrom(src => src.Depot))
                .ForMember(dto => dto.IsWorkshop, opt => opt.Ignore())
                .ForMember(dto => dto.Item, opt => opt.MapFrom(src => src.IdItemNavigation))
                .ForMember(dto => dto.Priority, opt => opt.MapFrom(src => src.Priority))
                .ForMember(dto => dto.ShouldSignal, opt => opt.MapFrom(src => src.ShouldSignal))
                .ForMember(dto => dto.ZoneXPa, opt => opt.MapFrom(src => src.ZoneXpa));

        }
    }
}
