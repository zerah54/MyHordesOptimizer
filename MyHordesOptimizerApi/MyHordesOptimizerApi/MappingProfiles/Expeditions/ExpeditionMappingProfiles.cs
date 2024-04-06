using AutoMapper;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Expeditions;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Expeditions.Request;
using MyHordesOptimizerApi.Extensions;
using MyHordesOptimizerApi.Models;
using System.Linq;

namespace MyHordesOptimizerApi.MappingProfiles.Expeditions
{
    public class ExpeditionMappingProfiles : Profile
    {
        public ExpeditionMappingProfiles()
        {
            CreateMap<Expedition, ExpeditionDto>()
                .ForMember(dto => dto.Id, opt => opt.MapFrom(model => model.IdExpedition))
                .ForMember(dto => dto.Label, opt => opt.MapFrom(model => model.Label))
                .ForMember(dto => dto.MinPdc, opt => opt.MapFrom(model => model.MinPdc))
                .ForMember(dto => dto.Parts, opt => opt.MapFrom(model => model.ExpeditionParts))
                .ForMember(dto => dto.Position, opt => opt.MapFrom(model => model.Position))
                .ForMember(dto => dto.State, opt => opt.MapFrom(model => model.State));
            CreateMap<ExpeditionRequestDto, Expedition>()
                .ForMember(model => model.MinPdc, opt => opt.MapFrom(dto => dto.MinPdc))
                .ForMember(model => model.IdLastUpdateInfo, opt => opt.Ignore())
                .ForMember(model => model.State, opt => opt.MapFrom(dto => dto.State))
                .ForMember(model => model.IdExpedition, opt => opt.MapFrom(dto => dto.Id))
                .ForMember(model => model.Day, opt => opt.Ignore())
                .ForMember(model => model.IdTown, opt => opt.Ignore())
                .ForMember(model => model.Label, opt => opt.MapFrom(dto => dto.Label))
                .ForMember(model => model.ExpeditionParts, opt => opt.MapFrom((src, dest, srcMember, context) =>
                {
                    return context.GetDbContext().ExpeditionParts.Where(part => src.PartsId.Contains(part.IdExpeditionPart)).ToList();
                }))
                .ForMember(model => model.Position, opt => opt.MapFrom(dto => dto.Position));

            CreateMap<ExpeditionPart, ExpeditionPartDto>()
                .ForMember(dto => dto.Citizens, opt => opt.MapFrom(model => model.ExpeditionCitizens))
                .ForMember(dto => dto.Direction, opt => opt.MapFrom(model => model.Direction))
                .ForMember(dto => dto.Id, opt => opt.MapFrom(model => model.IdExpeditionPart))
                .ForMember(dto => dto.Label, opt => opt.MapFrom(model => model.Label))
                .ForMember(dto => dto.Orders, opt => opt.MapFrom(model => model.IdExpeditionOrders))
                .ForMember(dto => dto.Position, opt => opt.MapFrom(model => model.Position))
                .ForMember(dto => dto.Path, opt => opt.MapFrom(model => model.Path));
            CreateMap<ExpeditionPartRequestDto, ExpeditionPart>()
                .ForMember(model => model.Path, opt => opt.MapFrom(dto => dto.Path))
                .ForMember(model => model.Label, opt => opt.MapFrom(dto => dto.Label))
                .ForMember(model => model.IdExpeditionPart, opt => opt.Ignore())
                .ForMember(model => model.IdExpedition, opt => opt.Ignore())
                .ForMember(model => model.Direction, opt => opt.MapFrom(dto => dto.Direction))
                .ForMember(model => model.IdExpeditionOrders, opt => opt.MapFrom((src, dest, srcMember, context) =>
                {
                    return context.GetDbContext().ExpeditionOrders.Where(order => src.OrdersId.Contains(order.IdExpeditionOrder)).ToList();
                }))
                .ForMember(model => model.ExpeditionCitizens, opt => opt.MapFrom((src, dest, srcMember, context) =>
                {
                    return context.GetDbContext().ExpeditionCitizens.Where(citizen => src.CitizensId.Contains(citizen.IdExpeditionCitizen)).ToList();
                }))
                .ForMember(model => model.Position, opt => opt.MapFrom(dto => dto.Position));


            CreateMap<ExpeditionOrderDto, ExpeditionOrder>()
                .ForMember(model => model.IdExpeditionOrder, opt => opt.MapFrom(dto => dto.Id))
                .ForMember(model => model.Text, opt => opt.MapFrom(dto => dto.Text))
                .ForMember(model => model.IsDone, opt => opt.MapFrom(dto => dto.IsDone))
                .ForMember(model => model.Position, opt => opt.MapFrom(dto => dto.Position))
                .ForMember(model => model.Type, opt => opt.MapFrom(dto => dto.Type))
                .ForMember(model => model.IdExpeditionCitizens, opt => opt.Ignore())
                .ReverseMap()
                .ForMember(dto => dto.Id, opt => opt.MapFrom(model => model.IdExpeditionOrder))
                .ForMember(dto => dto.IsDone, opt => opt.MapFrom(model => model.IsDone))
                .ForMember(dto => dto.Position, opt => opt.MapFrom(model => model.Position))
                .ForMember(dto => dto.Text, opt => opt.MapFrom(model => model.Text))
                .ForMember(dto => dto.Type, opt => opt.MapFrom(model => model.Type));

            CreateMap<ExpeditionCitizen, ExpeditionCitizenDto>()
                .ForMember(dto => dto.Id, opt => opt.MapFrom(model => model.IdExpeditionCitizen))
                .ForMember(dto => dto.IdUser, opt => opt.MapFrom(model => model.IdUser))
                .ForMember(dto => dto.IsThirsty, opt => opt.MapFrom(model => model.IsThirsty))
                .ForMember(dto => dto.Bag, opt => opt.MapFrom(model => model.IdExpeditionBagNavigation))
                .ForMember(dto => dto.Orders, opt => opt.MapFrom(model => model.IdExpeditionOrders))
                .ForMember(dto => dto.Pdc, opt => opt.MapFrom(model => model.Pdc))
                .ForMember(dto => dto.Preinscrit, opt => opt.MapFrom(model => model.IsPreinscrit))
                .ForMember(dto => dto.PreinscritHeroicSkillName, opt => opt.MapFrom(model => model.PreinscritHeroic))
                .ForMember(dto => dto.PreinscritJob, opt => opt.MapFrom(model => model.PreinscritJob));
            CreateMap<ExpeditionCitizenRequestDto, ExpeditionCitizen>()
                .ForMember(model => model.IdExpeditionCitizen, opt => opt.MapFrom(dto => dto.Id))
                .ForMember(model => model.Pdc, opt => opt.MapFrom(dto => dto.Pdc))
                .ForMember(model => model.PreinscritHeroic, opt => opt.MapFrom(dto => dto.PreinscritHeroicSkillName))
                .ForMember(model => model.IsPreinscrit, opt => opt.MapFrom(dto => dto.Preinscrit))
                .ForMember(model => model.PreinscritJob, opt => opt.MapFrom(dto => dto.PreinscritJob))
                .ForMember(model => model.IdExpeditionBag, opt => opt.Ignore())
                .ForMember(model => model.IdExpeditionCitizen, opt => opt.Ignore())
                .ForMember(model => model.IdExpeditionPart, opt => opt.Ignore())
                .ForMember(model => model.IdUser, opt => opt.MapFrom(dto => dto.IdUser))
                .ForMember(model => model.IsThirsty, opt => opt.MapFrom(dto => dto.IsThirsty))
                .ForMember(model => model.IdExpeditionOrders, opt => opt.MapFrom((src, dest, srcMember, context) =>
                {
                    return context.GetDbContext().ExpeditionOrders.Where(order => src.OrdersId.Contains(order.IdExpeditionOrder)).ToList();
                }))
                .ForMember(model => model.IdExpeditionBagNavigation, opt => opt.MapFrom((src, dest, srcMember, context) =>
                {
                    return context.GetDbContext().ExpeditionBags.SingleOrDefault(bag => src.BagId == bag.IdExpeditionBag);
                }));

            CreateMap<ExpeditionBagDto, ExpeditionBag>()
                .ForMember(model => model.ExpeditionBagItems, opt => opt.MapFrom(dto => dto.Items))
                .ForMember(model => model.ExpeditionCitizens, opt => opt.Ignore())
                .ForMember(model => model.IdExpeditionBag, opt => opt.MapFrom(dto => dto.IdBag))
                .ReverseMap()
                .ForMember(dto => dto.Items, opt => opt.MapFrom(model => model.ExpeditionBagItems))
                .ForMember(dto => dto.IdBag, opt => opt.MapFrom(model => model.IdExpeditionBag));


            CreateMap<StackableItemDto, ExpeditionBagItem>()
                .ForMember(model => model.IdItem, opt => opt.MapFrom(dto => dto.Item.Id))
                .ForMember(model => model.IdExpeditionBagNavigation, opt => opt.Ignore())
                .ForMember(model => model.IsBroken, opt => opt.MapFrom(dto => dto.IsBroken))
                .ForMember(model => model.Count, opt => opt.MapFrom(dto => dto.Count))
                .ReverseMap()
                .ForMember(dto => dto.Count, opt => opt.MapFrom(model => model.Count))
                .ForMember(dto => dto.IsBroken, opt => opt.MapFrom(model => model.IsBroken))
                .ForMember(dto => dto.Item, opt => opt.MapFrom(model => model.IdItemNavigation))
                .ForMember(dto => dto.WishListCount, opt => opt.Ignore());
        }
    }
}
