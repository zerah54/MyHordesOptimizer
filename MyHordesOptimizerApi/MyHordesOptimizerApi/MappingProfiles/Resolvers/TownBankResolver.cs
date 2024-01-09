using AutoMapper;
using MyHordesOptimizerApi.Dtos.MyHordes;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Providers.Interfaces;
using MyHordesOptimizerApi.Repository.Interfaces;
using System.Linq;

namespace MyHordesOptimizerApi.MappingProfiles.Resolvers
{
    public class TownBankResolver : IValueResolver<MyHordesMap, Town, BankLastUpdate>
    {
        protected IMyHordesOptimizerRepository MhoRepository { get; set; }
        protected IUserInfoProvider UserInfoProvider { get; set; }


        public TownBankResolver(IMyHordesOptimizerRepository firebaseRepository,
            IUserInfoProvider userInfoProvider)
        {
            MhoRepository = firebaseRepository;
            UserInfoProvider = userInfoProvider;
        }

        public BankLastUpdate Resolve(MyHordesMap source, Town destination, BankLastUpdate destMember, ResolutionContext context)
        {
            var wrapper = new BankLastUpdate();
            var items = MhoRepository.GetItems();

            if (source.City != null)
            {
                foreach (var bankItem in source.City.Bank)
                {
                    var item = items.First(x => x.Id == bankItem.Id);
                    var destinationBankItem = new BankItem()
                    {
                        Item = item,
                        Count = bankItem.Count,
                        IsBroken = bankItem.Broken
                    };
                    wrapper.Bank.Add(destinationBankItem);
                }
            }

            wrapper.LastUpdateInfo = UserInfoProvider.GenerateLastUpdateInfo();
            return wrapper;
        }
    }
}
