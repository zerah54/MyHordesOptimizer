namespace MyHordesOptimizerApi.Services.Interfaces
{
    public interface ITokenRateLimiter
    {
        /// <summary>Renvoie false si la limite est atteinte pour ce userKey.</summary>
        bool TryAcquire(string userKey);
    }
}
