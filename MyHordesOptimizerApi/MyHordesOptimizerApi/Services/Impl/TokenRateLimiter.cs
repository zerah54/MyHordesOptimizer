using System;
using System.Threading.RateLimiting;
using MyHordesOptimizerApi.Configuration.Interfaces;
using MyHordesOptimizerApi.Services.Interfaces;

namespace MyHordesOptimizerApi.Services.Impl
{
    /// <remarks>
    /// ponytail: fenêtre fixe partitionnée par userKey, donc martelée avec un même userKey. Ne freine
    /// pas l'énumération de userKey différents (chaque nouvelle clé repart avec sa propre fenêtre) —
    /// upgrade path : partitionner aussi par IP si l'énumération devient un problème réel.
    /// </remarks>
    public sealed class TokenRateLimiter : ITokenRateLimiter, IDisposable
    {
        private readonly PartitionedRateLimiter<string> _limiter;

        public TokenRateLimiter(ITokenRateLimitConfiguration configuration)
        {
            _limiter = PartitionedRateLimiter.Create<string, string>(userKey =>
                RateLimitPartition.GetFixedWindowLimiter(userKey, _ => new FixedWindowRateLimiterOptions
                {
                    PermitLimit = configuration.PermitLimit,
                    Window = TimeSpan.FromMinutes(configuration.WindowMinutes),
                    QueueLimit = 0
                }));
        }

        public bool TryAcquire(string userKey) => _limiter.AttemptAcquire(userKey).IsAcquired;

        public void Dispose() => _limiter.Dispose();
    }
}
