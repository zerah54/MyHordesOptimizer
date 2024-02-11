using AutoMapper;
using System;

namespace MyHordesOptimizerApi.Extensions
{
    public static class MappingOpertationExtensions
    {
        // Key used to acccess time offset parameter within context.
        static readonly string DbContextKey = "DbContext";

        /// <summary>
        /// Recovers the custom time offset parameter from the conversion context.
        /// </summary>
        /// <param name="context">conversion context</param>
        /// <returns>Time offset</returns>
        public static MhoContext GetDbContext(this ResolutionContext context)
        {
            if (context.Items.TryGetValue(DbContextKey, out var dbContext))
            {
                return (MhoContext)dbContext;
            }

            throw new InvalidOperationException("dbContext not set.");
        }

        /// <summary>
        /// Configures the conversion context with a time offset parameter.
        /// </summary>
        /// <param name="options"></param>
        /// <param name="dbContext"></param>
        public static IMappingOperationOptions SetDbContext(this IMappingOperationOptions options, MhoContext dbContext)
        {
            options.Items[DbContextKey] = dbContext;
            // return options to support fluent chaining.
            return options;
        }
    }
}
