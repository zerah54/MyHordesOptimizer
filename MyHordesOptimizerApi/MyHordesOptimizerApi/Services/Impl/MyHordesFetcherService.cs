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
        protected readonly IMapper Mapper;


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
            var items = FirebaseRepository.GetItems();
            return items.Values;
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

        public SimpleMe GetSimpleMe()
        {
            var me = MyHordesJsonApiRepository.GetMe();
            var simpleMe = Mapper.Map<SimpleMe>(me);

            return simpleMe;
        }

        public IEnumerable<HeroSkill> GetHeroSkills()
        {
            var heroSkills = FirebaseRepository.GetHeroSkills();
            return heroSkills.Values;
        }

        public IEnumerable<ItemRecipe> GetRecipes()
        {
            var recipes = FirebaseRepository.GetRecipes();
            return recipes.Values;
        }
    }
}
