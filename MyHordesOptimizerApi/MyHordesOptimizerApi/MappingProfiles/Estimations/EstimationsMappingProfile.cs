using AutoMapper;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Estimations;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Map;
using MyHordesOptimizerApi.Extensions;
using MyHordesOptimizerApi.Models;
using System;
using System.Collections.Generic;
using System.Linq;

namespace MyHordesOptimizerApi.MappingProfiles.Estimations
{
    public class EstimationsMappingProfile : Profile
    {
        public EstimationsMappingProfile() 
        {
            CreateMap<EstimationRequestDto, List<TownEstimation>>()
                .ConvertUsing<EstimationRequestDtoToTownEstimations>();

            CreateMap<EstimationsDto, TownEstimation>()
                .ForMember(dest => dest.Day, opt => opt.Ignore())
                .ForMember(dest => dest.IdLastUpdateInfo, opt => opt.Ignore())
                .ForMember(dest => dest.IsPlanif, opt => opt.Ignore())
                .ForMember(dest => dest.IdTown, opt => opt.Ignore())
                .ForMember(dest => dest._0min, opt => { opt.MapFrom(src => src._0.Min); opt.Condition(src => src._0 != null); })
                .ForMember(dest => dest._0max, opt => { opt.MapFrom(src => src._0.Max); opt.Condition(src => src._0 != null); })
                .ForMember(dest => dest._4min, opt => { opt.MapFrom(src => src._4.Min); opt.Condition(src => src._4 != null); })
                .ForMember(dest => dest._4max, opt => { opt.MapFrom(src => src._4.Max); opt.Condition(src => src._4 != null); })
                .ForMember(dest => dest._8min, opt => { opt.MapFrom(src => src._8.Min); opt.Condition(src => src._8 != null); })
                .ForMember(dest => dest._8max, opt => { opt.MapFrom(src => src._8.Max); opt.Condition(src => src._8 != null); })
                .ForMember(dest => dest._13min, opt => { opt.MapFrom(src => src._13.Min); opt.Condition(src => src._13 != null); })
                .ForMember(dest => dest._13max, opt => { opt.MapFrom(src => src._13.Max); opt.Condition(src => src._13 != null); })
                .ForMember(dest => dest._17min, opt => { opt.MapFrom(src => src._17.Min); opt.Condition(src => src._17 != null); })
                .ForMember(dest => dest._17max, opt => { opt.MapFrom(src => src._17.Max); opt.Condition(src => src._17 != null); })
                .ForMember(dest => dest._21min, opt => { opt.MapFrom(src => src._21.Min); opt.Condition(src => src._21 != null); })
                .ForMember(dest => dest._21max, opt => { opt.MapFrom(src => src._21.Max); opt.Condition(src => src._21 != null); })
                .ForMember(dest => dest._25min, opt => { opt.MapFrom(src => src._25.Min); opt.Condition(src => src._25 != null); })
                .ForMember(dest => dest._25max, opt => { opt.MapFrom(src => src._25.Max); opt.Condition(src => src._25 != null); })
                .ForMember(dest => dest._29min, opt => { opt.MapFrom(src => src._29.Min); opt.Condition(src => src._29 != null); })
                .ForMember(dest => dest._29max, opt => { opt.MapFrom(src => src._29.Max); opt.Condition(src => src._29 != null); })
                .ForMember(dest => dest._33min, opt => { opt.MapFrom(src => src._33.Min); opt.Condition(src => src._33 != null); })
                .ForMember(dest => dest._33max, opt => { opt.MapFrom(src => src._33.Max); opt.Condition(src => src._33 != null); })
                .ForMember(dest => dest._38min, opt => { opt.MapFrom(src => src._38.Min); opt.Condition(src => src._38 != null); })
                .ForMember(dest => dest._38max, opt => { opt.MapFrom(src => src._38.Max); opt.Condition(src => src._38 != null); })
                .ForMember(dest => dest._42min, opt => { opt.MapFrom(src => src._42.Min); opt.Condition(src => src._42 != null); })
                .ForMember(dest => dest._42max, opt => { opt.MapFrom(src => src._42.Max); opt.Condition(src => src._42 != null); })
                .ForMember(dest => dest._46min, opt => { opt.MapFrom(src => src._46.Min); opt.Condition(src => src._46 != null); })
                .ForMember(dest => dest._46max, opt => { opt.MapFrom(src => src._46.Max); opt.Condition(src => src._46 != null); })
                .ForMember(dest => dest._50min, opt => { opt.MapFrom(src => src._50.Min); opt.Condition(src => src._50 != null); })
                .ForMember(dest => dest._50max, opt => { opt.MapFrom(src => src._50.Max); opt.Condition(src => src._50 != null); })
                .ForMember(dest => dest._54min, opt => { opt.MapFrom(src => src._54.Min); opt.Condition(src => src._54 != null); })
                .ForMember(dest => dest._54max, opt => { opt.MapFrom(src => src._54.Max); opt.Condition(src => src._54 != null); })
                .ForMember(dest => dest._58min, opt => { opt.MapFrom(src => src._58.Min); opt.Condition(src => src._58 != null); })
                .ForMember(dest => dest._58max, opt => { opt.MapFrom(src => src._58.Max); opt.Condition(src => src._58 != null); })
                .ForMember(dest => dest._63min, opt => { opt.MapFrom(src => src._63.Min); opt.Condition(src => src._63 != null); })
                .ForMember(dest => dest._63max, opt => { opt.MapFrom(src => src._63.Max); opt.Condition(src => src._63 != null); })
                .ForMember(dest => dest._68min, opt => { opt.MapFrom(src => src._67.Min); opt.Condition(src => src._67 != null); })
                .ForMember(dest => dest._68max, opt => { opt.MapFrom(src => src._67.Max); opt.Condition(src => src._67 != null); })
                .ForMember(dest => dest._71min, opt => { opt.MapFrom(src => src._71.Min); opt.Condition(src => src._71 != null); })
                .ForMember(dest => dest._71max, opt => { opt.MapFrom(src => src._71.Max); opt.Condition(src => src._71 != null); })
                .ForMember(dest => dest._75min, opt => { opt.MapFrom(src => src._75.Min); opt.Condition(src => src._75 != null); })
                .ForMember(dest => dest._75max, opt => { opt.MapFrom(src => src._75.Max); opt.Condition(src => src._75 != null); })
                .ForMember(dest => dest._79min, opt => { opt.MapFrom(src => src._79.Min); opt.Condition(src => src._79 != null); })
                .ForMember(dest => dest._79max, opt => { opt.MapFrom(src => src._79.Max); opt.Condition(src => src._79 != null); })
                .ForMember(dest => dest._83min, opt => { opt.MapFrom(src => src._83.Min); opt.Condition(src => src._83 != null); })
                .ForMember(dest => dest._83max, opt => { opt.MapFrom(src => src._83.Max); opt.Condition(src => src._83 != null); })
                .ForMember(dest => dest._88min, opt => { opt.MapFrom(src => src._88.Min); opt.Condition(src => src._88 != null); })
                .ForMember(dest => dest._88max, opt => { opt.MapFrom(src => src._88.Max); opt.Condition(src => src._88 != null); })
                .ForMember(dest => dest._92min, opt => { opt.MapFrom(src => src._92.Min); opt.Condition(src => src._92 != null); })
                .ForMember(dest => dest._92max, opt => { opt.MapFrom(src => src._92.Max); opt.Condition(src => src._92 != null); })
                .ForMember(dest => dest._96min, opt => { opt.MapFrom(src => src._96.Min); opt.Condition(src => src._96 != null); })
                .ForMember(dest => dest._96max, opt => { opt.MapFrom(src => src._96.Max); opt.Condition(src => src._96 != null); })
                .ForMember(dest => dest._100min, opt => { opt.MapFrom(src => src._100.Min); opt.Condition(src => src._100 != null); })
                .ForMember(dest => dest._100max, opt => { opt.MapFrom(src => src._100.Max); opt.Condition(src => src._100 != null); });

            CreateMap<IEnumerable<TownEstimation>, EstimationRequestDto>()
                .ForMember(dest => dest.Day, opt => opt.MapFrom(src => src.First().Day))
                .ForMember(dest => dest.Estim, opt => opt.MapFrom(src => src.First(x => !Convert.ToBoolean(x.IsPlanif))))
                .ForMember(dest => dest.Planif, opt => opt.MapFrom(src => src.First(x => Convert.ToBoolean(x.IsPlanif))));

            CreateMap<TownEstimation, EstimationsDto>()
                .ForMember(dest => dest._0, opt => { opt.MapFrom(src => new EstimationValueDto() { Min = src._0min.Value, Max = src._0max.Value }); opt.PreCondition(src => src._0min.HasValue && src._0min > 0 && src._0max.HasValue && src._0max > 0); })
                .ForMember(dest => dest._4, opt => { opt.MapFrom(src => new EstimationValueDto() { Min = src._4min.Value, Max = src._4max.Value }); opt.PreCondition(src => src._4min.HasValue && src._4min > 0 && src._4max.HasValue && src._4max > 0); })
                .ForMember(dest => dest._8, opt => { opt.MapFrom(src => new EstimationValueDto() { Min = src._8min.Value, Max = src._8max.Value }); opt.PreCondition(src => src._8min.HasValue && src._8min > 0 && src._8max.HasValue && src._8max > 0); })
                .ForMember(dest => dest._13, opt => { opt.MapFrom(src => new EstimationValueDto() { Min = src._13min.Value, Max = src._13max.Value }); opt.PreCondition(src => src._13min.HasValue && src._13min > 0 && src._13max.HasValue && src._13max > 0); })
                .ForMember(dest => dest._17, opt => { opt.MapFrom(src => new EstimationValueDto() { Min = src._17min.Value, Max = src._17max.Value }); opt.PreCondition(src => src._17min.HasValue && src._17min > 0 && src._17max.HasValue && src._17max > 0); })
                .ForMember(dest => dest._21, opt => { opt.MapFrom(src => new EstimationValueDto() { Min = src._21min.Value, Max = src._21max.Value }); opt.PreCondition(src => src._21min.HasValue && src._21min > 0 && src._21max.HasValue && src._21max > 0); })
                .ForMember(dest => dest._25, opt => { opt.MapFrom(src => new EstimationValueDto() { Min = src._25min.Value, Max = src._25max.Value }); opt.PreCondition(src => src._25min.HasValue && src._25min > 0 && src._25max.HasValue && src._25max > 0); })
                .ForMember(dest => dest._29, opt => { opt.MapFrom(src => new EstimationValueDto() { Min = src._29min.Value, Max = src._29max.Value }); opt.PreCondition(src => src._29min.HasValue && src._29min > 0 && src._29max.HasValue && src._29max > 0); })
                .ForMember(dest => dest._33, opt => { opt.MapFrom(src => new EstimationValueDto() { Min = src._33min.Value, Max = src._33max.Value }); opt.PreCondition(src => src._33min.HasValue && src._33min > 0 && src._33max.HasValue && src._33max > 0); })
                .ForMember(dest => dest._38, opt => { opt.MapFrom(src => new EstimationValueDto() { Min = src._38min.Value, Max = src._38max.Value }); opt.PreCondition(src => src._38min.HasValue && src._38min > 0 && src._38max.HasValue && src._38max > 0); })
                .ForMember(dest => dest._42, opt => { opt.MapFrom(src => new EstimationValueDto() { Min = src._42min.Value, Max = src._42max.Value }); opt.PreCondition(src => src._42min.HasValue && src._42min > 0 && src._42max.HasValue && src._42max > 0); })
                .ForMember(dest => dest._46, opt => { opt.MapFrom(src => new EstimationValueDto() { Min = src._46min.Value, Max = src._46max.Value }); opt.PreCondition(src => src._46min.HasValue && src._46min > 0 && src._46max.HasValue && src._46max > 0); })
                .ForMember(dest => dest._50, opt => { opt.MapFrom(src => new EstimationValueDto() { Min = src._50min.Value, Max = src._50max.Value }); opt.PreCondition(src => src._50min.HasValue && src._50min > 0 && src._50max.HasValue && src._50max > 0); })
                .ForMember(dest => dest._54, opt => { opt.MapFrom(src => new EstimationValueDto() { Min = src._54min.Value, Max = src._54max.Value }); opt.PreCondition(src => src._54min.HasValue && src._54min > 0 && src._54max.HasValue && src._54max > 0); })
                .ForMember(dest => dest._58, opt => { opt.MapFrom(src => new EstimationValueDto() { Min = src._58min.Value, Max = src._58max.Value }); opt.PreCondition(src => src._58min.HasValue && src._58min > 0 && src._58max.HasValue && src._58max > 0); })
                .ForMember(dest => dest._63, opt => { opt.MapFrom(src => new EstimationValueDto() { Min = src._63min.Value, Max = src._63max.Value }); opt.PreCondition(src => src._63min.HasValue && src._63min > 0 && src._63max.HasValue && src._63max > 0); })
                .ForMember(dest => dest._67, opt => { opt.MapFrom(src => new EstimationValueDto() { Min = src._68min.Value, Max = src._68max.Value }); opt.PreCondition(src => src._68min.HasValue && src._68min > 0 && src._68max.HasValue && src._68max > 0); })
                .ForMember(dest => dest._71, opt => { opt.MapFrom(src => new EstimationValueDto() { Min = src._71min.Value, Max = src._71max.Value }); opt.PreCondition(src => src._71min.HasValue && src._71min > 0 && src._71max.HasValue && src._71max > 0); })
                .ForMember(dest => dest._75, opt => { opt.MapFrom(src => new EstimationValueDto() { Min = src._75min.Value, Max = src._75max.Value }); opt.PreCondition(src => src._75min.HasValue && src._75min > 0 && src._75max.HasValue && src._75max > 0); })
                .ForMember(dest => dest._79, opt => { opt.MapFrom(src => new EstimationValueDto() { Min = src._79min.Value, Max = src._79max.Value }); opt.PreCondition(src => src._79min.HasValue && src._79min > 0 && src._79max.HasValue && src._79max > 0); })
                .ForMember(dest => dest._83, opt => { opt.MapFrom(src => new EstimationValueDto() { Min = src._83min.Value, Max = src._83max.Value }); opt.PreCondition(src => src._83min.HasValue && src._83min > 0 && src._83max.HasValue && src._83max > 0); })
                .ForMember(dest => dest._88, opt => { opt.MapFrom(src => new EstimationValueDto() { Min = src._88min.Value, Max = src._88max.Value }); opt.PreCondition(src => src._88min.HasValue && src._88min > 0 && src._88max.HasValue && src._88max > 0); })
                .ForMember(dest => dest._92, opt => { opt.MapFrom(src => new EstimationValueDto() { Min = src._92min.Value, Max = src._92max.Value }); opt.PreCondition(src => src._92min.HasValue && src._92min > 0 && src._92max.HasValue && src._92max > 0); })
                .ForMember(dest => dest._96, opt => { opt.MapFrom(src => new EstimationValueDto() { Min = src._96min.Value, Max = src._96max.Value }); opt.PreCondition(src => src._96min.HasValue && src._96min > 0 && src._96max.HasValue && src._96max > 0); })
                .ForMember(dest => dest._100, opt => { opt.MapFrom(src => new EstimationValueDto() { Min = src._100min.Value, Max = src._100max.Value }); opt.PreCondition(src => src._100min.HasValue && src._100min > 0 && src._100max.HasValue && src._100max > 0); });
        }

        private class EstimationRequestDtoToTownEstimations : ITypeConverter<EstimationRequestDto, List<TownEstimation>>
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

            public List<TownEstimation> Convert(EstimationRequestDto request, List<TownEstimation> destination, ResolutionContext context)
            {
                var results = new List<TownEstimation>();
                var estimationModel = context.Mapper.Map<TownEstimation>(request.Estim);
                estimationModel.Day = request.Day;
                estimationModel.IdTown = context.GetTownId();
                estimationModel.IdLastUpdateInfo = context.GetLastUpdateInfoId();
                estimationModel.IsPlanif = false;
                results.Add(estimationModel);
                var planifModel = context.Mapper.Map<TownEstimation>(request.Planif);
                planifModel.Day = request.Day;
                planifModel.IdTown = context.GetTownId();
                planifModel.IdLastUpdateInfo = context.GetLastUpdateInfoId();
                planifModel.IsPlanif = true;
                results.Add(planifModel);
                return results;
            }
        }
    }
}
