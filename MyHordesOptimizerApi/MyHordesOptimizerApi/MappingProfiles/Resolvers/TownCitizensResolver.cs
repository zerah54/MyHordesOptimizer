using AutoMapper;
using MyHordesOptimizerApi.Dtos.MyHordes;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Models;
using MyHordesOptimizerApi.Providers.Interfaces;
using System.Collections.Generic;
using System.Linq;

namespace MyHordesOptimizerApi.MappingProfiles.Resolvers
{
    public class TownCitizensResolver : IValueResolver<MyHordesMap, TownDto, CitizensLastUpdateDto>
    {
        protected IUserInfoProvider UserInfoProvider { get; set; }
        protected IMapper Mapper { get; set; }


        public TownCitizensResolver(IUserInfoProvider userInfoProvider, IMapper mapper)
        {
            UserInfoProvider = userInfoProvider;
            Mapper = mapper;
        }

        public CitizensLastUpdateDto Resolve(MyHordesMap source, TownDto destination, CitizensLastUpdateDto destMember, ResolutionContext context)
        {
          //  var dictionary = source.Citizens.ToDictionary(citizen => $"{citizen.Id}_{citizen.Name}", citizen => citizen);
            var wrapper = new CitizensLastUpdateDto(Mapper.Map<List<CitizenDto>>(source.Citizens));
            wrapper.LastUpdateInfo = context.Mapper.Map<LastUpdateInfoDto>(UserInfoProvider.GenerateLastUpdateInfo());
            return wrapper;
        }
    }
}
