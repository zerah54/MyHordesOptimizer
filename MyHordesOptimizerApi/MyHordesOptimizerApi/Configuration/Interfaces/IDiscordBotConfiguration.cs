namespace MyHordesOptimizerApi.Configuration.Interfaces
{
    public interface IDiscordBotConfiguration
    {
        public string Token { get; }
        public long Guild { get; }
    }
}
