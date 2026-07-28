using AutoMapper;
using Microsoft.Extensions.DependencyInjection;
using MyHordesOptimizerApi.Dtos.MyHordes;
using MyHordesOptimizerApi.Extensions;
using MyHordesOptimizerApi.Models;
using System.Linq;

namespace MyHordesOptimizerApi.MappingProfiles.Resolvers.MyHordes
{
    public class MyHordeCitizenToUserValueResolver : IValueResolver<MyHordesUserDto, object, User>
    {
        protected IServiceScopeFactory ServiceScopeFactory { get; private set; }

        public MyHordeCitizenToUserValueResolver(IServiceScopeFactory serviceScopeFactory)
        {
            ServiceScopeFactory = serviceScopeFactory;
        }

        public User Resolve(MyHordesUserDto source, object destination, User destMember, ResolutionContext context)
        {
            var dbContext = context.GetDbContext();
            // Sur les chemins getUserData, `avatar` vaut l'URL ou null — jamais le booléen `false`
            // que renvoie getCadaversInformation (`getSource(200) ?: false`). D'où le typage
            // string? plutôt que l'ancien object, et la disparition du cast défensif.
            var avatar = source.Avatar;
            var dbUser = dbContext.Users.FirstOrDefault(x => x.IdUser == source.Id);
            if (dbUser == null)
            {
                var user = new User()
                {
                    IdUser = source.Id.Value,
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
