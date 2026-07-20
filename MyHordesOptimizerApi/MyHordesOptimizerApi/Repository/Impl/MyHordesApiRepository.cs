using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.Configuration.Interfaces;
using MyHordesOptimizerApi.Dtos.MyHordes;
using MyHordesOptimizerApi.Dtos.MyHordes.Building;
using MyHordesOptimizerApi.Dtos.MyHordes.Items;
using MyHordesOptimizerApi.Dtos.MyHordes.Me;
using MyHordesOptimizerApi.Dtos.MyHordes.Town;
using MyHordesOptimizerApi.Providers.Interfaces;
using MyHordesOptimizerApi.Repository.Abstract;
using MyHordesOptimizerApi.Repository.Interfaces;
using System.Collections.Generic;
using System.Net.Http;
using System.Threading.Tasks;

namespace MyHordesOptimizerApi.Repository.Impl
{
    public class MyHordesApiRepository : AbstractMyHordeRepositoryBase, IMyHordesApiRepository
    {
        public override string HttpClientName => nameof(MyHordesApiRepository);

        protected override string BaseEndpoint => "json";

        public MyHordesApiRepository(ILogger<MyHordesApiRepository> logger,
            IHttpClientFactory httpClientFactory,
            IMyHordesApiConfiguration myHordesApiConfiguration,
            IUserInfoProvider userKeyProvider) : base(logger, httpClientFactory, myHordesApiConfiguration, userKeyProvider)
        {
        }

        public Dictionary<string, MyHordesItem> GetItems()
        {
            var url = GenerateUrl(EndpointItems);
            url = AddParameterToQuery(url, _parameterFields, "id,name,count,broken,img,cat,heavy,deco,guard,desc");
            return base.Get<Dictionary<string, MyHordesItem>>(url);
        }

        // `rewards` est demandé NU dans cadavers (et non `rewards.fields(...)`) : côté MyHordes la
        // branche gérant les sous-champs est commentée et renverrait un objet vide sans erreur.
        // Il n'est volontairement PAS demandé dans playedMaps : ce champ coûte une requête SQL par
        // ville chez eux (>100 pour un vétéran) et cet appel part à chaque synchronisation.
        // L'historique par ville passe par l'import dédié, à la demande.
        public MyHordesMeResponseDto GetMe()
        {
            var url = GenerateUrl(EndpointMe);
            url = AddParameterToQuery(url, _parameterFields, "id,name,isGhost,locale,twinId,mapId,map.fields(id,date,wid,hei,conspiracy,bonusPts,days,custom,zones.fields(x,y,nvt,tag,danger,details.fields(z,h,dried),items.fields(uid,id,count,broken),building.fields(type,dig,camped,dried)),citizens.fields(id,name,isGhost,twinId,mapId,homeMessage,avatar,hero,job.fields(uid,name,id,desc),dead,out,baseDef,ban,x,y),city.fields(name,water,x,y,door,chaos,hard,devast,chantiers.fields(id,icon,name,pa,maxLife,votes,breakable,def,resources.fields(amount,rsc.fields(id,name)),actions,hasLevels),buildings.fields(id,name,life,maxLife,breakable,def,hasUpgrade,rarity,temporary,parent,actions,hasLevels),news.fields(z,def,content,regenDir,water),defense.fields(total,base,buildings,upgrades,items,itemsMul,citizenHomes,citizenGuardians,watchmen,souls,temp,cadavers,guardiansInfos.fields(gardians,def),bonus),upgrades.fields(total,list.fields(name,level,update,buildingId)),estimations.fields(days,min,max,maxed),estimationsNext.fields(days,min,max,maxed),bank.fields(uid,id,count,broken)),cadavers.fields(id,name,avatar,survival,origin,score,dtype,comment,msg,cleanup.fields(user,type),rewards),expeditions.fields(name,author.fields(id),length,points.fields(x,y)),season,shaman,guide),homeMessage,avatar,hero,job.fields(uid,name,id,desc),dead,out,baseDef,ban,x,y,rewards.fields(id,number),playedMaps.fields(mapId,mapName,season,phase,score,type,day)");
            var response = base.Get<MyHordesMeResponseDto>(url);
            UserKeyProvider.UserId = response.Id;
            UserKeyProvider.UserName = response.Name;
            return response;
        }

        // Référentiel complet des pictos. Dictionnaire indexé par le NOM du prototype (« r_ripflash_#00 »),
        // pas par son id. Seule source de `community`, absent du champ `rewards` des joueurs.
        public Dictionary<string, MyHordesApiPictoDto> GetPictos()
        {
            var url = GenerateUrl(EndpointPictos);
            url = AddParameterToQuery(url, _parameterFields, "id,img,name,desc,community,rare");
            return base.Get<Dictionary<string, MyHordesApiPictoDto>>(url);
        }

        // Total des pictos d'un joueur + détail par ville de tout son historique, en un seul appel.
        // Fonctionne pour n'importe quel joueur (le champ n'est pas réservé au compte connecté), avec
        // la userkey de l'appelant.
        // APPEL LOURD : `rewards` dans playedMaps coûte une requête SQL par ville côté MyHordes (>100
        // pour un vétéran) et n'y est pas caché. À ne déclencher qu'à la demande, jamais en routine.
        // `rewards` de playedMaps doit rester NU : avec des sous-champs, MyHordes renvoie un objet vide.
        public MyHordesUserPictosDto GetUserPictos(int userId)
        {
            var url = GenerateUrl(EndpointUser);
            url = AddParameterToQuery(url, "id", userId.ToString());
            // `rewards` du joueur porte les libellés (4 langues) : ils alimentent le référentiel Picto.
            // `titles` et `comments` en sont volontairement exclus — chacun déclenche des requêtes
            // supplémentaires côté MyHordes, et on n'en fait rien.
            url = AddParameterToQuery(url, _parameterFields, "id,rewards.fields(id,rare,number,img,name,desc),playedMaps.fields(mapId,mapName,season,phase,score,type,day,rewards)");
            return base.Get<MyHordesUserPictosDto>(url);
        }

        // Identité de N joueurs quelconques en un appel. getUsersAPI ne tronque PAS la liste d'ids
        // (contrairement à /json/towns, limité à 50), mais fait un findOneBy par joueur : on batche
        // donc côté appelant. Seuls les champs légers sont demandés — playedMaps et rewards
        // coûteraient une requête SQL par ville et par joueur.
        public List<MyHordesUserIdentityDto> GetUsersIdentity(List<int> ids)
        {
            if (ids == null || ids.Count == 0)
            {
                return new List<MyHordesUserIdentityDto>();
            }

            var url = GenerateUrl(EndpointUsers);
            url = AddParameterToQuery(url, "ids", string.Join(",", ids));
            url = AddParameterToQuery(url, _parameterFields, "id,name,avatar");
            return base.Get<List<MyHordesUserIdentityDto>>(url);
        }

        public Dictionary<string, MyHordesApiRuinDto> GetRuins()
        {
            var url = GenerateUrl(EndpointRuins);
            url = AddParameterToQuery(url, _parameterFields, "id,name,desc,explorable,img");
            return base.Get<Dictionary<string, MyHordesApiRuinDto>>(url);
        }

        public Task<Dictionary<string, MyHordesApiBuildingDto>> GetBuildingAsync()
        {
            var url = GenerateUrl(EndpointBuilding);
            url = AddParameterToQuery(url, _parameterFields, "id,img,name,desc,pa,maxLife,breakable,def,hasUpgrade,rarity,temporary,parent,resources");
            return Task.FromResult(base.Get<Dictionary<string, MyHordesApiBuildingDto>>(url));
        }

        public List<int> GetTownList(int? season = null)
        {
            var url = GenerateUrl(EndpointTownList);
            if (season.HasValue)
            {
                url = AddParameterToQuery(url, "season", season.Value.ToString());
            }
            var response = base.Get<MyHordesTownListResponseDto>(url);
            return response?.Towns ?? new List<int>();
        }

        public List<MyHordesTownDetailsDto> GetTownDetails(List<int> ids)
        {
            if (ids == null || ids.Count == 0)
                return new List<MyHordesTownDetailsDto>();

            var url = GenerateUrl(EndpointTowns);
            url = AddParameterToQuery(url, "ids", string.Join(",", ids));
            // ⚠️ Testé en réel le 2026-07-09 sur myhordes.de ET myhordes.eu : le déployé N'expose PAS les
            // points d'âme (pas de `sp`, et `citizens.score` = le score de la VILLE répété, pas un score
            // d'âme individuel) — on ne les demande donc plus. wid/hei/city ne sont pas non plus exposés ici
            // (endpoint ranking) : Taille/Type ne viennent que de /json/map (ville live).
            url = AddParameterToQuery(url, _parameterFields,
                "id,mapId,day,mapName,language,season,phase,score,citizens.fields(id,name,survival,avatar,dtype,score,msg,comment)");
            return base.Get<List<MyHordesTownDetailsDto>>(url);
        }

        public MyHordesMap GetMapDetails(int mapId)
        {
            var url = GenerateUrl(EndpointMap);
            url = AddParameterToQuery(url, "mapId", mapId.ToString());
            url = AddParameterToQuery(url, _parameterFields,
                "season,phase,wid,hei,city.fields(type,chaos,devast,door,water,x,y),citizens.fields(id,name,avatar,homeMessage),cadavers.fields(id,name,avatar,survival,score,dtype,msg,comment)");
            return base.Get<MyHordesMap>(url);
        }
    }
}