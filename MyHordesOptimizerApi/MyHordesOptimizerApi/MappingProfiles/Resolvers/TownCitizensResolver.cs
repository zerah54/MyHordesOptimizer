using AutoMapper;
using MyHordesOptimizerApi.Dtos.MyHordes;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Providers.Interfaces;
using System.Collections.Generic;
using System.Linq;

namespace MyHordesOptimizerApi.MappingProfiles.Resolvers
{
    public class TownCitizensResolver : IValueResolver<MyHordesMap, Town, CitizensWrapper>
    {
        protected IUserInfoProvider UserInfoProvider { get; set; }
        protected IMapper Mapper { get; set; }


        public TownCitizensResolver(IUserInfoProvider userInfoProvider, IMapper mapper)
        {
            UserInfoProvider = userInfoProvider;
            Mapper = mapper;
        }

        public CitizensWrapper Resolve(MyHordesMap source, Town destination, CitizensWrapper destMember, ResolutionContext context)
        {
            var dictionary = source.Citizens.ToDictionary(citizen => citizen.Name, citizen => citizen);
            var wrapper = new CitizensWrapper(Mapper.Map<Dictionary<string,Citizen>>(dictionary));
            wrapper.LastUpadteInfo = UserInfoProvider.GenerateLastUpdateInfo();
            return wrapper;
        }
    }
}
