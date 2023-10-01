namespace MyHordesOptimizerApi.Configuration.Interfaces
{
    public interface IDiscordBotConfiguration
    {
        public string Token { get; }
        public ulong SupportGuildId { get; }
        public ulong SuggestionsChannelId { get; }
        public ulong BugsChannelId { get; }
    }
}
