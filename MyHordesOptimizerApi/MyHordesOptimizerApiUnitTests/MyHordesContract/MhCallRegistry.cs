using MyHordesOptimizerApi.Dtos.MyHordes;
using MyHordesOptimizerApi.Dtos.MyHordes.Building;
using MyHordesOptimizerApi.Dtos.MyHordes.Contract;
using MyHordesOptimizerApi.Dtos.MyHordes.Items;
using MyHordesOptimizerApi.Dtos.MyHordes.Town;
using MyHordesOptimizerApi.Repository.Impl;

namespace MyHordesOptimizerApiUnitTests.MyHordesContract
{
    /// <summary>
    /// Miroir des appels du <c>MyHordesApiRepository</c>. Les chaînes <c>fields=</c> doivent être
    /// identiques, caractère pour caractère, à celles du repository : toute divergence entre ce
    /// registre et le repository est un bug du registre.
    /// </summary>
    public static class MhCallRegistry
    {
        // GetTownList est absent volontairement : /json/townlist ne prend pas de paramètre
        // fields=, il n'y a donc aucun chemin à confronter au DTO.
        public static IReadOnlyList<MhCall> All { get; } = new List<MhCall>
        {
            new(nameof(MyHordesApiRepository.GetRuins), MhEndpoints.Ruins,
                typeof(MyHordesApiRuinDto),
                "id,name,desc,explorable,img"),

            new(nameof(MyHordesApiRepository.GetPictos), MhEndpoints.Pictos,
                typeof(MyHordesApiPictoDto),
                "id,img,name,desc,community,rare"),

            // `count` et `broken` sont demandés alors que le référentiel ne les émet jamais : ils
            // viennent de getArrayItem (banque, sol des zones), pas de getItemPrototypesData.
            // Les retirer de la chaîne serait un changement de comportement — chantier D.
            new(nameof(MyHordesApiRepository.GetItems), MhEndpoints.Items,
                typeof(MyHordesItem),
                "id,name,count,broken,img,cat,heavy,deco,guard,desc"),

            new(nameof(MyHordesApiRepository.GetBuildingAsync), MhEndpoints.Buildings,
                typeof(MyHordesApiBuildingDto),
                "id,img,name,desc,pa,maxLife,breakable,def,hasUpgrade,rarity,temporary,parent,resources"),

            // Vérifie au passage que [MhBare] laisse bien passer `playedMaps.rewards` demandé NU,
            // et que le `rewards` racine — branche getRewardsData, qui accepte des sous-champs —
            // n'est pas soumis à la même contrainte.
            new(nameof(MyHordesApiRepository.GetUserPictos), MhEndpoints.User,
                typeof(MyHordesUserDetailsDto),
                "id,rewards.fields(id,rare,number,img,name,desc),playedMaps.fields(mapId,mapName,season,phase,score,type,day,rewards)"),

            new(nameof(MyHordesApiRepository.GetUsersIdentity), MhEndpoints.Users,
                typeof(MyHordesUserDto),
                "id,name,avatar"),

            new(nameof(MyHordesApiRepository.GetMe), MhEndpoints.Me,
                typeof(MyHordesUserDetailsDto),
                "id,name,isGhost,locale,twinId,mapId,map.fields(id,date,wid,hei,conspiracy,bonusPts,days,custom,zones.fields(x,y,nvt,tag,danger,details.fields(z,h,dried),items.fields(uid,id,count,broken),building.fields(type,dig,camped,dried)),citizens.fields(id,name,isGhost,twinId,mapId,homeMessage,avatar,hero,job.fields(uid,name,id,desc),dead,out,baseDef,ban,x,y),city.fields(name,type,water,x,y,door,chaos,hard,devast,chantiers.fields(id,icon,name,pa,maxLife,votes,breakable,def,resources.fields(amount,rsc.fields(id,name)),actions,hasLevels),buildings.fields(id,name,life,maxLife,breakable,def,hasUpgrade,rarity,temporary,parent,actions,hasLevels),news.fields(z,def,content,regenDir,water),defense.fields(total,base,buildings,upgrades,items,itemsMul,citizenHomes,citizenGuardians,watchmen,souls,temp,cadavers,guardiansInfos.fields(gardians,def),bonus),upgrades.fields(total,list.fields(name,level,update,buildingId)),estimations.fields(days,min,max,maxed),estimationsNext.fields(days,min,max,maxed),bank.fields(uid,id,count,broken)),cadavers.fields(id,name,avatar,survival,origin,score,sp,dtype,comment,msg,cleanup.fields(user,type),rewards),expeditions.fields(name,author.fields(id),length,points.fields(x,y)),season,phase,language,shaman,guide,cata),homeMessage,avatar,hero,job.fields(uid,name,id,desc),dead,out,baseDef,ban,x,y,rewards.fields(id,number),playedMaps.fields(mapId,mapName,season,phase,score,sp,dtype,survival,type,day)"),

            new(nameof(MyHordesApiRepository.GetMapForToolsUpdate), MhEndpoints.Me,
                typeof(MyHordesUserDetailsDto),
                "id,name,mapId,map.fields(wid,hei,days,zones.fields(x,y,nvt,tag,danger,details.fields(z,h,dried),items.fields(uid,id,count,broken),building.fields(type,dig,camped,dried)),citizens.fields(id,name,avatar,homeMessage,baseDef,ban,job.fields(uid,name),dead,x,y),city.fields(name,type,water,x,y,door,chaos,devast,chantiers.fields(id,icon,name,pa,maxLife,votes,breakable,def,resources.fields(amount,rsc.fields(id,name)),actions,hasLevels),buildings.fields(id,name,life,maxLife,breakable,def,hasUpgrade,rarity,temporary,parent,actions,hasLevels),news.fields(z,def,content,regenDir,water),defense.fields(total,base,buildings,upgrades,items,itemsMul,citizenHomes,citizenGuardians,watchmen,souls,temp,cadavers,guardiansInfos.fields(gardians,def),bonus),upgrades.fields(total,list.fields(name,level,update,buildingId)),bank.fields(id,count,broken)),cadavers.fields(id,name,avatar,survival,dtype,comment,msg,sp),expeditions.fields(name,author.fields(id),length,points.fields(x,y)),season,phase,language,shaman,guide,cata)"),

            new(nameof(MyHordesApiRepository.GetMapDetails), MhEndpoints.Map,
                typeof(MyHordesMap),
                "season,phase,wid,hei,city.fields(type,chaos,devast,door,water,x,y),citizens.fields(id,name,avatar,homeMessage),cadavers.fields(id,name,avatar,survival,score,dtype,msg,comment)"),

            // Vérifie aussi que [MhUnavailableOn(Towns)] sur `sp` ne se déclenche pas à tort :
            // le champ n'est pas demandé ici, aucune violation n'est donc attendue.
            new(nameof(MyHordesApiRepository.GetTownDetails), MhEndpoints.Towns,
                typeof(MyHordesTownDetailsDto),
                "id,mapId,day,mapName,language,season,phase,score,citizens.fields(id,name,survival,avatar,dtype,score,msg,comment)"),
        };
    }
}
