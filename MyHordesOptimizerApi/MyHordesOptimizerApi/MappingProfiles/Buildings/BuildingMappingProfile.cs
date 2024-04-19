using AutoMapper;
using MyHordesOptimizerApi.Dtos.MyHordes.Building;
using MyHordesOptimizerApi.Models;
using System.Collections.Generic;

namespace MyHordesOptimizerApi.MappingProfiles.Buildings
{
    public class BuildingMappingProfile : Profile
    {
        public BuildingMappingProfile()
        {
            CreateMap<KeyValuePair<string, MyHordesApiBuildingDto>, Building>()
                .ForMember(model => model.Breakable, opt => opt.MapFrom(dto => dto.Value.Breakable))
                .ForMember(model => model.BuildingRessources, opt => opt.MapFrom((dto, dest, srcMember, context) =>
                {
                    var buildingRessource = context.Mapper.Map<List<BuildingRessource>>(dto.Value.Resources);
                    buildingRessource.ForEach(ressource => ressource.IdBuilding = dto.Value.Id);
                    return buildingRessource;
                }))
                .ForMember(model => model.Defence, opt => opt.MapFrom(dto => dto.Value.Def))
                .ForMember(model => model.DescriptionDe, opt => opt.MapFrom(src => src.Value.Desc["de"]))
                .ForMember(model => model.DescriptionEn, opt => opt.MapFrom(src => src.Value.Desc["en"]))
                .ForMember(model => model.DescriptionEs, opt => opt.MapFrom(src => src.Value.Desc["es"]))
                .ForMember(model => model.DescriptionFr, opt => opt.MapFrom(src => src.Value.Desc["fr"]))
                .ForMember(model => model.HasUpgrade, opt => opt.MapFrom(dto => dto.Value.HasUpgrade))
                .ForMember(model => model.Icone, opt => opt.MapFrom(dto => dto.Value.Img))
                .ForMember(model => model.IdBuilding, opt => opt.MapFrom(dto => dto.Value.Id))
                .ForMember(model => model.IdBuildingParent, opt => opt.MapFrom(dto => IntToNullable(dto.Value.Parent)))
                .ForMember(model => model.IdBuildingParentNavigation, opt => opt.Ignore())
                .ForMember(model => model.InverseIdBuildingParentNavigation, opt => opt.Ignore())
                .ForMember(model => model.LabelDe, opt => opt.MapFrom(src => src.Value.Name["de"]))
                .ForMember(model => model.LabelEn, opt => opt.MapFrom(src => src.Value.Name["en"]))
                .ForMember(model => model.LabelEs, opt => opt.MapFrom(src => src.Value.Name["es"]))
                .ForMember(model => model.LabelFr, opt => opt.MapFrom(src => src.Value.Name["fr"]))
                .ForMember(model => model.MaxLife, opt => opt.MapFrom(dto => dto.Value.MaxLife))
                .ForMember(model => model.NbPaRequired, opt => opt.MapFrom(dto => dto.Value.Pa))
                .ForMember(model => model.Rarity, opt => opt.MapFrom(dto => dto.Value.Rarity))
                .ForMember(model => model.Temporary, opt => opt.MapFrom(dto => dto.Value.Temporary))
                .ForMember(model => model.Uid, opt => opt.MapFrom(dto => dto.Key))
                .ForMember(model => model.WatchBonus, opt => opt.Ignore());

            CreateMap<MyHordesApiBuildingRessource, BuildingRessource>()
                .ForMember(model => model.Count, opt => opt.MapFrom(dto => dto.Amount))
                .ForMember(model => model.IdBuilding, opt => opt.Ignore())
                .ForMember(model => model.IdBuildingNavigation, opt => opt.Ignore())
                .ForMember(model => model.IdItem, opt => opt.MapFrom(dto => dto.Rsc.Id))
                .ForMember(model => model.IdItemNavigation, opt => opt.Ignore());
        }

        private int? IntToNullable(int parent)
        {
            if (parent == 0)
            {
                return null;
            }
            return parent;
        }
    }
}
