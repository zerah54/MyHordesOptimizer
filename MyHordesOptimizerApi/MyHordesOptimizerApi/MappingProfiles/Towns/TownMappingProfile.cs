using AutoMapper;
using Microsoft.EntityFrameworkCore;
using MyHordesOptimizerApi.Dtos.MyHordes;
using MyHordesOptimizerApi.Dtos.MyHordes.Items;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Extensions;
using MyHordesOptimizerApi.Extensions.Models;
using MyHordesOptimizerApi.MappingProfiles.Resolvers.MyHordes;
using MyHordesOptimizerApi.Models;
using System.Collections.Generic;
using System.Linq;

namespace MyHordesOptimizerApi.MappingProfiles.Towns
{
    public class TownMappingProfile : Profile
    {

        public TownMappingProfile()
        {
            CreateMap<MyHordesUserDetailsDto, Town>()
                .ForMember(dest => dest.Day, opt => opt.MapFrom(src => src.Map.Days))
                .ForMember(dest => dest.Expeditions, opt => opt.Ignore())
                .ForMember(dest => dest.Height, opt => opt.MapFrom(src => src.Map.Hei))
                // IdTown provisoire = -mapId : un townId réel (import saison) est toujours positif,
                // ça garantit qu'une ligne pas encore migrée ne peut jamais entrer en collision avec
                // une ville déjà connue par son townId stable (mapId recyclé d'une saison à l'autre).
                .ForMember(dest => dest.IdTown, opt => opt.MapFrom(src => -src.MapId.Value))
                .ForMember(dest => dest.IdUserWishListUpdater, opt => opt.Ignore())
                .ForMember(dest => dest.IsChaos, opt => opt.MapFrom(src => src.Map.City.Chaos))
                .ForMember(dest => dest.IsDevasted, opt => opt.MapFrom(src => src.Map.City.Devast))
                .ForMember(dest => dest.IsDoorOpen, opt => opt.MapFrom(src => src.Map.City.Door))
                // La langue de la ville vient de `map.language`, et de LUI SEUL. Le `locale` du
                // joueur qui synchronise n'a aucun rapport avec elle : il décrit le joueur, pas la
                // ville. On l'en déduisait autrefois en supposant les villes ségréguées par langue —
                // supposition abandonnée, la donnée de l'API étant la seule valable.
                .ForMember(dest => dest.Language, opt => opt.MapFrom(src => src.Map.Language))
                .ForMember(dest => dest.Name, opt => opt.MapFrom(src => src.Map.City.Name))
                .ForMember(dest => dest.Season, opt => opt.MapFrom(src => src.Map.Season))
                // Ce mapping ne sert qu'à la CRÉATION d'une ville : il n'y a donc rien à effacer,
                // et les rôles peuvent être écrits sans la garde qu'exige leur mise à jour
                // (cf. TownExtensions.UpdateRolesFromMapDetails). Sans eux ici, ils n'apparaîtraient
                // qu'à la synchronisation suivante.
                .ForMember(dest => dest.IdShaman, opt => opt.MapFrom(src => src.Map.Shaman))
                .ForMember(dest => dest.IdGuide, opt => opt.MapFrom(src => src.Map.Guide))
                .ForMember(dest => dest.IdCata, opt => opt.MapFrom(src => src.Map.Cata))
                .ForMember(dest => dest.TownTypeId, opt => opt.MapFrom(src => (int?)TownExtensions.MapTownType(src.Map.City.Type)))
                .ForMember(dest => dest.PhaseId, opt => opt.MapFrom(src => (int?)TownExtensions.MapTownPhase(src.Map.Phase)))
                .ForMember(dest => dest.MapCellDigUpdates, opt => opt.Ignore())
                .ForMember(dest => dest.MapCells, opt => opt.Ignore())
                .ForMember(dest => dest.TownBankItems, opt => opt.MapFrom((src, dest, srcMember, context) =>
                {
                    var results = new List<TownBankItem>();
                    foreach (var myHordesBank in src.Map.City.Bank)
                    {
                        var model = context.Mapper.Map<TownBankItem>(myHordesBank);
                        if (model.IdItemNavigation == null)
                        {
                            // Objet que notre référentiel ne connaît pas encore : la ligne est
                            // écartée plutôt que rattachée à une clé inventée, qui violerait la
                            // contrainte de clé étrangère et ferait échouer toute la synchronisation.
                            continue;
                        }
                        model.IdLastUpdateInfo = src.Map.LastUpdateInfo.IdLastUpdateInfo;
                        model.IdLastUpdateInfoNavigation = src.Map.LastUpdateInfo;
                        model.IdTown = -src.MapId.Value;
                        results.Add(model);
                    }
                    return results;
                }))
                .ForMember(dest => dest.TownCitizens, opt => opt.MapFrom((src, dest, srcMember, context) =>
                {
                    var results = new List<TownCitizen>();
                    foreach (var myHordeCitizen in src.Map.Citizens)
                    {
                        var model = context.Mapper.Map<TownCitizen>(myHordeCitizen);
                        model.IdLastUpdateInfo = src.Map.LastUpdateInfo.IdLastUpdateInfo;
                        model.IdLastUpdateInfoNavigation = src.Map.LastUpdateInfo;
                        model.IdTown = -src.MapId.Value;
                        results.Add(model);
                    }
                    return results;
                }))
                .ForMember(dest => dest.TownCadavers, opt => opt.MapFrom((src, dest, srcMember, context) =>
                {
                    var results = new List<TownCadaver>();
                    // IdUser est une clé : un cadavre sans id n'identifie personne et ferait
                    // s'effondrer toutes les lignes concernées sur IdUser = 0.
                    foreach (var myHordeCadaver in src.Map.Cadavers.Where(cadaver => cadaver.Id.HasValue))
                    {
                        var model = context.Mapper.Map<TownCadaver>(myHordeCadaver);
                        model.IdLastUpdateInfo = src.Map.LastUpdateInfo.IdLastUpdateInfo;
                        model.IdLastUpdateInfoNavigation = src.Map.LastUpdateInfo;
                        model.IdTown = -src.MapId.Value;
                        results.Add(model);
                    }
                    return results;
                }))
                .ForMember(dest => dest.TownEstimations, opt => opt.Ignore())
                .ForMember(dest => dest.TownWishListItems, opt => opt.Ignore())
                .ForMember(dest => dest.WaterWell, opt => opt.MapFrom(src => src.Map.City.Water))
                .ForMember(dest => dest.Width, opt => opt.MapFrom(src => src.Map.Wid))
                .ForMember(dest => dest.WishlistDateUpdate, opt => opt.Ignore())
                .ForMember(dest => dest.X, opt => opt.MapFrom(src => src.Map.City.X))
                .ForMember(dest => dest.Y, opt => opt.MapFrom(src => src.Map.City.Y));

            CreateMap<MyHordesItem, TownBankItem>()
                .ForMember(dest => dest.Count, opt => opt.MapFrom(src => src.Count))
                .ForMember(dest => dest.IdItem, opt => opt.MapFrom((src, dest, srcMember, context) => ResoudreObjet(context, src.Id)?.IdItem ?? 0))
                .ForMember(dest => dest.IdItemNavigation, opt => opt.MapFrom((src, dest, srcMember, context) => ResoudreObjet(context, src.Id)))
                .ForMember(dest => dest.IdLastUpdateInfo, opt => opt.Ignore())
                .ForMember(dest => dest.IdLastUpdateInfoNavigation, opt => opt.Ignore())
                .ForMember(dest => dest.IdTown, opt => opt.Ignore())
                .ForMember(dest => dest.IdTownNavigation, opt => opt.Ignore())
                .ForMember(dest => dest.IsBroken, opt => opt.MapFrom(src => src.Broken));

            CreateMap<MyHordesUserDto, TownCitizen>()
                .ForMember(dest => dest.Apagcharges, opt => opt.Ignore())
                .ForMember(dest => dest.ChestLevel, opt => opt.Ignore())
                .ForMember(dest => dest.Dead, opt => opt.MapFrom(src => src.Dead))
                .ForMember(dest => dest.GhoulVoracity, opt => opt.Ignore())
                .ForMember(dest => dest.HasAlarm, opt => opt.Ignore())
                .ForMember(dest => dest.HasBreakThrough, opt => opt.Ignore())
                .ForMember(dest => dest.HasBrotherInArms, opt => opt.Ignore())
                .ForMember(dest => dest.HasCheatDeath, opt => opt.Ignore())
                .ForMember(dest => dest.HasCurtain, opt => opt.Ignore())
                .ForMember(dest => dest.HasFence, opt => opt.Ignore())
                .ForMember(dest => dest.HasHeroicReturn, opt => opt.Ignore())
                .ForMember(dest => dest.HasLock, opt => opt.Ignore())
                .ForMember(dest => dest.HasLuckyFind, opt => opt.Ignore())
                .ForMember(dest => dest.HasRescue, opt => opt.Ignore())
                .ForMember(dest => dest.HasUppercut, opt => opt.Ignore())
                .ForMember(dest => dest.HomeMessage, opt => opt.MapFrom(src => src.HomeMessage))
                .ForMember(dest => dest.HouseDefense, opt => opt.MapFrom(src => src.BaseDef))
                // Déduit de `baseDef`, que MyHordes sert pour TOUS les citoyens : le niveau n'a
                // jamais eu à être saisi. Null quand la défense est absente ou hors table — la
                // fusion en `ignoreNull` laisse alors la valeur connue en place.
                .ForMember(dest => dest.HouseLevel, opt => opt.MapFrom(src => MyHordesExtensions.NiveauDeMaisonDepuisDefense(src.BaseDef)))
                .ForMember(dest => dest.IdBag, opt => opt.Ignore())
                .ForMember(dest => dest.IdBagNavigation, opt => opt.Ignore())
                .ForMember(dest => dest.IdLastUpdateInfo, opt => opt.Ignore())
                .ForMember(dest => dest.IdLastUpdateInfoGhoulStatus, opt => opt.Ignore())
                .ForMember(dest => dest.IdLastUpdateInfoGhoulStatusNavigation, opt => opt.Ignore())
                .ForMember(dest => dest.IdLastUpdateInfoHeroicAction, opt => opt.Ignore())
                .ForMember(dest => dest.IdLastUpdateInfoHeroicActionNavigation, opt => opt.Ignore())
                .ForMember(dest => dest.IdLastUpdateInfoHome, opt => opt.Ignore())
                .ForMember(dest => dest.IdLastUpdateInfoHomeNavigation, opt => opt.Ignore())
                .ForMember(dest => dest.IdLastUpdateInfoNavigation, opt => opt.Ignore())
                .ForMember(dest => dest.IdLastUpdateInfoStatus, opt => opt.Ignore())
                .ForMember(dest => dest.IdLastUpdateInfoStatusNavigation, opt => opt.Ignore())
                .ForMember(dest => dest.IdTown, opt => opt.Ignore())
                .ForMember(dest => dest.IdTownNavigation, opt => opt.Ignore())
                .ForMember(dest => dest.IdUser, opt => opt.MapFrom(src => src.Id))
                .ForMember(dest => dest.IdUserNavigation, opt => opt.MapFrom<MyHordeCitizenToUserValueResolver>())
                .ForMember(dest => dest.IsAddict, opt => opt.Ignore())
                .ForMember(dest => dest.IsArmWounded, opt => opt.Ignore())
                .ForMember(dest => dest.IsCamper, opt => opt.Ignore())
                .ForMember(dest => dest.IsCheatingDeathActive, opt => opt.Ignore())
                .ForMember(dest => dest.IsCleanBody, opt => opt.Ignore())
                .ForMember(dest => dest.IsConvalescent, opt => opt.Ignore())
                .ForMember(dest => dest.IsDesy, opt => opt.Ignore())
                .ForMember(dest => dest.IsDrugged, opt => opt.Ignore())
                .ForMember(dest => dest.IsDrunk, opt => opt.Ignore())
                .ForMember(dest => dest.IsEyeWounded, opt => opt.Ignore())
                .ForMember(dest => dest.IsFootWounded, opt => opt.Ignore())
                .ForMember(dest => dest.IsGhoul, opt => opt.Ignore())
                .ForMember(dest => dest.IsHandWounded, opt => opt.Ignore())
                .ForMember(dest => dest.IsHeadWounded, opt => opt.Ignore())
                .ForMember(dest => dest.IsHungOver, opt => opt.Ignore())
                .ForMember(dest => dest.IsImmune, opt => opt.Ignore())
                .ForMember(dest => dest.IsInfected, opt => opt.Ignore())
                .ForMember(dest => dest.IsLegWounded, opt => opt.Ignore())
                .ForMember(dest => dest.IsQuenched, opt => opt.Ignore())
                .ForMember(dest => dest.IsSated, opt => opt.Ignore())
                .ForMember(dest => dest.IsShunned, opt => opt.MapFrom(src => src.Ban))
                .ForMember(dest => dest.IsTerrorised, opt => opt.Ignore())
                .ForMember(dest => dest.IsThirsty, opt => opt.Ignore())
                .ForMember(dest => dest.IsTired, opt => opt.Ignore())
                .ForMember(dest => dest.JobName, opt => opt.MapFrom(src => src.Job.Name))
                .ForMember(dest => dest.JobUid, opt => opt.MapFrom(src => src.Job.Uid))
                .ForMember(dest => dest.KitchenLevel, opt => opt.Ignore())
                .ForMember(dest => dest.LaboLevel, opt => opt.Ignore())
                .ForMember(dest => dest.PositionX, opt => opt.MapFrom(src => src.X))
                .ForMember(dest => dest.PositionY, opt => opt.MapFrom(src => src.Y))
                .ForMember(dest => dest.RenfortLevel, opt => opt.Ignore())
                .ForMember(dest => dest.RestLevel, opt => opt.Ignore());

            CreateMap<MyHordesUserDto, User>()
                .ForMember(dest => dest.ExpeditionCitizens, opt => opt.Ignore())
                .ForMember(dest => dest.IdUser, opt => opt.MapFrom(src => src.Id))
                .ForMember(dest => dest.LastUpdateInfos, opt => opt.Ignore())
                .ForMember(dest => dest.MapCellDigs, opt => opt.Ignore())
                .ForMember(dest => dest.Name, opt => opt.MapFrom(src => src.Name))
                .ForMember(dest => dest.TownCadavers, opt => opt.Ignore())
                .ForMember(dest => dest.TownCitizens, opt => opt.Ignore())
                .ForMember(dest => dest.WishlistCategories, opt => opt.Ignore());

            // Les colonnes nullables sont écrites SOUS GARDE : les chaînes `fields=` ne font pas
            // partie du contrat, et ce DTO sert à quatre projections différentes (map.cadavers,
            // /json/map, towns.citizens, playedMaps) dont les champs demandés diffèrent. Un champ
            // absent ne doit jamais écraser une valeur déjà connue en base.
            CreateMap<MyHordesCitizenRankingDto, TownCadaver>()
                .ForMember(model => model.CauseOfDeath, opt =>
                {
                    opt.MapFrom(dto => dto.Dtype);
                    opt.Condition(dto => dto.Dtype != null);
                })
                .ForMember(model => model.CauseOfDeathNavigation, opt => opt.Ignore())
                .ForMember(model => model.CleanUp, opt => opt.Ignore())
                .ForMember(model => model.CleanUpNavigation, opt => opt.Ignore())
                .ForMember(model => model.DeathMessage, opt => opt.MapFrom(dto => dto.Msg))
                .ForMember(model => model.IdLastUpdateInfo, opt => opt.Ignore())
                .ForMember(model => model.IdLastUpdateInfoNavigation, opt => opt.Ignore())
                .ForMember(model => model.IdTown, opt => opt.Ignore())
                .ForMember(model => model.IdTownNavigation, opt => opt.Ignore())
                .ForMember(model => model.IdUser, opt => opt.MapFrom(dto => dto.Id.Value))
                .ForMember(model => model.IdUserNavigation, opt => opt.MapFrom((src, dest, srcMember, context) =>
                {
                    var dbContext = context.GetDbContext();
                    var dbUser = dbContext.Users.FirstOrDefault(x => x.IdUser == src.Id);
                    if (dbUser == null)
                    {
                        var user = new User()
                        {
                            IdUser = src.Id.Value,
                            Name = src.Name,
                            Avatar = src.Avatar
                        };
                        dbContext.Add(user);
                    }
                    else
                    {
                        // Name n'est volontairement PAS rafraîchi ici : getCadaversInformation renvoie
                        // `getAlias() ?? getUser()->getName()`, donc un nom d'emprunt dans les villes à
                        // alias, qui écraserait le pseudo réel partout (name ne vit que sur User). Seuls
                        // les chemins getUserData font autorité. L'avatar, lui, est toujours celui du User.
                        if (!string.IsNullOrEmpty(src.Avatar))
                        {
                            dbUser.Avatar = src.Avatar;
                        }
                    }
                    return dbUser;
                }))
                .ForMember(model => model.SoulPoints, opt =>
                {
                    // `sp`, et non `score` : celui-ci est le score de la VILLE, que MyHordes recopie
                    // sur chaque cadavre. Il vit sur Town.Score. Absent de plusieurs projections
                    // (/json/towns ne le sert jamais), d'où la condition : une source muette ne doit
                    // pas effacer ce qu'une autre a renseigné.
                    opt.MapFrom(dto => dto.Sp);
                    opt.Condition(dto => dto.Sp != null);
                })
                .ForMember(model => model.SurvivalDay, opt =>
                {
                    // Absent de playedMaps, qui utilise pourtant ce même DTO.
                    opt.MapFrom(dto => dto.Survival);
                    opt.Condition(dto => dto.Survival != null);
                })
                .ForMember(model => model.TownMessage, opt => opt.MapFrom(dto => dto.Comment));
        }

        /// <summary>
        /// Traduit un identifiant d'objet reçu de MyHordes en objet de notre référentiel.
        /// </summary>
        /// <remarks>
        /// Le rapprochement se fait sur <c>mhId</c> et non sur la clé : l'identifiant de MyHordes
        /// est un auto-incrément de fixtures, qui change d'une instance du jeu à l'autre. Les deux
        /// coïncident aujourd'hui pour les objets — c'est cette coïncidence qu'on cesse de
        /// supposer. Un objet dont le <c>mhId</c> n'est pas encore renseigné est lu sous sa clé :
        /// c'est ce qu'elle signifiait avant le découplage.
        /// </remarks>
        private static Item ResoudreObjet(ResolutionContext context, int? mhId)
        {
            if (!mhId.HasValue)
            {
                return null;
            }
            return context.GetAllItems().FirstOrDefault(item => (item.MhId ?? item.IdItem) == mhId.Value);
        }
    }
}
