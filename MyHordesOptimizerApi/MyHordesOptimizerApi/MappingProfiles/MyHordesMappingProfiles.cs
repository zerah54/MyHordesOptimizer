using AutoMapper;
using MyHordesOptimizerApi.Data.Ruins;
using MyHordesOptimizerApi.Dtos.MyHordes;
using MyHordesOptimizerApi.Dtos.MyHordes.Me;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.MappingProfiles.Resolvers;
using System.Collections.Generic;

namespace MyHordesOptimizerApi.MappingProfiles
{
    public class MyHordesMappingProfiles : Profile
    {
        public MyHordesMappingProfiles()
        {
            CreateMap<MyHordesMap, Town>()
                .ForMember(dest => dest.Id, opt => opt.MapFrom(src => src.Id))
                .ForMember(dest => dest.MyHordesMap, opt => opt.MapFrom(src => src))
                //.ForMember(dest => dest.Citizens, opt => opt.MapFrom(src => src.Citizens.ToDictionary(citizen => citizen.Name, citizen => citizen)))
                .ForMember(dest => dest.Citizens, opt => opt.MapFrom<TownCitizensResolver>())
                .ForMember(dest => dest.Bank, opt => opt.MapFrom<TownBankResolver>());

            CreateMap<MyHordesCitizen, Citizen>()
                .ForMember(dest => dest.NombreJourHero, opt => opt.Ignore());

            CreateMap<MyHordesMeResponseDto, SimpleMe>()
                .ForMember(dest => dest.Id, opt => opt.MapFrom(src => src.Id))
                .ForMember(dest => dest.UserName, opt => opt.MapFrom(src => src.Name))
                .ForMember(dest => dest.TownDetails, opt => opt.MapFrom(src => src));

            CreateMap<MyHordesMeResponseDto, SimpleMeTownDetailDto>()
                .ForMember(dest => dest.TownId, opt => { opt.MapFrom(src => src.Map.Id); opt.Condition(src => src.Map != null); })
                .ForMember(dest => dest.TownX, opt => { opt.MapFrom(src => src.Map.City.X); opt.Condition(src => src.Map != null && src.Map.City != null); })
                .ForMember(dest => dest.TownY, opt => { opt.MapFrom(src => src.Map.City.Y); opt.Condition(src => src.Map != null && src.Map.City != null); })
                .ForMember(dest => dest.TownMaxX, opt => { opt.MapFrom(src => src.Map.Wid); opt.Condition(src => src.Map != null); })
                .ForMember(dest => dest.TownMaxY, opt => { opt.MapFrom(src => src.Map.Hei); opt.Condition(src => src.Map != null); })
                .ForMember(dest => dest.IsDevaste, opt => { opt.MapFrom(src => src.Map.City.Devast); opt.Condition(src => src.Map != null && src.Map.City != null); });

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


        }

        private object GetNameIdFromImg(string img)
        {
            var sub = img.Substring(img.IndexOf("/") + 1);
            return sub.Split(".")[0];
        }
    }
}
