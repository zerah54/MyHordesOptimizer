﻿using AutoMapper;
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
        protected IMyHordesApiRepository MyHordesJsonApiRepository { get; set; }
        protected IMyHordesOptimizerRepository MyHordesOptimizerRepository { get; set; }
        protected IMyHordesCodeRepository MyHordesCodeRepository { get; set; }
        protected readonly IMapper Mapper;
        protected IUserInfoProvider UserInfoProvider { get; set; }


        public MyHordesFetcherService(ILogger<MyHordesFetcherService> logger,
            IMyHordesApiRepository myHordesJsonApiRepository,
            IMyHordesOptimizerRepository firebaseRepository,
            IMyHordesCodeRepository myHordesCodeRepository,
            IMapper mapper,
            IUserInfoProvider userInfoProvider)
        {
            Logger = logger;
            MyHordesJsonApiRepository = myHordesJsonApiRepository;
            MyHordesOptimizerRepository = firebaseRepository;
            MyHordesCodeRepository = myHordesCodeRepository;
            Mapper = mapper;
            UserInfoProvider = userInfoProvider;
        }

        public IEnumerable<Item> GetItems()
        {
            var items = MyHordesOptimizerRepository.GetItems();
            var recipes = MyHordesOptimizerRepository.GetRecipes();
            foreach (var item in items)
            {
                var recipesToAdd = recipes.Values.Where(recipe => recipe.Components.Any(component => component.Id == item.Id)).ToList();
                recipesToAdd.AddRange(recipes.Values.Where(recipes => recipes.Result.Any(result => result.Item.Id == item.Id)));
                item.Recipes = recipesToAdd;
            }

            var me = MyHordesJsonApiRepository.GetMe();
            if (me.Map != null) // On ne récupère les info propres à la ville uniquement si on est incarné
            {
                var town = MyHordesOptimizerRepository.GetTown(me.Map.Id);
                if(town == null)
                {
                    town = GetTown();
                }
                foreach (var item in items)
                {
                    if (town.WishList != null && town.WishList.WishList != null)
                    {
                        if (town.WishList.WishList.TryGetValue(item.Id.ToString(), out var wishListItem))
                        {
                            item.WishListCount = wishListItem.Count;
                        }
                        else
                        {
                            item.WishListCount = 0;
                        }
                    }

                    if (town.Bank.Bank.TryGetValue(item.Id.ToString(), out var bankItem))
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
            MyHordesOptimizerRepository.PatchTown(town);
            town = MyHordesOptimizerRepository.GetTown(town.Id);

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
            var heroSkills = MyHordesOptimizerRepository.GetHeroSkills();
            return heroSkills.Values;
        }

        public IEnumerable<ItemRecipe> GetRecipes()
        {
            var recipes = MyHordesOptimizerRepository.GetRecipes();
            return recipes.Values;
        }

        public BankWrapper GetBank()
        {
            var myHordeMeResponse = MyHordesJsonApiRepository.GetMe();
            var town = Mapper.Map<Town>(myHordeMeResponse.Map);

            // Enregistrer en base
            MyHordesOptimizerRepository.PutBank(town.Id, town.Bank);
            town = MyHordesOptimizerRepository.GetTown(town.Id);
            var bankWrapper = town.Bank;

            if (town.WishList != null && town.WishList.WishList != null)
            {
                foreach (var kvp in bankWrapper.Bank)
                {
                    var bankItem = kvp.Value;
                    if (town.WishList.WishList.TryGetValue(bankItem.Item.Id.ToString(), out var wishListItem))
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
            MyHordesOptimizerRepository.PatchCitizen(town.Id, town.Citizens);
            town = MyHordesOptimizerRepository.GetTown(town.Id);
            var citizens = town.Citizens;

            return citizens;
        }

        public IEnumerable<MyHordesOptimizerRuin> GetRuins()
        {
            var ruins = MyHordesOptimizerRepository.GetRuins();
            return ruins;
        }
    }
}
