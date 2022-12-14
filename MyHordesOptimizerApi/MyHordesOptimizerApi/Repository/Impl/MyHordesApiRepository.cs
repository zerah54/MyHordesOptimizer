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
            url = AddParameterToQuery(url, _parameterFields, "id,name,map.fields(id, city.fields(bank, chantiers, buildings, name, water, x, y, door, chaos, hard, devast), citizens.fields(id,name,isGhost,homeMessage,avatar,x,y,job.fields(uid,name,id,desc)), wid, hei, consiparcy, cadavers), rewards,job.fields(uid,name,id,desc)");
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