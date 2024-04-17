using AutoMapper;
using Microsoft.EntityFrameworkCore;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Extensions;
using MyHordesOptimizerApi.Models;
using System.Linq;

namespace MyHordesOptimizerApi.MappingProfiles
{
    public class LastUpdateInfoProfile : Profile
    {
        public LastUpdateInfoProfile()
        {
            CreateMap<LastUpdateInfoDto, LastUpdateInfo>()
                .ForMember(model => model.DateUpdate, opt => opt.MapFrom(src => src.UpdateTime))
                .ForMember(model => model.Expeditions, opt => opt.Ignore())
                .ForMember(model => model.IdLastUpdateInfo, opt => opt.Ignore())
                .ForMember(model => model.IdUser, opt => opt.Ignore())
                .ForMember(model => model.IdUserNavigation, opt => opt.MapFrom(src => src))
                .ForMember(model => model.MapCellDigs, opt => opt.Ignore())
                .ForMember(model => model.MapCells, opt => opt.Ignore())
                .ForMember(model => model.TownBankItems, opt => opt.Ignore())
                .ForMember(model => model.TownCadavers, opt => opt.Ignore())
                .ForMember(model => model.TownCitizenIdLastUpdateInfoGhoulStatusNavigations, opt => opt.Ignore())
                .ForMember(model => model.TownCitizenIdLastUpdateInfoHeroicActionNavigations, opt => opt.Ignore())
                .ForMember(model => model.TownCitizenIdLastUpdateInfoHomeNavigations, opt => opt.Ignore())
                .ForMember(model => model.TownCitizenIdLastUpdateInfoNavigations, opt => opt.Ignore())
                .ForMember(model => model.TownCitizenIdLastUpdateInfoStatusNavigations, opt => opt.Ignore())
                .ForMember(model => model.TownEstimations, opt => opt.Ignore());

            CreateMap<LastUpdateInfo, LastUpdateInfoDto>()
                .ForMember(dto => dto.UserId, opt => opt.MapFrom(model => model.IdUser))
                .ForMember(dto => dto.UserName, opt => opt.MapFrom(model => model.IdUserNavigation.Name))
                .ForMember(dto => dto.UpdateTime, opt => opt.MapFrom(model => model.DateUpdate));

            CreateMap<LastUpdateInfoDto, User>()
                .ForMember(user => user.ExpeditionCitizens, opt => opt.Ignore())
                .ForMember(user => user.IdUser, opt => opt.MapFrom(src => src.UserId))
                .ForMember(user => user.LastUpdateInfos, opt => opt.Ignore())
                .ForMember(user => user.MapCellDigs, opt => opt.Ignore())
                .ForMember(user => user.Name, opt => opt.MapFrom((dto, model, srcMember, context) =>
                {
                    var name = dto.UserName;
                    if (string.IsNullOrEmpty(name))
                    {
                        var dbContext = context.GetDbContext();
                        var user = dbContext.Users.AsNoTracking()
                        .First(x => x.IdUser == dto.UserId);
                        name = user.Name;
                    }
                    return name;
                }))
                .ForMember(user => user.TownCadavers, opt => opt.Ignore())
                .ForMember(user => user.TownCitizens, opt => opt.Ignore())
                .ForMember(user => user.UserKey, opt => opt.Ignore())
                .ForMember(user => user.WishlistCategories, opt => opt.Ignore());
        }
    }
}
