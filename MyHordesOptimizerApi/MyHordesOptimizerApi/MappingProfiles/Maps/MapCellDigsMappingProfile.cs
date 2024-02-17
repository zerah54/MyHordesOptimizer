using AutoMapper;
using Humanizer;
using Microsoft.EntityFrameworkCore;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Map;
using MyHordesOptimizerApi.Extensions;
using MyHordesOptimizerApi.Models;
using System.Linq;

namespace MyHordesOptimizerApi.MappingProfiles.Maps
{
    public class MapCellDigsMappingProfile : Profile
    {
        public MapCellDigsMappingProfile()
        {
            CreateMap<MyHordesOptimizerMapDigDto, MapCellDig>()
                .ForMember(model => model.Day, opt => opt.MapFrom(dto => dto.Day))
                .ForMember(model => model.IdCellNavigation, opt => opt.Ignore())
                .ForMember(model => model.IdCell, opt => opt.MapFrom((dto, model, srcMember, context) =>
                {
                    var dbContext = context.GetDbContext();
                    var townId = context.GetTownId();
                    var cell = dbContext.MapCells.First(mapCell => mapCell.IdTown == townId && mapCell.X == dto.X && mapCell.Y == dto.Y);
                    return cell.IdCell;
                }))
                .ForMember(model => model.IdLastUpdateInfo, opt => opt.MapFrom((dto, model, srcMember, context) => context.GetLastUpdateInfoId()))
                //.ForMember(model => model.IdLastUpdateInfo, opt => opt.Ignore())
                //.ForMember(model => model.IdLastUpdateInfoNavigation, opt => opt.MapFrom(dto => dto.LastUpdateInfo))
                .ForMember(model => model.IdLastUpdateInfoNavigation, opt => opt.Ignore())
                .ForMember(model => model.IdUser, opt => opt.MapFrom(dto => dto.DiggerId))
                .ForMember(model => model.IdUserNavigation, opt => opt.Ignore())
                .ForMember(model => model.NbSucces, opt => opt.MapFrom(dto => dto.NbSucces))
                .ForMember(model => model.NbTotalDig, opt => opt.MapFrom(dto => dto.NbTotalDig));

            CreateMap<MapCellDig, MyHordesOptimizerMapDigDto>()
                .ForMember(dto => dto.CellId, opt => opt.MapFrom(model => model.IdCell))
                .ForMember(dto => dto.Day, opt => opt.MapFrom(model => model.Day))
                .ForMember(dto => dto.DiggerId, opt => opt.MapFrom(model => model.IdUser))
                .ForMember(dto => dto.DiggerName, opt => opt.MapFrom(model => model.IdUserNavigation.Name))
                .ForMember(dto => dto.LastUpdateInfo, opt => opt.MapFrom(model => model.IdLastUpdateInfoNavigation))
                .ForMember(dto => dto.NbSucces, opt => opt.MapFrom(model => model.NbSucces))
                .ForMember(dto => dto.NbTotalDig, opt => opt.MapFrom(model => model.NbTotalDig))
                .ForMember(dto => dto.X, opt => opt.MapFrom(model => model.IdCellNavigation.X))
                .ForMember(dto => dto.Y, opt => opt.MapFrom(model => model.IdCellNavigation.Y));
        }
    }
}
