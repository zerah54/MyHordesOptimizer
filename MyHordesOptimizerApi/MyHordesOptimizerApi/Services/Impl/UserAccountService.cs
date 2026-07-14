using System.Linq;
using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.UserAccount;
using MyHordesOptimizerApi.Exceptions;
using MyHordesOptimizerApi.Services.Interfaces;

namespace MyHordesOptimizerApi.Services.Impl;

public class UserAccountService : IUserAccountService
{
    protected ILogger<UserAccountService> Logger { get; init; }
    protected MhoContext DbContext { get; init; }

    public UserAccountService(ILogger<UserAccountService> logger, MhoContext dbContext)
    {
        Logger = logger;
        DbContext = dbContext;
    }

    public UserAccountPublicDto GetPublicProfile(int userId)
    {
        var user = DbContext.Users
            .Where(u => u.IdUser == userId)
            .Select(u => new UserAccountPublicDto
            {
                Id = u.IdUser,
                UserName = u.Name,
                Avatar = u.Avatar
            })
            .SingleOrDefault();

        if (user is null)
        {
            throw new MhoTechnicalException($"Utilisateur introuvable : {userId}");
        }

        return user;
    }
}
