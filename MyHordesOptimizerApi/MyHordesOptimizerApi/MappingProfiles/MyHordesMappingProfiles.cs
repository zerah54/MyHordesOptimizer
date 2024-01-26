using AutoMapper;
using MyHordesOptimizerApi.Data.Ruins;
using MyHordesOptimizerApi.Dtos.MyHordes;
using MyHordesOptimizerApi.Dtos.MyHordes.Me;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Estimations;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.Bags;
using MyHordesOptimizerApi.Extensions;
using MyHordesOptimizerApi.MappingProfiles.Resolvers;
using MyHordesOptimizerApi.Models;
using System;
using System.Collections.Generic;
using System.Linq;

namespace MyHordesOptimizerApi.MappingProfiles
{
    public class MyHordesMappingProfiles : Profile
    {
        public MyHordesMappingProfiles()
        {
            CreateMap<MyHordesMap, TownDto>()
                .ForMember(dest => dest.Id, opt => opt.MapFrom(src => src.Id))
                .ForMember(dest => dest.MyHordesMap, opt => opt.MapFrom(src => src))
                .ForMember(dest => dest.Citizens, opt => opt.MapFrom<TownCitizensResolver>())
                .ForMember(dest => dest.Bank, opt => opt.MapFrom<TownBankResolver>())
                .ForMember(dest => dest.Cadavers, opt => opt.MapFrom<TownCadaversResolver>());

            CreateMap<MyHordesMeResponseDto, Town>()
                .ForMember(dest => dest.IdTown, opt => opt.MapFrom(src => src.MapId))
                .ForMember(dest => dest.WishlistDateUpdate, opt => opt.Ignore())
                .ForMember(dest => dest.IdUserWishListUpdater, opt => opt.Ignore())
                .ForMember(dest => dest.Day, opt => opt.MapFrom(src => src.Map.Days))
                .ForMember(dest => dest.Height, opt => opt.MapFrom(src => src.Map.Hei))
                .ForMember(dest => dest.Width, opt => opt.MapFrom(src => src.Map.Wid))
                .ForMember(dest => dest.IsChaos, opt => opt.MapFrom(src => src.Map.City.Chaos))
                .ForMember(dest => dest.IsDevasted, opt => opt.MapFrom(src => src.Map.City.Devast))
                .ForMember(dest => dest.IsDoorOpen, opt => opt.MapFrom(src => src.Map.City.Door))
                .ForMember(dest => dest.WaterWell, opt => opt.MapFrom(src => src.Map.City.Water))
                .ForMember(dest => dest.X, opt => opt.MapFrom(src => src.Map.City.X))
                .ForMember(dest => dest.Y, opt => opt.MapFrom(src => src.Map.City.Y));

            CreateMap<MyHordesCitizen, CitizenDto>()
                .ForMember(dest => dest.NombreJourHero, opt => opt.Ignore());

            CreateMap<MyHordesMeResponseDto, SimpleMeDto>()
                .ForMember(dest => dest.Id, opt => opt.MapFrom(src => src.Id))
                .ForMember(dest => dest.UserName, opt => opt.MapFrom(src => src.Name))
                .ForMember(dest => dest.TownDetails, opt => opt.MapFrom(src => src))
                .ForMember(dest => dest.JobDetails, opt => opt.MapFrom(src => src));

            CreateMap<MyHordesMeResponseDto, SimpleMeTownDetailDto>()
                .ForMember(dest => dest.TownId, opt => { opt.MapFrom(src => src.Map.Id); opt.Condition(src => src.Map != null); })
                .ForMember(dest => dest.TownX, opt => { opt.MapFrom(src => src.Map.City.X); opt.Condition(src => src.Map != null && src.Map.City != null); })
                .ForMember(dest => dest.TownY, opt => { opt.MapFrom(src => src.Map.City.Y); opt.Condition(src => src.Map != null && src.Map.City != null); })
                .ForMember(dest => dest.TownMaxX, opt => { opt.MapFrom(src => src.Map.Wid); opt.Condition(src => src.Map != null); })
                .ForMember(dest => dest.TownMaxY, opt => { opt.MapFrom(src => src.Map.Hei); opt.Condition(src => src.Map != null); })
                .ForMember(dest => dest.IsDevaste, opt => { opt.MapFrom(src => src.Map.City.Devast); opt.Condition(src => src.Map != null && src.Map.City != null); })
                .ForMember(dest => dest.TownType, opt => { opt.MapFrom(src => src.Map.GetTownType()); })
                .ForMember(dest => dest.Day, opt => { opt.MapFrom(src => src.Map.Days); });

            CreateMap<MyHordesMeResponseDto, SimpleMeJobDetailDto>()
                .ForMember(dest => dest.Id, opt => { opt.MapFrom(src => src.Job.Id); opt.Condition(src => src.Job != null); })
                .ForMember(dest => dest.Uid, opt => { opt.MapFrom(src => src.Job.Uid); opt.Condition(src => src.Job != null); })
                .ForMember(dest => dest.Label, opt => { opt.MapFrom(src => src.Job.Name.ToMhoDictionnary()); opt.Condition(src => src.Job != null); })
                .ForMember(dest => dest.Description, opt => { opt.MapFrom(src => src.Job.Desc.ToMhoDictionnary()); opt.Condition(src => src.Job != null); });


            CreateMap<KeyValuePair<string, MyHordesApiRuinDto>, MyHordesOptimizerRuinDto>()
                .ForMember(dest => dest.Id, opt => opt.MapFrom(src => src.Value.Id))
                .ForMember(dest => dest.Label, opt => opt.MapFrom(src => src.Value.Name))
                .ForMember(dest => dest.Description, opt => opt.MapFrom(src => src.Value.Desc))
                .ForMember(dest => dest.Explorable, opt => opt.MapFrom(src => src.Value.Explorable))
                .ForMember(dest => dest.Img, opt => opt.MapFrom(src => GetNameIdFromImg(src.Value.Img)))
                .ForMember(dest => dest.Camping, opt => opt.Ignore())
                .ForMember(dest => dest.MinDist, opt => opt.Ignore())
                .ForMember(dest => dest.MaxDist, opt => opt.Ignore())
                .ForMember(dest => dest.Chance, opt => opt.Ignore())
                .ForMember(dest => dest.Drops, opt => opt.Ignore());

            CreateMap<KeyValuePair<string, MyHordesRuinCodeModel>, MyHordesOptimizerRuinDto>()
                .ForMember(dest => dest.Camping, opt => opt.MapFrom(src => src.Value.Camping))
                .ForMember(dest => dest.MinDist, opt => opt.MapFrom(src => src.Value.MinDist))
                .ForMember(dest => dest.MaxDist, opt => opt.MapFrom(src => src.Value.MaxDist))
                .ForMember(dest => dest.Chance, opt => opt.MapFrom(src => src.Value.Chance))
                .ForMember(dest => dest.Capacity, opt => opt.MapFrom(src => src.Value.Capacity))
                .ForMember(dest => dest.Drops, opt => opt.Ignore())
                .ForMember(dest => dest.Img, opt => opt.MapFrom(src => src.Value.Icon))
                .ForMember(dest => dest.Label, opt => opt.Ignore())
                .ForMember(dest => dest.Description, opt => opt.Ignore())
                .ForMember(dest => dest.Explorable, opt => opt.Ignore())
                .ForMember(dest => dest.Id, opt => opt.Ignore());

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
                .ForMember(dest => dest._0, opt => { opt.MapFrom(src => new EstimationValueDto() { Min = src._0min.Value, Max = src._0max.Value }); opt.PreCondition(src => src._0min.HasValue && src._0max.HasValue); })
                .ForMember(dest => dest._4, opt => { opt.MapFrom(src => new EstimationValueDto() { Min = src._4min.Value, Max = src._4max.Value }); opt.PreCondition(src => src._4min.HasValue && src._4max.HasValue); })
                .ForMember(dest => dest._8, opt => { opt.MapFrom(src => new EstimationValueDto() { Min = src._8min.Value, Max = src._8max.Value }); opt.PreCondition(src => src._8min.HasValue && src._8max.HasValue); })
                .ForMember(dest => dest._13, opt => { opt.MapFrom(src => new EstimationValueDto() { Min = src._13min.Value, Max = src._13max.Value }); opt.PreCondition(src => src._13min.HasValue && src._13max.HasValue); })
                .ForMember(dest => dest._17, opt => { opt.MapFrom(src => new EstimationValueDto() { Min = src._17min.Value, Max = src._17max.Value }); opt.PreCondition(src => src._17min.HasValue && src._17max.HasValue); })
                .ForMember(dest => dest._21, opt => { opt.MapFrom(src => new EstimationValueDto() { Min = src._21min.Value, Max = src._21max.Value }); opt.PreCondition(src => src._21min.HasValue && src._21max.HasValue); })
                .ForMember(dest => dest._25, opt => { opt.MapFrom(src => new EstimationValueDto() { Min = src._25min.Value, Max = src._25max.Value }); opt.PreCondition(src => src._25min.HasValue && src._25max.HasValue); })
                .ForMember(dest => dest._29, opt => { opt.MapFrom(src => new EstimationValueDto() { Min = src._29min.Value, Max = src._29max.Value }); opt.PreCondition(src => src._29min.HasValue && src._29max.HasValue); })
                .ForMember(dest => dest._33, opt => { opt.MapFrom(src => new EstimationValueDto() { Min = src._33min.Value, Max = src._33max.Value }); opt.PreCondition(src => src._33min.HasValue && src._33max.HasValue); })
                .ForMember(dest => dest._38, opt => { opt.MapFrom(src => new EstimationValueDto() { Min = src._38min.Value, Max = src._38max.Value }); opt.PreCondition(src => src._38min.HasValue && src._38max.HasValue); })
                .ForMember(dest => dest._42, opt => { opt.MapFrom(src => new EstimationValueDto() { Min = src._42min.Value, Max = src._42max.Value }); opt.PreCondition(src => src._42min.HasValue && src._42max.HasValue); })
                .ForMember(dest => dest._46, opt => { opt.MapFrom(src => new EstimationValueDto() { Min = src._46min.Value, Max = src._46max.Value }); opt.PreCondition(src => src._46min.HasValue && src._46max.HasValue); })
                .ForMember(dest => dest._50, opt => { opt.MapFrom(src => new EstimationValueDto() { Min = src._50min.Value, Max = src._50max.Value }); opt.PreCondition(src => src._50min.HasValue && src._50max.HasValue); })
                .ForMember(dest => dest._54, opt => { opt.MapFrom(src => new EstimationValueDto() { Min = src._54min.Value, Max = src._54max.Value }); opt.PreCondition(src => src._54min.HasValue && src._54max.HasValue); })
                .ForMember(dest => dest._58, opt => { opt.MapFrom(src => new EstimationValueDto() { Min = src._58min.Value, Max = src._58max.Value }); opt.PreCondition(src => src._58min.HasValue && src._58max.HasValue); })
                .ForMember(dest => dest._63, opt => { opt.MapFrom(src => new EstimationValueDto() { Min = src._63min.Value, Max = src._63max.Value }); opt.PreCondition(src => src._63min.HasValue && src._63max.HasValue); })
                .ForMember(dest => dest._67, opt => { opt.MapFrom(src => new EstimationValueDto() { Min = src._68min.Value, Max = src._68max.Value }); opt.PreCondition(src => src._68min.HasValue && src._68max.HasValue); })
                .ForMember(dest => dest._71, opt => { opt.MapFrom(src => new EstimationValueDto() { Min = src._71min.Value, Max = src._71max.Value }); opt.PreCondition(src => src._71min.HasValue && src._71max.HasValue); })
                .ForMember(dest => dest._75, opt => { opt.MapFrom(src => new EstimationValueDto() { Min = src._75min.Value, Max = src._75max.Value }); opt.PreCondition(src => src._75min.HasValue && src._75max.HasValue); })
                .ForMember(dest => dest._79, opt => { opt.MapFrom(src => new EstimationValueDto() { Min = src._79min.Value, Max = src._79max.Value }); opt.PreCondition(src => src._79min.HasValue && src._79max.HasValue); })
                .ForMember(dest => dest._83, opt => { opt.MapFrom(src => new EstimationValueDto() { Min = src._83min.Value, Max = src._83max.Value }); opt.PreCondition(src => src._83min.HasValue && src._83max.HasValue); })
                .ForMember(dest => dest._88, opt => { opt.MapFrom(src => new EstimationValueDto() { Min = src._88min.Value, Max = src._88max.Value }); opt.PreCondition(src => src._88min.HasValue && src._88max.HasValue); })
                .ForMember(dest => dest._92, opt => { opt.MapFrom(src => new EstimationValueDto() { Min = src._92min.Value, Max = src._92max.Value }); opt.PreCondition(src => src._92min.HasValue && src._92max.HasValue); })
                .ForMember(dest => dest._96, opt => { opt.MapFrom(src => new EstimationValueDto() { Min = src._96min.Value, Max = src._96max.Value }); opt.PreCondition(src => src._96min.HasValue && src._96max.HasValue); })
                .ForMember(dest => dest._100, opt => { opt.MapFrom(src => new EstimationValueDto() { Min = src._100min.Value, Max = src._100max.Value }); opt.PreCondition(src => src._100min.HasValue && src._100max.HasValue); });

            CreateMap<MyHordesZoneItem, UpdateObjectDto>()
                .ForMember(dest => dest.IsBroken, opt => opt.MapFrom(src => src.Broken))
                .ForMember(dest => dest.Count, opt => opt.MapFrom(src => src.Count))
                .ForMember(dest => dest.Id, opt => opt.MapFrom(src => src.Id));

        }

        private object GetNameIdFromImg(string img)
        {
            var sub = img.Substring(img.IndexOf("/") + 1);
            return sub.Split(".")[0];
        }
    }
}
