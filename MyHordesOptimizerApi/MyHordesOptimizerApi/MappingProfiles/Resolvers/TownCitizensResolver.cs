using AutoMapper;
using MyHordesOptimizerApi.Dtos.MyHordes;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Providers.Interfaces;
using System.Collections.Generic;
using System.Linq;

namespace MyHordesOptimizerApi.MappingProfiles.Resolvers
{
    public class TownCitizensResolver : IValueResolver<MyHordesMap, Town, CitizensLastUpdate>
    {
        protected IUserInfoProvider UserInfoProvider { get; set; }
        protected IMapper Mapper { get; set; }


        public TownCitizensResolver(IUserInfoProvider userInfoProvider, IMapper mapper)
        {
            UserInfoProvider = userInfoProvider;
            Mapper = mapper;
        }

        public CitizensLastUpdate Resolve(MyHordesMap source, Town destination, CitizensLastUpdate destMember, ResolutionContext context)
        {
          //  var dictionary = source.Citizens.ToDictionary(citizen => $"{citizen.Id}_{citizen.Name}", citizen => citizen);
            var wrapper = new CitizensLastUpdate(Mapper.Map<List<Citizen>>(source.Citizens));
            wrapper.LastUpdateInfo = UserInfoProvider.GenerateLastUpdateInfo();
            return wrapper;
        }
    }
}
