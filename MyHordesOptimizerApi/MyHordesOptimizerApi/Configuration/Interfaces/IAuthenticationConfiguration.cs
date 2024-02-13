namespace MyHordesOptimizerApi.Configuration.Interfaces
{
    public interface IAuthenticationConfiguration
    {
        public string JwtSecret { get; }
        public string JwtIssuer { get; }
        public string JwtAudience { get; }
        public int JwtValideTimeInMinute { get; }
    }
}
