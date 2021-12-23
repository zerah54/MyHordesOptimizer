using AutoMapper;
using MyHordesOptimizerApi.Dtos.MyHordes;
using MyHordesOptimizerApi.Dtos.MyHordes.Items;
using MyHordesOptimizerApi.Dtos.MyHordes.MyHordesOptimizer;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using System.Collections.Generic;
using System.Linq;

namespace MyHordesOptimizerApi.MappingProfiles
{
    public class MyHordesMappingProfiles : Profile
    {
        public MyHordesMappingProfiles()
        {
            CreateMap<KeyValuePair<string, MyHordesJsonItem>, Item>()
                .ForMember(dest => dest.JsonIdName, opt => opt.MapFrom(src => src.Key))
                .ForMember(dest => dest.Img, opt => opt.MapFrom(src => src.Value.Img))
                .ForMember(dest => dest.Labels, opt => opt.MapFrom(src => src.Value.Name))
                .ForAllOtherMembers(opt => opt.Ignore());

            CreateMap<MyHordesXmlApiItemDto, Item>()
                .ForMember(dest => dest.Category, opt => opt.MapFrom(src => src.Cat))
                .ForMember(dest => dest.Description, opt => opt.MapFrom(src => src.Text))
                .ForMember(dest => dest.Deco, opt => opt.MapFrom(src => src.Deco))
                .ForMember(dest => dest.Guard, opt => opt.MapFrom(src => src.Guard))
                .ForMember(dest => dest.Img, opt => opt.MapFrom(src => src.Img))
                .ForMember(dest => dest.IsHeaver, opt => opt.MapFrom(src => src.Heavy))
                .ForMember(dest => dest.XmlId, opt => opt.MapFrom(src => src.Id))
                .ForMember(dest => dest.XmlName, opt => opt.MapFrom(src => src.Name))
                .ForAllOtherMembers(opt => opt.Ignore());

            CreateMap<MyHordesMap, Town>()
                .ForMember(dest => dest.Id, opt => opt.MapFrom(src => src.Id))
                .ForMember(dest => dest.MyHordesMap, opt => opt.MapFrom(src => src))
                .ForMember(dest => dest.Citizens, opt => opt.MapFrom(src => src.Citizens.ToDictionary(citizen => citizen.Name, citizen => citizen)))
                .ForAllOtherMembers(opt => opt.Ignore());

            CreateMap<MyHordesCitizen, Citizen>()
                .ForMember(dest => dest.NombreJourHero, opt => opt.Ignore())
                .ForMember(dest => dest.PouvoirsHero, opt => opt.Ignore());
        }
    }
}
