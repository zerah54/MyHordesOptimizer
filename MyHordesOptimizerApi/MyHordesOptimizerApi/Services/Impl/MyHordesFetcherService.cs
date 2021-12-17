using AutoMapper;
using Common.Core.Repository.Interfaces;
using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.Configuration.Interfaces;
using MyHordesOptimizerApi.Dtos.MyHordes;
using MyHordesOptimizerApi.Dtos.MyHordes.MyHordesOptimizer;
using MyHordesOptimizerApi.Repository.Interfaces;
using MyHordesOptimizerApi.Services.Interfaces;
using System.Collections.Generic;

namespace MyHordesOptimizerApi.Services.Impl
{
    public class MyHordesFetcherService : IMyHordesFetcherService
    {
        protected ILogger<MyHordesFetcherService> Logger { get; set; }
        protected IMyHordesApiRepository MyHordesApiRepository { get; set; }
        private readonly IMapper Mapper;


        public MyHordesFetcherService(ILogger<MyHordesFetcherService> logger,
            IMyHordesApiRepository myHordesApiRepository,
            IMapper mapper)
        {
            Logger = logger;
            MyHordesApiRepository = myHordesApiRepository;
            Mapper = mapper;
        }

        public IEnumerable<Item> GetItems()
        {
            var myHordesItems = MyHordesApiRepository.GetItems();
            var items = Mapper.Map<List<Item>>(myHordesItems);
            return items;
        }
    }
}
