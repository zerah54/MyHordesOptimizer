using AutoMapper;
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
            CreateMap<TownWishListItem, WishListItemDto>()
               .ForMember(dest => dest.Count, opt => opt.MapFrom(src => src.Count))
               .ForMember(dest => dest.Depot, opt => opt.MapFrom(src => src.Depot))
               .ForMember(dest => dest.ShouldSignal, opt => opt.MapFrom(src => src.ShouldSignal))
               .ForMember(dest => dest.Priority, opt => opt.MapFrom(src => src.Priority))
               .ForMember(dest => dest.ZoneXPa, opt => opt.MapFrom(src => src.ZoneXpa))
               .ForMember(dest => dest.BankCount, opt => opt.MapFrom(src => src.IdItemNavigation.TownBankItems.Sum(bankItem => bankItem.Count)))
               .ForMember(dest => dest.BagCount, opt => opt.MapFrom(src => src.IdTownNavigation.TownCitizens
                    .Where(citizen => citizen.Dead != true && citizen.IdBagNavigation != null)
                    .SelectMany(citizen => citizen.IdBagNavigation!.BagItems)
                    .Where(bagItem => bagItem.IdItem == src.IdItem)
                    .Sum(bagItem => bagItem.Count)))
               .ForMember(dest => dest.BagCitizens, opt => opt.MapFrom(src => src.IdTownNavigation.TownCitizens
                    .Where(citizen => citizen.Dead != true && citizen.IdBagNavigation != null
                        && citizen.IdBagNavigation.BagItems.Any(bagItem => bagItem.IdItem == src.IdItem))
                    .Select(citizen => citizen.IdUserNavigation.Name)
                    .ToList()))
               .ForMember(dest => dest.ChestCount, opt => opt.MapFrom(src => src.IdTownNavigation.TownCitizens
                    .Where(citizen => citizen.Dead != true && citizen.IdChestNavigation != null)
                    .SelectMany(citizen => citizen.IdChestNavigation!.ChestItems)
                    .Where(chestItem => chestItem.IdItem == src.IdItem)
                    .Sum(chestItem => chestItem.Count)))
               .ForMember(dest => dest.ChestCitizens, opt => opt.MapFrom(src => src.IdTownNavigation.TownCitizens
                    .Where(citizen => citizen.Dead != true && citizen.IdChestNavigation != null
                        && citizen.IdChestNavigation.ChestItems.Any(chestItem => chestItem.IdItem == src.IdItem))
                    .Select(citizen => citizen.IdUserNavigation.Name)
                    .ToList()))
               .ForMember(dest => dest.MapCellItemCount, opt => opt.MapFrom(src => src.IdItemNavigation.MapCellItems
                    .Where(mapCellItem => mapCellItem.IdCellNavigation.IdTown == src.IdTown)
                    .Sum(mapCellItem => mapCellItem.Count)))
               .ForMember(dest => dest.IsWorkshop, opt => opt.Ignore())
               .ForMember(dest => dest.GroupUid, opt => opt.MapFrom(src => src.GroupUid))
               .ForMember(dest => dest.Item, opt => opt.MapFrom(src => src.IdItemNavigation));

            CreateMap<TownWishListGroup, WishListGroupDto>()
               .ForMember(dest => dest.ZoneXPa, opt => opt.MapFrom(src => src.ZoneXpa));

            CreateMap<WishListPutResquestDto, TownWishListItem>()
              .ForMember(dest => dest.GroupUid, opt => opt.Ignore())
              .ForMember(dest => dest.IdTown, opt => opt.Ignore())
              .ForMember(dest => dest.IdItem, opt => opt.MapFrom(src => src.Id))
              .ForMember(dest => dest.Depot, opt => opt.MapFrom(src => src.Depot))
              .ForMember(dest => dest.ShouldSignal, opt => opt.MapFrom(src => src.ShouldSignal))
              .ForMember(dest => dest.Priority, opt => opt.MapFrom(src => src.Priority))
              .ForMember(dest => dest.ZoneXpa, opt => opt.MapFrom(src => src.ZoneXPa))
              .ForMember(dest => dest.Count, opt => opt.MapFrom(src => src.Count));

        }
    }
}
