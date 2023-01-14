using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.Configuration.Interfaces;
using MyHordesOptimizerApi.Dtos.MyHordes;
using MyHordesOptimizerApi.Dtos.MyHordes.Items;
using MyHordesOptimizerApi.Dtos.MyHordes.Me;
using MyHordesOptimizerApi.Providers.Interfaces;
using MyHordesOptimizerApi.Repository.Abstract;
using MyHordesOptimizerApi.Repository.Interfaces;
using System;
using System.Collections.Generic;
using System.Net.Http;

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

        public MyHordesMeResponseDto GetMe()
        {
            var url = GenerateUrl(EndpointMe);
            url = AddParameterToQuery(url, _parameterFields, "id,name,isGhost,locale,twinId,mapId,map.fields(id,date,wid,hei,conspiracy,bonusPts,days,custom,zones.fields(x,y,nvt,tag,danger,details.fields(z,h,dried),items.fields(uid,id,count,broken),building.fields(type,dig,camped,dried)),citizens.fields(id,name,isGhost,twinId,mapId,homeMessage,avatar,hero,job.fields(uid,name,id,desc),dead,out,baseDef,ban,x,y),city.fields(name,water,x,y,door,chaos,hard,devast,chantiers.fields(id,icon,name,pa,maxLife,votes,breakable,def,resources.fields(amount,rsc.fields(id,name)),actions,hasLevels),buildings.fields(id,name,life,maxLife,breakable,def,hasUpgrade,rarity,temporary,parent,actions,hasLevels),news.fields(z,def,content,regenDir,water),defense.fields(total,base,buildings,upgrades,items,itemsMul,citizenHomes,citizenGuardians,watchmen,souls,temp,cadavers,guardiansInfos.fields(gardians,def),bonus),upgrades.fields(total,list.fields(name,level,update,buildingId)),estimations.fields(days,min,max,maxed),estimationsNext.fields(days,min,max,maxed),bank.fields(uid,id,count,broken)),cadavers.fields(id,name,avatar,survival,origin,score,dtype,msg,cleanup.fields(user,type)),expeditions.fields(name,author.fields(id),length,points.fields(x,y)),season,shaman,guide),homeMessage,avatar,hero,job.fields(uid,name,id,desc),dead,out,baseDef,ban,x,y,rewards.fields(id,number)");
            var response = base.Get<MyHordesMeResponseDto>(url);
            UserKeyProvider.UserId = response.Id;
            UserKeyProvider.UserName = response.Name;
            return response;
        }  

        public Dictionary<string, MyHordesApiRuinDto> GetRuins()
        {
            var url = GenerateUrl(EndpointRuins);
            url = AddParameterToQuery(url, _parameterFields, "id,name,desc,explorable,img");
            return base.Get<Dictionary<string, MyHordesApiRuinDto>>(url);
        }
    }
}