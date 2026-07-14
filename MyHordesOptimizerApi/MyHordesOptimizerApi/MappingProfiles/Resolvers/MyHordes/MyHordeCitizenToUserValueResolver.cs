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
            // Avatar est désérialisé en object : string quand il y en a un, bool false sinon
            var avatar = source.Avatar as string;
            var dbUser = dbContext.Users.FirstOrDefault(x => x.IdUser == source.Id);
            if (dbUser == null)
            {
                var user = new User()
                {
                    IdUser = source.Id,
                    Name = source.Name,
                    Avatar = avatar
                };
                dbContext.Add(user);
            }
            else
            {
                // Name et avatar ne vivent que sur User : on les rafraîchit à chaque passage
                if (!string.IsNullOrEmpty(source.Name))
                {
                    dbUser.Name = source.Name;
                }
                if (!string.IsNullOrEmpty(avatar))
                {
                    dbUser.Avatar = avatar;
                }
            }
            return dbUser;
        }
    }
}
