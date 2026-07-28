using AutoMapper;
using MyHordesOptimizerApi.Dtos.MyHordes.Building;
using MyHordesOptimizerApi.Extensions;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Buildings;
using MyHordesOptimizerApi.Models;
using System.Collections.Generic;
using System.Linq;

namespace MyHordesOptimizerApi.MappingProfiles.Buildings
{
    /// <summary>
    /// Import du référentiel des bâtiments. Les colonnes de destination non nullables sont
    /// alimentées via <c>.Value</c> volontairement explicite : sur un référentiel, une valeur
    /// absente doit provoquer une exception bruyante à l'import — action admin explicite — plutôt
    /// qu'un 0 silencieux qui fausserait tous les calculs en aval.
    /// </summary>
    public class BuildingMappingProfile : Profile
    {
        public BuildingMappingProfile()
        {
            CreateMap<KeyValuePair<string, MyHordesApiBuildingDto>, Building>()
                .ForMember(model => model.Breakable, opt => opt.MapFrom(dto => dto.Value.Breakable.Value))
                .ForMember(model => model.BuildingRessources, opt => opt.MapFrom((dto, dest, srcMember, context) =>
                {
                    // Une ressource sans objet ni quantité n'est pas une ressource : on l'écarte
                    // plutôt que de créer une ligne pointant l'objet 0 avec une quantité de 0.
                    // IdBuilding n'est PAS renseigné ici : la clé du bâtiment appartient à MHO et
                    // n'est connue qu'une fois la ligne rapprochée. C'est le service d'import qui
                    // la propage.
                    var usableResources = (dto.Value.Resources ?? new List<MyHordesApiBuildingRessource>())
                        .Where(resource => resource.Rsc?.Id != null && resource.Amount.HasValue)
                        .ToList();
                    return context.Mapper.Map<List<BuildingRessource>>(usableResources);
                }))
                .ForMember(model => model.Defence, opt => opt.MapFrom(dto => dto.Value.Def.Value))
                .ForMember(model => model.DescriptionDe, opt => opt.MapFrom(src => src.Value.Desc["de"]))
                .ForMember(model => model.DescriptionEn, opt => opt.MapFrom(src => src.Value.Desc["en"]))
                .ForMember(model => model.DescriptionEs, opt => opt.MapFrom(src => src.Value.Desc["es"]))
                .ForMember(model => model.DescriptionFr, opt => opt.MapFrom(src => src.Value.Desc["fr"]))
                .ForMember(model => model.HasUpgrade, opt => opt.MapFrom(dto => dto.Value.HasUpgrade.Value))
                // L'empreinte de build doit sauter : MyHordes renvoie
                // « building/small_waterhole.467957af.gif », or le dépôt d'images du site ne sert
                // que « building/small_waterhole.gif ». Sans ce nettoyage l'icône tombe en 404 et
                // le navigateur affiche le texte alternatif à sa place.
                .ForMember(model => model.Icone, opt => opt.MapFrom(dto => MyHordesExtensions.RemoveImageFingerprint(dto.Value.Img)))
                // La clé appartient à MHO et n'est PAS celle de MyHordes : celle-ci n'est qu'un
                // auto-incrément de fixtures, instable d'une instance du jeu à l'autre. Le service
                // d'import l'attribue après rapprochement sur le uid.
                .ForMember(model => model.IdBuilding, opt => opt.Ignore())
                .ForMember(model => model.MhId, opt => opt.MapFrom(dto => dto.Value.Id.Value))
                .ForMember(model => model.IsObsolete, opt => opt.Ignore())
                .ForMember(model => model.IdBuildingParent, opt => opt.MapFrom(dto => NoParentToNull(dto.Value.Parent)))
                .ForMember(model => model.IdBuildingParentNavigation, opt => opt.Ignore())
                .ForMember(model => model.InverseIdBuildingParentNavigation, opt => opt.Ignore())
                .ForMember(model => model.LabelDe, opt => opt.MapFrom(src => src.Value.Name["de"]))
                .ForMember(model => model.LabelEn, opt => opt.MapFrom(src => src.Value.Name["en"]))
                .ForMember(model => model.LabelEs, opt => opt.MapFrom(src => src.Value.Name["es"]))
                .ForMember(model => model.LabelFr, opt => opt.MapFrom(src => src.Value.Name["fr"]))
                .ForMember(model => model.MaxLife, opt => opt.MapFrom(dto => dto.Value.MaxLife.Value))
                .ForMember(model => model.NbPaRequired, opt => opt.MapFrom(dto => dto.Value.Pa.Value))
                .ForMember(model => model.Rarity, opt => opt.MapFrom(dto => dto.Value.Rarity.Value))
                // Rang d'affichage du jeu. `.Value` non explicite ici, contrairement aux autres :
                // c'est une donnée de confort, une absence n'a pas à faire échouer tout l'import.
                .ForMember(model => model.DisplayOrder, opt => opt.MapFrom(dto => dto.Value.Order))
                .ForMember(model => model.Temporary, opt => opt.MapFrom(dto => dto.Value.Temporary.Value))
                .ForMember(model => model.Uid, opt => opt.MapFrom(dto => dto.Key))
                .ForMember(model => model.WatchSurvivalBonusUpgradeLevelRequired, opt => opt.Ignore())
                .ForMember(model => model.BuildingWatchSurvivalBonusJobs, opt => opt.Ignore());

            // Sortie vers le site : le référentiel tel que la page « Chantiers » l'affiche.
            CreateMap<Building, BuildingDto>()
                .ForMember(dto => dto.Id, opt => opt.MapFrom(model => model.IdBuilding))
                .ForMember(dto => dto.Img, opt => opt.MapFrom(model => model.Icone))
                .ForMember(dto => dto.ParentId, opt => opt.MapFrom(model => model.IdBuildingParent))
                .ForMember(dto => dto.Pa, opt => opt.MapFrom(model => model.NbPaRequired))
                .ForMember(dto => dto.Label, opt => opt.MapFrom(model => new Dictionary<string, string>()
                {
                    { "fr", model.LabelFr },
                    { "en", model.LabelEn },
                    { "es", model.LabelEs },
                    { "de", model.LabelDe }
                }))
                .ForMember(dto => dto.Description, opt => opt.MapFrom(model => new Dictionary<string, string>()
                {
                    { "fr", model.DescriptionFr },
                    { "en", model.DescriptionEn },
                    { "es", model.DescriptionEs },
                    { "de", model.DescriptionDe }
                }))
                .ForMember(dto => dto.Resources, opt => opt.MapFrom(model => model.BuildingRessources));

            CreateMap<BuildingRessource, BuildingResourceDto>()
                .ForMember(dto => dto.ItemId, opt => opt.MapFrom(model => model.IdItem))
                .ForMember(dto => dto.Count, opt => opt.MapFrom(model => model.Count))
                .ForMember(dto => dto.Uid, opt => opt.MapFrom(model => model.IdItemNavigation.Uid))
                .ForMember(dto => dto.Img, opt => opt.MapFrom(model => model.IdItemNavigation.Img))
                .ForMember(dto => dto.Label, opt => opt.MapFrom(model => new Dictionary<string, string>()
                {
                    { "fr", model.IdItemNavigation.LabelFr },
                    { "en", model.IdItemNavigation.LabelEn },
                    { "es", model.IdItemNavigation.LabelEs },
                    { "de", model.IdItemNavigation.LabelDe }
                }));

            CreateMap<MyHordesApiBuildingRessource, BuildingRessource>()
                .ForMember(model => model.Count, opt => opt.MapFrom(dto => dto.Amount.Value))
                .ForMember(model => model.IdBuilding, opt => opt.Ignore())
                .ForMember(model => model.IdBuildingNavigation, opt => opt.Ignore())
                .ForMember(model => model.IdItem, opt => opt.MapFrom(dto => dto.Rsc.Id.Value))
                .ForMember(model => model.IdItemNavigation, opt => opt.Ignore());
        }

        /// <summary>
        /// MyHordes renvoie <c>0</c> pour « pas de parent ». Un champ absent signifie la même
        /// chose, les deux se traduisent donc par <c>null</c> en base.
        /// </summary>
        private static int? NoParentToNull(int? parent)
        {
            if (parent is null or 0)
            {
                return null;
            }
            return parent;
        }
    }
}
