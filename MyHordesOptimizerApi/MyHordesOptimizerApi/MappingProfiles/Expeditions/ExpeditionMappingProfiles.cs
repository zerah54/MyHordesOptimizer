using AutoMapper;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Bag;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Expeditions;
using MyHordesOptimizerApi.Models;

namespace MyHordesOptimizerApi.MappingProfiles.Expeditions
{
    public class ExpeditionMappingProfiles : Profile
    {
        public ExpeditionMappingProfiles()
        {
            //CreateMap<ExpeditionDto, Expedition>()
            //    .ForMember(dest => dest.MinPdc, opt => opt.MapFrom(src => src.MinPdc))
            //    .ForMember(dest => dest.IdLastUpdateInfo, opt => opt.Ignore())
            //    .ForMember(dest => dest.State, opt => opt.MapFrom(src => src.State))
            //    .ForMember(dest => dest.IdExpedition, opt => opt.MapFrom(src => src.Id))
            //    .ForMember(dest => dest.Day, opt => opt.Ignore())
            //    .ForMember(dest => dest.IdTown, opt => opt.Ignore())
            //    .ForMember(dest => dest.Label, opt => opt.MapFrom(src => src.Label))
            //    .ForMember(dest => dest.Parts, opt => opt.MapFrom(src => src.Parts));

            //CreateMap<ExpeditionPartDto, ExpeditionPart>()
            //    .ForMember(dest => dest.Path, opt => opt.MapFrom(src => src.Path))
            //    .ForMember(dest => dest.Label, opt => opt.MapFrom(src => src.Label))
            //    .ForMember(dest => dest.IdExpeditionPart, opt => opt.Ignore())
            //    .ForMember(dest => dest.IdExpedition, opt => opt.Ignore())
            //    .ForMember(dest => dest.Direction, opt => opt.MapFrom(src => src.Direction))
            //    .ForMember(dest => dest.Orders, opt => opt.MapFrom(src => src.Orders))
            //    .ForMember(dest => dest.ExpeditionCitizens, opt => opt.MapFrom(src => src.Citizens));

            //CreateMap<ExpeditionOrderDto, ExpeditionOrderModel>()
            //    .ForMember(dest => dest.IdExpeditionOrder, opt => opt.MapFrom(src => src.Id))
            //    .ForMember(dest => dest.Text, opt => opt.MapFrom(src => src.Text))
            //    .ForMember(dest => dest.IsDone, opt => opt.MapFrom(src => src.IsDone))
            //    .ForMember(dest => dest.Position, opt => opt.MapFrom(src => src.Position))
            //    .ForMember(dest => dest.Type, opt => opt.MapFrom(src => src.Type))
            //    .ForMember(dest => dest.ExpeditionCitizens, opt => opt.Ignore());

            //CreateMap<ExpeditionCitizenDto, ExpeditionCitizenModel>()
            //    .ForMember(dest => dest.IdExpeditionCitizen, opt => opt.MapFrom(src => src.Id))
            //    .ForMember(dest => dest.Pdc, opt => opt.MapFrom(src => src.Pdc))
            //    .ForMember(dest => dest.PreinscritHeroic, opt => opt.MapFrom(src => src.PreinscritHeroicSkillName))
            //    .ForMember(dest => dest.IsPreinscrit, opt => opt.MapFrom(src => src.Preinscrit))
            //    .ForMember(dest => dest.PreinscritJob, opt => opt.MapFrom(src => src.PreinscritJob))
            //    .ForMember(dest => dest.IdExpeditionBag, opt => opt.Ignore())
            //    .ForMember(dest => dest.IdExpeditionCitizen, opt => opt.Ignore())
            //    .ForMember(dest => dest.IdExpeditionPart, opt => opt.Ignore())
            //    .ForMember(dest => dest.IdUser, opt => opt.MapFrom(src => src.IdUser))
            //    .ForMember(dest => dest.IsThirsty, opt => opt.MapFrom(src => src.IsThirsty))
            //    .ForMember(dest => dest.Orders, opt => opt.MapFrom(src => src.Order))
            //    .ForMember(dest => dest.Items, opt => opt.MapFrom(src => src.Items));

            //CreateMap<BagItemDto, ExpeditionBagItemModel>()
            //    .ForMember(dest => dest.IdItem, opt => opt.MapFrom(src => src.Item.Id))
            //    .ForMember(dest => dest.IdExpeditionBag, opt => opt.Ignore())
            //    .ForMember(dest => dest.IsBroken, opt => opt.MapFrom(src => src.IsBroken))
            //    .ForMember(dest => dest.Count, opt => opt.MapFrom(src => src.Count));
        }
    }
}
