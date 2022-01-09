using AutoMapper;
using MyHordesOptimizerApi.Dtos.MyHordes;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Repository.Interfaces;
using System.Collections.Generic;
using System.Linq;

namespace MyHordesOptimizerApi.MappingProfiles.Resolvers
{
    public class TownBankResolver : IValueResolver<MyHordesMap, Town, Dictionary<string, BankItem>>
    {
        protected IMyHordesOptimizerFirebaseRepository FirebaseRepository { get; set; }

        public TownBankResolver(IMyHordesOptimizerFirebaseRepository firebaseRepository)
        {
            FirebaseRepository = firebaseRepository;
        }

        public Dictionary<string, BankItem> Resolve(MyHordesMap source, Town destination, Dictionary<string, BankItem> destMember, ResolutionContext context)
        {
            var bank = new Dictionary<string, BankItem>();
            var items = FirebaseRepository.GetItems();
            foreach (var bankItem in source.City.Bank)
            {
                var item = items.Values.First(x => x.XmlId == bankItem.Id);
                var destinationBankItem = new BankItem()
                {
                    Item = item,
                    Count = bankItem.Count
                };
                bank[item.JsonIdName] = destinationBankItem;
            }
            return bank;
        }
    }
}
