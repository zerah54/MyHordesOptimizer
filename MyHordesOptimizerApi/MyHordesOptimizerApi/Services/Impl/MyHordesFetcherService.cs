using AutoMapper;
using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.Dtos.MyHordes.MyHordesOptimizer;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
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
        protected IMyHordesOptimizerFirebaseRepository FirebaseRepository { get; set; }
        private readonly IMapper Mapper;


        public MyHordesFetcherService(ILogger<MyHordesFetcherService> logger,
            IMyHordesJsonApiRepository myHordesJsonApiRepository,
            IMyHordesXmlApiRepository myHordesXmlApiRepository,
            IMyHordesOptimizerFirebaseRepository firebaseRepository,
            IMapper mapper)
        {
            Logger = logger;
            MyHordesJsonApiRepository = myHordesJsonApiRepository;
            MyHordesXmlApiRepository = myHordesXmlApiRepository;
            FirebaseRepository = firebaseRepository;
            Mapper = mapper;
        }

        public IEnumerable<Item> GetItems()
        {
            var jsonApiResult = MyHordesJsonApiRepository.GetItems();
            var jsonItems = Mapper.Map<List<Item>>(jsonApiResult);

            var xmlApiResult = MyHordesXmlApiRepository.GetItems();
            var xmlItems = Mapper.Map<List<Item>>(xmlApiResult.Data.Items.Item);

            foreach (var item in xmlItems)
            {
                var miror = jsonItems.FirstOrDefault(x => x.Img == item.Img);
                if (miror != null)
                {
                    item.JsonIdName = miror.JsonIdName;
                    item.Labels = miror.Labels;
                }
            }

            return xmlItems;
        }

        public Town GetTown()
        {
            var myHordeMeResponse = MyHordesJsonApiRepository.GetMe();
            var town = Mapper.Map<Town>(myHordeMeResponse.Map);

            // Enregistrer en base
            FirebaseRepository.PatchTown(town);
            town = FirebaseRepository.GetTown(town.Id);

            return town;
        }
    }
}
