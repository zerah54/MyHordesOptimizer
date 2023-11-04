using AutoMapper;
using MyHordesOptimizerApi.Data.Ruins;
using MyHordesOptimizerApi.Dtos.MyHordes;
using MyHordesOptimizerApi.Dtos.MyHordes.Me;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Extensions;
using MyHordesOptimizerApi.MappingProfiles.Resolvers;
using MyHordesOptimizerApi.Models;
using System.Collections.Generic;
using System.Linq;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Estimations;
using MyHordesOptimizerApi.Models.Estimations;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.Bags;

namespace MyHordesOptimizerApi.MappingProfiles
{
    public class MyHordesMappingProfiles : Profile
    {
        public MyHordesMappingProfiles()
        {
            CreateMap<MyHordesMap, Town>()
                .ForMember(dest => dest.Id, opt => opt.MapFrom(src => src.Id))
                .ForMember(dest => dest.MyHordesMap, opt => opt.MapFrom(src => src))
                .ForMember(dest => dest.Citizens, opt => opt.MapFrom<TownCitizensResolver>())
                .ForMember(dest => dest.Bank, opt => opt.MapFrom<TownBankResolver>())
                .ForMember(dest => dest.Cadavers, opt => opt.MapFrom<TownCadaversResolver>());

            CreateMap<MyHordesMeResponseDto, TownModel>()
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

            CreateMap<MyHordesCitizen, Citizen>()
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


            CreateMap<KeyValuePair<string, MyHordesApiRuinDto>, MyHordesOptimizerRuin>()
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

            CreateMap<KeyValuePair<string, MyHordesRuinCodeModel>, MyHordesOptimizerRuin>()
                .ForMember(dest => dest.Camping, opt => opt.MapFrom(src => src.Value.Camping))
                .ForMember(dest => dest.MinDist, opt => opt.MapFrom(src => src.Value.MinDist))
                .ForMember(dest => dest.MaxDist, opt => opt.MapFrom(src => src.Value.MaxDist))
                .ForMember(dest => dest.Chance, opt => opt.MapFrom(src => src.Value.Chance))
                .ForMember(dest => dest.Drops, opt => opt.Ignore())
                .ForMember(dest => dest.Img, opt => opt.MapFrom(src => src.Value.Icon))
                .ForMember(dest => dest.Label, opt => opt.Ignore())
                .ForMember(dest => dest.Description, opt => opt.Ignore())
                .ForMember(dest => dest.Explorable, opt => opt.Ignore())
                .ForMember(dest => dest.Id, opt => opt.Ignore());

            CreateMap<EstimationsDto, TownEstimationModel>()
                .ForMember(dest => dest.Day, opt => opt.Ignore())
                .ForMember(dest => dest.IdLastUpdateInfo, opt => opt.Ignore())
                .ForMember(dest => dest.IsPlanif, opt => opt.Ignore())
                .ForMember(dest => dest.IdTown, opt => opt.Ignore())
                .ForMember(dest => dest._0Min, opt => { opt.MapFrom(src => src._0.Min); opt.Condition(src => src._0 != null); })
                .ForMember(dest => dest._0Max, opt => { opt.MapFrom(src => src._0.Max); opt.Condition(src => src._0 != null); })
                .ForMember(dest => dest._4Min, opt => { opt.MapFrom(src => src._4.Min); opt.Condition(src => src._4 != null); })
                .ForMember(dest => dest._4Max, opt => { opt.MapFrom(src => src._4.Max); opt.Condition(src => src._4 != null); })
                .ForMember(dest => dest._8Min, opt => { opt.MapFrom(src => src._8.Min); opt.Condition(src => src._8 != null); })
                .ForMember(dest => dest._8Max, opt => { opt.MapFrom(src => src._8.Max); opt.Condition(src => src._8 != null); })
                .ForMember(dest => dest._13Min, opt => { opt.MapFrom(src => src._13.Min); opt.Condition(src => src._13 != null); })
                .ForMember(dest => dest._13Max, opt => { opt.MapFrom(src => src._13.Max); opt.Condition(src => src._13 != null); })
                .ForMember(dest => dest._17Min, opt => { opt.MapFrom(src => src._17.Min); opt.Condition(src => src._17 != null); })
                .ForMember(dest => dest._17Max, opt => { opt.MapFrom(src => src._17.Max); opt.Condition(src => src._17 != null); })
                .ForMember(dest => dest._21Min, opt => { opt.MapFrom(src => src._21.Min); opt.Condition(src => src._21 != null); })
                .ForMember(dest => dest._21Max, opt => { opt.MapFrom(src => src._21.Max); opt.Condition(src => src._21 != null); })
                .ForMember(dest => dest._25Min, opt => { opt.MapFrom(src => src._25.Min); opt.Condition(src => src._25 != null); })
                .ForMember(dest => dest._25Max, opt => { opt.MapFrom(src => src._25.Max); opt.Condition(src => src._25 != null); })
                .ForMember(dest => dest._29Min, opt => { opt.MapFrom(src => src._29.Min); opt.Condition(src => src._29 != null); })
                .ForMember(dest => dest._29Max, opt => { opt.MapFrom(src => src._29.Max); opt.Condition(src => src._29 != null); })
                .ForMember(dest => dest._33Min, opt => { opt.MapFrom(src => src._33.Min); opt.Condition(src => src._33 != null); })
                .ForMember(dest => dest._33Max, opt => { opt.MapFrom(src => src._33.Max); opt.Condition(src => src._33 != null); })
                .ForMember(dest => dest._38Min, opt => { opt.MapFrom(src => src._38.Min); opt.Condition(src => src._38 != null); })
                .ForMember(dest => dest._38Max, opt => { opt.MapFrom(src => src._38.Max); opt.Condition(src => src._38 != null); })
                .ForMember(dest => dest._42Min, opt => { opt.MapFrom(src => src._42.Min); opt.Condition(src => src._42 != null); })
                .ForMember(dest => dest._42Max, opt => { opt.MapFrom(src => src._42.Max); opt.Condition(src => src._42 != null); })
                .ForMember(dest => dest._46Min, opt => { opt.MapFrom(src => src._46.Min); opt.Condition(src => src._46 != null); })
                .ForMember(dest => dest._46Max, opt => { opt.MapFrom(src => src._46.Max); opt.Condition(src => src._46 != null); })
                .ForMember(dest => dest._50Min, opt => { opt.MapFrom(src => src._50.Min); opt.Condition(src => src._50 != null); })
                .ForMember(dest => dest._50Max, opt => { opt.MapFrom(src => src._50.Max); opt.Condition(src => src._50 != null); })
                .ForMember(dest => dest._54Min, opt => { opt.MapFrom(src => src._54.Min); opt.Condition(src => src._54 != null); })
                .ForMember(dest => dest._54Max, opt => { opt.MapFrom(src => src._54.Max); opt.Condition(src => src._54 != null); })
                .ForMember(dest => dest._58Min, opt => { opt.MapFrom(src => src._58.Min); opt.Condition(src => src._58 != null); })
                .ForMember(dest => dest._58Max, opt => { opt.MapFrom(src => src._58.Max); opt.Condition(src => src._58 != null); })
                .ForMember(dest => dest._63Min, opt => { opt.MapFrom(src => src._63.Min); opt.Condition(src => src._63 != null); })
                .ForMember(dest => dest._63Max, opt => { opt.MapFrom(src => src._63.Max); opt.Condition(src => src._63 != null); })
                .ForMember(dest => dest._68Min, opt => { opt.MapFrom(src => src._67.Min); opt.Condition(src => src._67 != null); })
                .ForMember(dest => dest._68Max, opt => { opt.MapFrom(src => src._67.Max); opt.Condition(src => src._67 != null); })
                .ForMember(dest => dest._71Min, opt => { opt.MapFrom(src => src._71.Min); opt.Condition(src => src._71 != null); })
                .ForMember(dest => dest._71Max, opt => { opt.MapFrom(src => src._71.Max); opt.Condition(src => src._71 != null); })
                .ForMember(dest => dest._75Min, opt => { opt.MapFrom(src => src._75.Min); opt.Condition(src => src._75 != null); })
                .ForMember(dest => dest._75Max, opt => { opt.MapFrom(src => src._75.Max); opt.Condition(src => src._75 != null); })
                .ForMember(dest => dest._79Min, opt => { opt.MapFrom(src => src._79.Min); opt.Condition(src => src._79 != null); })
                .ForMember(dest => dest._79Max, opt => { opt.MapFrom(src => src._79.Max); opt.Condition(src => src._79 != null); })
                .ForMember(dest => dest._83Min, opt => { opt.MapFrom(src => src._83.Min); opt.Condition(src => src._83 != null); })
                .ForMember(dest => dest._83Max, opt => { opt.MapFrom(src => src._83.Max); opt.Condition(src => src._83 != null); })
                .ForMember(dest => dest._88Min, opt => { opt.MapFrom(src => src._88.Min); opt.Condition(src => src._88 != null); })
                .ForMember(dest => dest._88Max, opt => { opt.MapFrom(src => src._88.Max); opt.Condition(src => src._88 != null); })
                .ForMember(dest => dest._92Min, opt => { opt.MapFrom(src => src._92.Min); opt.Condition(src => src._92 != null); })
                .ForMember(dest => dest._92Max, opt => { opt.MapFrom(src => src._92.Max); opt.Condition(src => src._92 != null); })
                .ForMember(dest => dest._96Min, opt => { opt.MapFrom(src => src._96.Min); opt.Condition(src => src._96 != null); })
                .ForMember(dest => dest._96Max, opt => { opt.MapFrom(src => src._96.Max); opt.Condition(src => src._96 != null); })
                .ForMember(dest => dest._100Min, opt => { opt.MapFrom(src => src._100.Min); opt.Condition(src => src._100 != null); })
                .ForMember(dest => dest._100Max, opt => { opt.MapFrom(src => src._100.Max); opt.Condition(src => src._100 != null); });

            CreateMap<IEnumerable<TownEstimationModel>, EstimationRequestDto>()
                .ForMember(dest => dest.Day, opt => opt.MapFrom(src => src.First().Day))
                .ForMember(dest => dest.Estim, opt => opt.MapFrom(src => src.First(x => !x.IsPlanif)))
                .ForMember(dest => dest.Planif, opt => opt.MapFrom(src => src.First(x => x.IsPlanif)));

            CreateMap<TownEstimationModel, EstimationsDto>()
                .ForMember(dest => dest._0, opt => { opt.MapFrom(src => new EstimationValueDto() { Min = src._0Min.Value, Max = src._0Max.Value }); opt.PreCondition(src => src._0Min.HasValue && src._0Max.HasValue); })
                .ForMember(dest => dest._4, opt => { opt.MapFrom(src => new EstimationValueDto() { Min = src._4Min.Value, Max = src._4Max.Value }); opt.PreCondition(src => src._4Min.HasValue && src._4Max.HasValue); })
                .ForMember(dest => dest._8, opt => { opt.MapFrom(src => new EstimationValueDto() { Min = src._8Min.Value, Max = src._8Max.Value }); opt.PreCondition(src => src._8Min.HasValue && src._8Max.HasValue); })
                .ForMember(dest => dest._13, opt => { opt.MapFrom(src => new EstimationValueDto() { Min = src._13Min.Value, Max = src._13Max.Value }); opt.PreCondition(src => src._13Min.HasValue && src._13Max.HasValue); })
                .ForMember(dest => dest._17, opt => { opt.MapFrom(src => new EstimationValueDto() { Min = src._17Min.Value, Max = src._17Max.Value }); opt.PreCondition(src => src._17Min.HasValue && src._17Max.HasValue); })
                .ForMember(dest => dest._21, opt => { opt.MapFrom(src => new EstimationValueDto() { Min = src._21Min.Value, Max = src._21Max.Value }); opt.PreCondition(src => src._21Min.HasValue && src._21Max.HasValue); })
                .ForMember(dest => dest._25, opt => { opt.MapFrom(src => new EstimationValueDto() { Min = src._25Min.Value, Max = src._25Max.Value }); opt.PreCondition(src => src._25Min.HasValue && src._25Max.HasValue); })
                .ForMember(dest => dest._29, opt => { opt.MapFrom(src => new EstimationValueDto() { Min = src._29Min.Value, Max = src._29Max.Value }); opt.PreCondition(src => src._29Min.HasValue && src._29Max.HasValue); })
                .ForMember(dest => dest._33, opt => { opt.MapFrom(src => new EstimationValueDto() { Min = src._33Min.Value, Max = src._33Max.Value }); opt.PreCondition(src => src._33Min.HasValue && src._33Max.HasValue); })
                .ForMember(dest => dest._38, opt => { opt.MapFrom(src => new EstimationValueDto() { Min = src._38Min.Value, Max = src._38Max.Value }); opt.PreCondition(src => src._38Min.HasValue && src._38Max.HasValue); })
                .ForMember(dest => dest._42, opt => { opt.MapFrom(src => new EstimationValueDto() { Min = src._42Min.Value, Max = src._42Max.Value }); opt.PreCondition(src => src._42Min.HasValue && src._42Max.HasValue); })
                .ForMember(dest => dest._46, opt => { opt.MapFrom(src => new EstimationValueDto() { Min = src._46Min.Value, Max = src._46Max.Value }); opt.PreCondition(src => src._46Min.HasValue && src._46Max.HasValue); })
                .ForMember(dest => dest._50, opt => { opt.MapFrom(src => new EstimationValueDto() { Min = src._50Min.Value, Max = src._50Max.Value }); opt.PreCondition(src => src._50Min.HasValue && src._50Max.HasValue); })
                .ForMember(dest => dest._54, opt => { opt.MapFrom(src => new EstimationValueDto() { Min = src._54Min.Value, Max = src._54Max.Value }); opt.PreCondition(src => src._54Min.HasValue && src._54Max.HasValue); })
                .ForMember(dest => dest._58, opt => { opt.MapFrom(src => new EstimationValueDto() { Min = src._58Min.Value, Max = src._58Max.Value }); opt.PreCondition(src => src._58Min.HasValue && src._58Max.HasValue); })
                .ForMember(dest => dest._63, opt => { opt.MapFrom(src => new EstimationValueDto() { Min = src._63Min.Value, Max = src._63Max.Value }); opt.PreCondition(src => src._63Min.HasValue && src._63Max.HasValue); })
                .ForMember(dest => dest._67, opt => { opt.MapFrom(src => new EstimationValueDto() { Min = src._68Min.Value, Max = src._68Max.Value }); opt.PreCondition(src => src._68Min.HasValue && src._68Max.HasValue); })
                .ForMember(dest => dest._71, opt => { opt.MapFrom(src => new EstimationValueDto() { Min = src._71Min.Value, Max = src._71Max.Value }); opt.PreCondition(src => src._71Min.HasValue && src._71Max.HasValue); })
                .ForMember(dest => dest._75, opt => { opt.MapFrom(src => new EstimationValueDto() { Min = src._75Min.Value, Max = src._75Max.Value }); opt.PreCondition(src => src._75Min.HasValue && src._75Max.HasValue); })
                .ForMember(dest => dest._79, opt => { opt.MapFrom(src => new EstimationValueDto() { Min = src._79Min.Value, Max = src._79Max.Value }); opt.PreCondition(src => src._79Min.HasValue && src._79Max.HasValue); })
                .ForMember(dest => dest._83, opt => { opt.MapFrom(src => new EstimationValueDto() { Min = src._83Min.Value, Max = src._83Max.Value }); opt.PreCondition(src => src._83Min.HasValue && src._83Max.HasValue); })
                .ForMember(dest => dest._88, opt => { opt.MapFrom(src => new EstimationValueDto() { Min = src._88Min.Value, Max = src._88Max.Value }); opt.PreCondition(src => src._88Min.HasValue && src._88Max.HasValue); })
                .ForMember(dest => dest._92, opt => { opt.MapFrom(src => new EstimationValueDto() { Min = src._92Min.Value, Max = src._92Max.Value }); opt.PreCondition(src => src._92Min.HasValue && src._92Max.HasValue); })
                .ForMember(dest => dest._96, opt => { opt.MapFrom(src => new EstimationValueDto() { Min = src._96Min.Value, Max = src._96Max.Value }); opt.PreCondition(src => src._96Min.HasValue && src._96Max.HasValue); })
                .ForMember(dest => dest._100, opt => { opt.MapFrom(src => new EstimationValueDto() { Min = src._100Min.Value, Max = src._100Max.Value }); opt.PreCondition(src => src._100Min.HasValue && src._100Max.HasValue); });

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
