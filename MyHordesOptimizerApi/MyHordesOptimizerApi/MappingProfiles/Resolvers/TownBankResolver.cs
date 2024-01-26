using AutoMapper;
using Microsoft.Extensions.DependencyInjection;
using MyHordesOptimizerApi.Dtos.MyHordes;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Providers.Interfaces;

namespace MyHordesOptimizerApi.MappingProfiles.Resolvers
{
    public class TownBankResolver : IValueResolver<MyHordesMap, TownDto, BankLastUpdateDto>
    {
        protected IServiceScopeFactory ServiceScopeFactory { get; private set; }

        protected IUserInfoProvider UserInfoProvider { get; set; }


        public TownBankResolver(IServiceScopeFactory serviceScopeFactory,
            IUserInfoProvider userInfoProvider)
        {
            ServiceScopeFactory = serviceScopeFactory;
            UserInfoProvider = userInfoProvider;
        }

        public BankLastUpdateDto Resolve(MyHordesMap source, TownDto destination, BankLastUpdateDto destMember, ResolutionContext context)
        {
            //var wrapper = new BankLastUpdateDto();
            //var items = MhoRepository.GetItems();

            //if (source.City != null)
            //{
            //    foreach (var bankItem in source.City.Bank)
            //    {
            //        var item = items.First(x => x.IdItem == bankItem.Id);
            //        var destinationBankItem = new BankItemDto()
            //        {
            //            Item = context.Mapper.Map<ItemDto>(item),
            //            Count = bankItem.Count,
            //            IsBroken = bankItem.Broken
            //        };
            //        wrapper.Bank.Add(destinationBankItem);
            //    }
            //}

            //wrapper.LastUpdateInfo = context.Mapper.Map<LastUpdateInfoDto>(UserInfoProvider.GenerateLastUpdateInfo());
            //return wrapper;
            return null;
        }
    }
}
