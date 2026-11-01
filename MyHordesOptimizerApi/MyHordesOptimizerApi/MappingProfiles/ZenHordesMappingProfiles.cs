using AutoMapper;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.Map;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.ZenHordes;
using System.Linq;

namespace MyHordesOptimizerApi.MappingProfiles
{
    public class ZenHordesMappingProfiles : Profile
    {
        public ZenHordesMappingProfiles()
        {
            // Les objets sont convertis à la main : AutoMapper transformerait une liste absente en liste vide,
            // et ZenHordes comprendrait « plus aucun objet sur la case » au lieu de « objets non relevés ».
            CreateMap<UpdateRequestDto, ZenHordesUpdateRequestDto>()
                .ForMember(dest => dest.Key, opt => opt.Ignore())
                .ForMember(dest => dest.UserId, opt => opt.Ignore())
                .ForMember(dest => dest.TownId, opt => opt.MapFrom(src => src.TownDetails.TownId))
                .ForMember(dest => dest.X, opt => opt.MapFrom(src => src.Map!.ZenHordesCell!.X))
                .ForMember(dest => dest.Y, opt => opt.MapFrom(src => src.Map!.ZenHordesCell!.Y))
                .ForMember(dest => dest.Zombies, opt => opt.MapFrom(src => src.Map!.ZenHordesCell!.Zombies))
                .ForMember(dest => dest.Depleted, opt => opt.MapFrom(src => src.Map!.ZenHordesCell!.ZoneEmpty))
                .ForMember(dest => dest.ScavRadar, opt => opt.MapFrom(src => src.Map!.ZenHordesCell!.ScavNextCells))
                .ForMember(dest => dest.ScoutRadar, opt => opt.MapFrom(src => src.Map!.ZenHordesCell!.ScoutNextCells))
                .ForMember(dest => dest.Items, opt =>
                {
                    opt.AllowNull();
                    opt.MapFrom(src => src.Map!.ZenHordesCell!.Objects == null
                        ? null
                        : src.Map.ZenHordesCell.Objects.Select(item => new ZenHordesItemDto { Id = item.Id, Quantity = item.Count, Broken = item.IsBroken }).ToList());
                });

            CreateMap<ScavNextCellsDto, ZenHordesScavRadarDto>();
            CreateMap<ScoutNextCellsDto, ZenHordesScoutRadarDto>();
        }
    }
}
