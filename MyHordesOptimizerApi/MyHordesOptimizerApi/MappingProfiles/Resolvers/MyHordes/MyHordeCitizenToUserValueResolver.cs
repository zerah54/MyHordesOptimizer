using AutoMapper;
using Microsoft.Extensions.DependencyInjection;
using MyHordesOptimizerApi.Dtos.MyHordes;
using MyHordesOptimizerApi.Extensions;
using MyHordesOptimizerApi.Models;
using System.Linq;

namespace MyHordesOptimizerApi.MappingProfiles.Resolvers.MyHordes
{
    public class MyHordeCitizenToUserValueResolver : IValueResolver<MyHordesCitizen, object, User>
    {
        protected IServiceScopeFactory ServiceScopeFactory { get; private set; }

        public MyHordeCitizenToUserValueResolver(IServiceScopeFactory serviceScopeFactory)
        {
            ServiceScopeFactory = serviceScopeFactory;
        }

        public User Resolve(MyHordesCitizen source, object destination, User destMember, ResolutionContext context)
        {
            var dbContext = context.GetDbContext();
            var dbUser = dbContext.Users.FirstOrDefault(x => x.IdUser == source.Id);
            if (dbUser == null)
            {
                var user = new User()
                {
                    IdUser = source.Id
                };
                dbContext.Add(user);
            }
            return dbUser;
        }
    }
}
