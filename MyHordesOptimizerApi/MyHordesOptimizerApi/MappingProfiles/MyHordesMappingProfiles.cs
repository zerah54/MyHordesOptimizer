using AutoMapper;
using MyHordesOptimizerApi.Dtos.MyHordes;
using MyHordesOptimizerApi.Dtos.MyHordes.Items;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Citizens;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.Bags;
using MyHordesOptimizerApi.Extensions;
using MyHordesOptimizerApi.MappingProfiles.Resolvers;
using MyHordesOptimizerApi.Models;
using MyHordesOptimizerApi.Extensions.Models;

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

            CreateMap<MyHordesUserDto, CitizenDto>()
                .ForMember(dest => dest.NombreJourHero, opt => opt.Ignore());

            CreateMap<MyHordesUserDetailsDto, SimpleMeDto>()
                .ForMember(dest => dest.Id, opt => opt.MapFrom(src => src.Id))
                .ForMember(dest => dest.UserName, opt => opt.MapFrom(src => src.Name))
                .ForMember(dest => dest.TownDetails, opt => opt.MapFrom(src => src))
                .ForMember(dest => dest.JobDetails, opt => opt.MapFrom(src => src))
                .ForMember(dest => dest.Avatar, opt => opt.MapFrom(src => src.Avatar));

            CreateMap<MyHordesUserDetailsDto, SimpleMeTownDetailDto>()
                .ForMember(dest => dest.TownId, opt => { opt.MapFrom(src => src.Map.Id); opt.Condition(src => src.Map != null); })
                .ForMember(dest => dest.TownX, opt => { opt.MapFrom(src => src.Map.City.X); opt.Condition(src => src.Map != null && src.Map.City != null); })
                .ForMember(dest => dest.TownY, opt => { opt.MapFrom(src => src.Map.City.Y); opt.Condition(src => src.Map != null && src.Map.City != null); })
                .ForMember(dest => dest.TownMaxX, opt => { opt.MapFrom(src => src.Map.Wid); opt.Condition(src => src.Map != null); })
                .ForMember(dest => dest.TownMaxY, opt => { opt.MapFrom(src => src.Map.Hei); opt.Condition(src => src.Map != null); })
                .ForMember(dest => dest.IsChaos, opt => { opt.MapFrom(src => src.Map.City.Chaos); opt.Condition(src => src.Map != null && src.Map.City != null); })
                .ForMember(dest => dest.IsDevaste, opt => { opt.MapFrom(src => src.Map.City.Devast); opt.Condition(src => src.Map != null && src.Map.City != null); })
                .ForMember(dest => dest.TownType, opt => { opt.MapFrom(src => src.Map.GetTownType()); })
                .ForMember(dest => dest.Day, opt => { opt.MapFrom(src => src.Map.Days); })
                // Même règle que l'écriture en base, via le même point : le site et la base doivent
                // dire la même chose de l'option d'API externe.
                .ForMember(dest => dest.HasExternalApi, opt => opt.MapFrom(src => TownExtensions.DeduireApiExterne(src.Map)));

            CreateMap<MyHordesUserDetailsDto, SimpleMeJobDetailDto>()
                .ForMember(dest => dest.Id, opt => { opt.MapFrom(src => src.Job.Id); opt.Condition(src => src.Job != null); })
                .ForMember(dest => dest.Uid, opt => { opt.MapFrom(src => src.Job.Uid); opt.Condition(src => src.Job != null); })
                .ForMember(dest => dest.Label, opt => { opt.MapFrom(src => src.Job.Name.ToMhoDictionnary()); opt.Condition(src => src.Job != null); })
                .ForMember(dest => dest.Description, opt => { opt.MapFrom(src => src.Job.Desc.ToMhoDictionnary()); opt.Condition(src => src.Job != null); });


            CreateMap<MyHordesItem, UpdateObjectDto>()
                .ForMember(dest => dest.IsBroken, opt => opt.MapFrom(src => src.Broken))
                .ForMember(dest => dest.Count, opt => opt.MapFrom(src => src.Count))
                .ForMember(dest => dest.Id, opt => opt.MapFrom(src => src.Id));

        }
    }
}
