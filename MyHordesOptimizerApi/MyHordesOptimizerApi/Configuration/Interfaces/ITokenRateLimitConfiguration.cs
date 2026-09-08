namespace MyHordesOptimizerApi.Configuration.Interfaces
{
    public interface ITokenRateLimitConfiguration
    {
        public int PermitLimit { get; }
        public int WindowMinutes { get; }
    }
}
