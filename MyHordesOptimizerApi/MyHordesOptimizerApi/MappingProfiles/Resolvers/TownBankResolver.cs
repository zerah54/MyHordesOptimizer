using AutoMapper;
using MyHordesOptimizerApi.Dtos.MyHordes;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Providers.Interfaces;
using MyHordesOptimizerApi.Repository.Interfaces;
using System.Linq;

namespace MyHordesOptimizerApi.MappingProfiles.Resolvers
{
    public class TownBankResolver : IValueResolver<MyHordesMap, Town, BankWrapper>
    {
        protected IMyHordesOptimizerRepository FirebaseRepository { get; set; }
        protected IUserInfoProvider UserInfoProvider { get; set; }


        public TownBankResolver(IMyHordesOptimizerRepository firebaseRepository,
            IUserInfoProvider userInfoProvider)
        {
            FirebaseRepository = firebaseRepository;
            UserInfoProvider = userInfoProvider;
        }

        public BankWrapper Resolve(MyHordesMap source, Town destination, BankWrapper destMember, ResolutionContext context)
        {
            var wrapper = new BankWrapper();
            var items = FirebaseRepository.GetItems();
            foreach (var bankItem in source.City.Bank)
            {
                var item = items.First(x => x.XmlId == bankItem.Id);
                var destinationBankItem = new BankItem()
                {
                    Item = item,
                    Count = bankItem.Count
                };
                wrapper.Bank[item.XmlId.ToString()] = destinationBankItem;
            }
            wrapper.LastUpdateInfo = UserInfoProvider.GenerateLastUpdateInfo();
            return wrapper;
        }
    }
}
