using AutoMapper;
using Microsoft.Extensions.DependencyInjection;
using MyHordesOptimizerApi.Dtos.MyHordes;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Providers.Interfaces;

namespace MyHordesOptimizerApi.MappingProfiles.Resolvers
{
    public class TownCadaversResolver : IValueResolver<MyHordesMap, TownDto, CadaversLastUpdateDto>
    {
        protected IServiceScopeFactory ServiceScopeFactory { get; private set; }

        protected IUserInfoProvider UserInfoProvider { get; set; }


        public TownCadaversResolver(IServiceScopeFactory serviceScopeFactory,
            IUserInfoProvider userInfoProvider)
        {
            ServiceScopeFactory = serviceScopeFactory;
            UserInfoProvider = userInfoProvider;
        }

        public CadaversLastUpdateDto Resolve(MyHordesMap source, TownDto destination, CadaversLastUpdateDto destMember, ResolutionContext context)
        {
            //var wrapper = new CadaversLastUpdateDto();
            //var cod = MhoRepository.GetCausesOfDeath();
            //var cleanUpTypes = MhoRepository.GetCleanUpTypes();
            //var citizens = MhoRepository.GetCitizens(destination.Id);

            //if (citizens.Citizens.Count != 0)
            //{
            //    foreach (var cadaver in source.Cadavers)
            //    {
            //        var cadaverCod = cod.FirstOrDefault(x => x.Dtype == cadaver.Dtype);

            //        var destinationCadaver = new CadaverDto()
            //        {
            //            CauseOfDeath = cadaverCod,
            //            Avatar = cadaver.Avatar,
            //            Id = cadaver.Id,
            //            Msg = cadaver.Msg,
            //            TownMsg = cadaver.Comment,
            //            Name = cadaver.Name,
            //            Score = cadaver.Score,
            //            Survival = cadaver.Survival,
            //        };

            //        var deadCitizen = citizens.Citizens.Where(x => x.Id == cadaver.Id).FirstOrDefault();
            //        if(deadCitizen != null)
            //        {
            //            destinationCadaver.CleanUp.IdCleanUp = deadCitizen.Cadaver.CleanUp.IdCleanUp;
            //            destinationCadaver.CleanUp.CitizenCleanUp = citizens.Citizens.Where(x => x.Name == cadaver.Cleanup.User).FirstOrDefault();
            //            destinationCadaver.CleanUp.Type = cleanUpTypes.Where(x => x.MyHordesApiName == cadaver.Cleanup.Type).FirstOrDefault();
            //        }

            //        wrapper.Cadavers.Add(destinationCadaver);
            //    }
            //}

            //wrapper.LastUpdateInfo = UserInfoProvider.GenerateLastUpdateInfo();
            //return wrapper;
            return null;
        }
    }
}
