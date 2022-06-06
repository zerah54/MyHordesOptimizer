using AutoMapper;
using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.Dtos.MyHordes.MyHordesOptimizer;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Providers.Interfaces;
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
        protected IMyHordesCodeRepository MyHordesCodeRepository { get; set; }
        protected readonly IMapper Mapper;
        protected IUserInfoProvider UserInfoProvider { get; set; }


        public MyHordesFetcherService(ILogger<MyHordesFetcherService> logger,
            IMyHordesJsonApiRepository myHordesJsonApiRepository,
            IMyHordesXmlApiRepository myHordesXmlApiRepository,
            IMyHordesOptimizerFirebaseRepository firebaseRepository,
            IMyHordesCodeRepository myHordesCodeRepository,
            IMapper mapper,
            IUserInfoProvider userInfoProvider)
        {
            Logger = logger;
            MyHordesJsonApiRepository = myHordesJsonApiRepository;
            MyHordesXmlApiRepository = myHordesXmlApiRepository;
            FirebaseRepository = firebaseRepository;
            MyHordesCodeRepository = myHordesCodeRepository;
            Mapper = mapper;
            UserInfoProvider = userInfoProvider;
        }

        public IEnumerable<Item> GetItems()
        {
            var items = FirebaseRepository.GetItems();
            var recipes = FirebaseRepository.GetRecipes();
            foreach (var item in items)
            {
                var recipesToAdd = recipes.Values.Where(recipe => recipe.Components.Any(component => component.XmlId == item.XmlId)).ToList();
                recipesToAdd.AddRange(recipes.Values.Where(recipes => recipes.Result.Any(result => result.Item.XmlId == item.XmlId)));
                item.Recipes = recipesToAdd;
            }

            var me = MyHordesJsonApiRepository.GetMe();
            if (me.Map != null) // On ne récupère les info propres à la ville uniquement si on est incarné
            {
                var town = FirebaseRepository.GetTown(me.Map.Id);
                if(town == null)
                {
                    town = GetTown();
                }
                foreach (var item in items)
                {
                    if (town.WishList != null && town.WishList.WishList != null)
                    {
                        if (town.WishList.WishList.TryGetValue(item.XmlId.ToString(), out var wishListItem))
                        {
                            item.WishListCount = wishListItem.Count;
                        }
                        else
                        {
                            item.WishListCount = 0;
                        }
                    }

                    if (town.Bank.Bank.TryGetValue(item.XmlId.ToString(), out var bankItem))
                    {
                        item.BankCount = bankItem.Count;
                    }
                    else
                    {
                        item.BankCount = 0;
                    }
                }
            }
            return items;
        }

        public Town GetTown()
        {
            var myHordeMeResponse = MyHordesJsonApiRepository.GetMe();
            myHordeMeResponse.Map.LastUpdateInfo = UserInfoProvider.GenerateLastUpdateInfo();
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

        public BankWrapper GetBank()
        {
            var myHordeMeResponse = MyHordesJsonApiRepository.GetMe();
            var town = Mapper.Map<Town>(myHordeMeResponse.Map);

            // Enregistrer en base
            FirebaseRepository.PutBank(town.Id, town.Bank);
            town = FirebaseRepository.GetTown(town.Id);
            var bankWrapper = town.Bank;

            if (town.WishList != null && town.WishList.WishList != null)
            {
                foreach (var kvp in bankWrapper.Bank)
                {
                    var bankItem = kvp.Value;
                    if (town.WishList.WishList.TryGetValue(bankItem.Item.XmlId.ToString(), out var wishListItem))
                    {
                        bankItem.WishListCount = wishListItem.Count;
                    }
                    else
                    {
                        bankItem.WishListCount = 0;
                    }
                }
            }
            return bankWrapper;
        }

        public CitizensWrapper GetCitizens()
        {
            var myHordeMeResponse = MyHordesJsonApiRepository.GetMe();
            var town = Mapper.Map<Town>(myHordeMeResponse.Map);

            // Enregistrer en base
            FirebaseRepository.PatchCitizen(town.Id, town.Citizens);
            town = FirebaseRepository.GetTown(town.Id);
            var citizens = town.Citizens;

            return citizens;
        }

        public IEnumerable<MyHordesOptimizerRuin> GetRuins()
        {
            var ruins = FirebaseRepository.GetRuins();
            return ruins.Values;
        }
    }
}
