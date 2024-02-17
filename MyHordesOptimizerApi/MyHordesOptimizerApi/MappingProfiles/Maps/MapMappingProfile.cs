using AutoMapper;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Map;
using MyHordesOptimizerApi.Extensions;
using MyHordesOptimizerApi.Models;
using System.Collections.Generic;
using System.Linq;

namespace MyHordesOptimizerApi.MappingProfiles.Maps
{
    public class MapMappingProfile : Profile
    {
        public MapMappingProfile()
        {
            CreateMap<Town, MyHordesOptimizerMapDto>()
                .ForMember(map => map.Cells, opt => opt.MapFrom(town => town))
                .ForMember(map => map.Day, opt => opt.MapFrom(town => town.Day))
                .ForMember(map => map.IsChaos, opt => opt.MapFrom(town => town.IsChaos))
                .ForMember(map => map.IsDevasted, opt => opt.MapFrom(town => town.IsDevasted))
                .ForMember(map => map.IsDoorOpen, opt => opt.MapFrom(town => town.IsDoorOpen))
                .ForMember(map => map.MapHeight, opt => opt.MapFrom(town => town.Height))
                .ForMember(map => map.MapWidth, opt => opt.MapFrom(town => town.Width))
                .ForMember(map => map.TownId, opt => opt.MapFrom(town => town.IdTown))
                .ForMember(map => map.TownX, opt => opt.MapFrom(town => town.X))
                .ForMember(map => map.TownY, opt => opt.MapFrom(town => town.Y))
                .ForMember(map => map.WaterWell, opt => opt.MapFrom(town => town.WaterWell));

            CreateMap<Town, List<MyHordesOptimizerCellDto>>()
                .ConvertUsing<TownToCellsDto>();

            CreateMap<MapCell, MyHordesOptimizerCellDto>()
                .ForMember(dto => dto.AveragePotentialRemainingDig, opt => opt.MapFrom(model => model.AveragePotentialRemainingDig))
                .ForMember(dto => dto.CellId, opt => opt.MapFrom(model => model.IdCell))
                .ForMember(dto => dto.Citizens, opt => opt.Ignore())
                .ForMember(dto => dto.DangerLevel, opt => opt.MapFrom(model => model.DangerLevel))
                .ForMember(dto => dto.DisplayX, opt => opt.Ignore())
                .ForMember(dto => dto.DisplayY, opt => opt.Ignore())
                .ForMember(dto => dto.IdRuin, opt => opt.MapFrom(model => model.IdRuin))
                .ForMember(dto => dto.IsDryed, opt => opt.MapFrom(model => model.IsDryed))
                .ForMember(dto => dto.IsNeverVisited, opt => opt.MapFrom(model => model.IsNeverVisited))
                .ForMember(dto => dto.IsRuinCamped, opt => opt.MapFrom(model => model.IsRuinCamped))
                .ForMember(dto => dto.IsRuinDryed, opt => opt.MapFrom(model => model.IsRuinDryed))
                .ForMember(dto => dto.IsTown, opt => opt.MapFrom(model => model.IsTown))
                .ForMember(dto => dto.IsVisitedToday, opt => opt.MapFrom(model => model.IsVisitedToday))
                .ForMember(dto => dto.Items, opt => opt.MapFrom(model => model.MapCellItems))
                .ForMember(dto => dto.LastUpdateInfo, opt => opt.MapFrom(model => model.IdLastUpdateInfoNavigation))
                .ForMember(dto => dto.MaxPotentialRemainingDig, opt => opt.MapFrom(model => model.MaxPotentialRemainingDig))
                .ForMember(dto => dto.NbHero, opt => opt.MapFrom(model => model.NbHero))
                .ForMember(dto => dto.NbKm, opt => opt.MapFrom(model => model.NbKm))
                .ForMember(dto => dto.NbPa, opt => opt.MapFrom(model => model.NbPa))
                .ForMember(dto => dto.NbRuinDig, opt => opt.MapFrom(model => model.NbRuinDig))
                .ForMember(dto => dto.NbZombie, opt => opt.MapFrom(model => model.NbZombie))
                .ForMember(dto => dto.NbZombieKilled, opt => opt.MapFrom(model => model.NbZombieKilled))
                .ForMember(dto => dto.Note, opt => opt.MapFrom(model => model.Note))
                .ForMember(dto => dto.TotalSucces, opt => opt.Ignore())
                .ForMember(dto => dto.X, opt => opt.MapFrom(model => model.X))
                .ForMember(dto => dto.Y, opt => opt.MapFrom(model => model.Y))
                .ForMember(dto => dto.ZoneRegen, opt => { opt.MapFrom(src => ((RegenDirectionEnum)src.ZoneRegen.Value).GetDescription()); opt.PreCondition(src => src.ZoneRegen.HasValue); });

            CreateMap<Town, List<MyHordesOptimizerMapDigDto>>()
                    .ConvertUsing<TownToMapDigDto>();
            CreateMap<MapCellDig, MyHordesOptimizerMapDigDto>()
                .ForMember(dto => dto.CellId, opt => opt.MapFrom(model => model.IdCell))
                .ForMember(dto => dto.Day, opt => opt.MapFrom(model => model.Day))
                .ForMember(dto => dto.DiggerId, opt => opt.MapFrom(model => model.IdUser))
                .ForMember(dto => dto.DiggerName, opt => opt.MapFrom(model => model.IdUserNavigation.Name))
                .ForMember(dto => dto.LastUpdateInfo, opt => opt.MapFrom(model => model.IdLastUpdateInfoNavigation))
                .ForMember(dto => dto.NbSucces, opt => opt.MapFrom(model => model.NbSucces))
                .ForMember(dto => dto.NbTotalDig, opt => opt.MapFrom(model => model.NbTotalDig))
                .ForMember(dto => dto.X, opt => opt.Ignore())
                .ForMember(dto => dto.Y, opt => opt.Ignore());

        }

        private class TownToCellsDto : ITypeConverter<Town, List<MyHordesOptimizerCellDto>>
        {
            public List<MyHordesOptimizerCellDto> Convert(Town town, List<MyHordesOptimizerCellDto> destination, ResolutionContext context)
            {
                var results = new List<MyHordesOptimizerCellDto>();
                var citizenByPosition = town.TownCitizens.GroupBy(townCitizen => new { X = townCitizen.PositionX.Value, Y = townCitizen.PositionY.Value })
                    .ToDictionary(x => x.Key, x => x.ToList());
                foreach (var mapCell in town.MapCells)
                {
                    var cellDto = context.Mapper.Map<MyHordesOptimizerCellDto>(mapCell);
                    if (citizenByPosition.TryGetValue(new { mapCell.X, mapCell.Y }, out var cellCitizens))
                    {
                        cellDto.Citizens = context.Mapper.Map<List<CellCitizenDto>>(cellCitizens);
                    }
                    cellDto.DisplayX = mapCell.X - town.X;
                    cellDto.DisplayY = town.Y - mapCell.Y;
                    cellDto.TotalSucces = mapCell.MapCellDigs.Where(digs => digs.IdCell == mapCell.IdCell).Sum(digs => digs.NbSucces);
                    results.Add(cellDto);
                }
                return results;
            }
        }

        private class TownToMapDigDto : ITypeConverter<Town, List<MyHordesOptimizerMapDigDto>>
        {
            public List<MyHordesOptimizerMapDigDto> Convert(Town town, List<MyHordesOptimizerMapDigDto> destination, ResolutionContext context)
            {
                var results = new List<MyHordesOptimizerMapDigDto>();
                foreach (var mapCell in town.MapCells)
                {
                    var digDtos = context.Mapper.Map<List<MyHordesOptimizerMapDigDto>>(mapCell.MapCellDigs);
                    digDtos.ForEach(dig =>
                    {
                        dig.X = mapCell.X;
                        dig.Y = mapCell.Y;
                    });
                    results.AddRange(digDtos);
                }
                return results;
            }
        }
    }
}
