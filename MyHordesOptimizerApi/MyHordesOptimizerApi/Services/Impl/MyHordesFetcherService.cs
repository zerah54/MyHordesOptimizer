using AutoMapper;
using Common.Core.Repository.Interfaces;
using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.Configuration.Interfaces;
using MyHordesOptimizerApi.Dtos.MyHordes;
using MyHordesOptimizerApi.Dtos.MyHordes.MyHordesOptimizer;
using MyHordesOptimizerApi.Repository.Interfaces;
using MyHordesOptimizerApi.Services.Interfaces;
using System.Collections.Generic;
using System.Linq;

namespace MyHordesOptimizerApi.Services.Impl
{
    public class MyHordesFetcherService : IMyHordesFetcherService
    {
        protected ILogger<MyHordesFetcherService> Logger { get; set; }
        protected IMyHordesJsonApiRepository MyHordesJsonApiRepository { get; set; }
        protected IMyHordesXmlApiRepository MyHordesXmlApiRepository { get; set; }
        private readonly IMapper Mapper;


        public MyHordesFetcherService(ILogger<MyHordesFetcherService> logger,
            IMyHordesJsonApiRepository myHordesJsonApiRepository,
            IMyHordesXmlApiRepository myHordesXmlApiRepository,
            IMapper mapper)
        {
            Logger = logger;
            MyHordesJsonApiRepository = myHordesJsonApiRepository;
            MyHordesXmlApiRepository = myHordesXmlApiRepository;
            Mapper = mapper;
        }

        public IEnumerable<Item> GetItems()
        {
            var jsonApiResult = MyHordesJsonApiRepository.GetItems();
            var jsonItems = Mapper.Map<List<Item>>(jsonApiResult);

            var xmlApiResult = MyHordesXmlApiRepository.GetItems();
            var xmlItems = Mapper.Map<List<Item>>(xmlApiResult.Data.Items.Item);

           foreach(var item in xmlItems)
            {
                var miror = jsonItems.FirstOrDefault(x => x.Img == item.Img);
                if(miror != null)
                {
                    item.JsonIdName = miror.JsonIdName;
                    item.Labels = miror.Labels;
                }
            }

            return xmlItems;
        }
    }
}
