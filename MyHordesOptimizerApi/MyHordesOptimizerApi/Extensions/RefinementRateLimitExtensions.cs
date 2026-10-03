using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.RateLimiting;

namespace MyHordesOptimizerApi.Extensions
{
    /// <summary>Rejeu serveur d'un envoi d'affinage (~6 s de CPU au pire) : 2 en parallèle, 4 en attente, au-delà 429.</summary>
    public static class RefinementRateLimitExtensions
    {
        public const string PolicyName = "Refinement";

        /// <summary>Ajoute la politique d'affinage ; les refus de toutes les politiques répondent 429.</summary>
        public static RateLimiterOptions AddRefinementPolicy(this RateLimiterOptions options)
        {
            options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
            return options.AddConcurrencyLimiter(PolicyName, limiter =>
            {
                limiter.PermitLimit = 2;
                limiter.QueueLimit = 4;
                limiter.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
            });
        }
    }
}
