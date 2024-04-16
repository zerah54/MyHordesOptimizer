using AutoMapper;
using MyHordesOptimizerApi.Providers.Interfaces;
using System;

namespace MyHordesOptimizerApi.Extensions
{
    public static class MappingOpertationExtensions
    {
        // Key used to acccess time offset parameter within context.
        static readonly string DbContextKey = "DbContext";
        static readonly string UserInfoProviderKey = "UserInfoProviderKey";
        static readonly string LastUpdateInfoIdKey = "LastUpdateInfoIdKey";
        static readonly string TownIdKey = "TownIdKey";

        #region DbContext
        public static MhoContext GetDbContext(this ResolutionContext context)
        {
            if (context.Items.TryGetValue(DbContextKey, out var dbContext))
            {
                return (MhoContext)dbContext;
            }

            throw new InvalidOperationException("lastUpdateInfoId not set.");
        }

        public static IMappingOperationOptions SetDbContext(this IMappingOperationOptions options, MhoContext dbContext)
        {
            options.Items[DbContextKey] = dbContext;
            // return options to support fluent chaining.
            return options;
        }
        #endregion

        #region UserInfoProvider
        public static IUserInfoProvider GetUserInfoProvider(this ResolutionContext context)
        {
            if (context.Items.TryGetValue(UserInfoProviderKey, out var userInfoProvider))
            {
                return (IUserInfoProvider)userInfoProvider;
            }

            throw new InvalidOperationException("lastUpdateInfoId not set.");
        }

        public static IMappingOperationOptions SetUserInfoProvider(this IMappingOperationOptions options, IUserInfoProvider userInfoProvider)
        {
            options.Items[UserInfoProviderKey] = userInfoProvider;
            // return options to support fluent chaining.
            return options;
        }
        #endregion

        #region LastUpdateInfoId
        public static int GetLastUpdateInfoId(this ResolutionContext context)
        {
            if (context.Items.TryGetValue(LastUpdateInfoIdKey, out var lastUpdateInfoId))
            {
                return (int)lastUpdateInfoId;
            }

            throw new InvalidOperationException("lastUpdateInfoId not set.");
        }

        public static IMappingOperationOptions SetLastUpdateInfoId(this IMappingOperationOptions options, int lastUpdateInfoId)
        {
            options.Items[LastUpdateInfoIdKey] = lastUpdateInfoId;
            // return options to support fluent chaining.
            return options;
        }
        #endregion

        #region TownId
        public static int GetTownId(this ResolutionContext context)
        {
            if (context.Items.TryGetValue(TownIdKey, out var townId))
            {
                return (int)townId;
            }

            throw new InvalidOperationException("townId not set.");
        }

        public static IMappingOperationOptions SetTownId(this IMappingOperationOptions options, int townId)
        {
            options.Items[TownIdKey] = townId;
            // return options to support fluent chaining.
            return options;
        }
        #endregion
    }
}
