using System.Threading.Tasks;
using Discord;
using Discord.Interactions;
using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.DiscordBot.Enums;
using MyHordesOptimizerApi.DiscordBot.Utility;
using MyHordesOptimizerApi.Services.Interfaces;

namespace MyHordesOptimizerApi.DiscordBot.Modules
{
    public class GlossaryModule : InteractionModuleBase<SocketInteractionContext>
    {
        private readonly IGlossaryService _glossaryService;
        private readonly ILogger<GlossaryModule> _logger;


        public GlossaryModule(ILogger<GlossaryModule> logger, IGlossaryService glossaryService)
        {
            _logger = logger;
            _glossaryService = glossaryService;
        }


        [SlashCommand(name: "glossary", description: "Definitions associated with a given text")]
        public async Task GlossaryAsync(
            [Summary(name: "text", description: "Searched text")]
            string searchValue,
            [Summary(name: "language", description: "The language of the searched text")]
            Locales? locale = null,
            [Summary(name: "private-msg", description: "True if the message should not be seen by all")]
            bool privateMsg = false
        )
        {
            var results = _glossaryService.GetGlossaryEntriesFromString(locale, searchValue);

            if (results.Count == 0)
            {
                await RespondAsync($"Aucune correspondance n'a été trouvée pour {searchValue}", ephemeral: true);
            }
            else
            {
                var description = "";

                foreach (var glossaryEntry in results)
                {
                    description += $"{glossaryEntry.Definition}\n";
                }

                var embedBuilder = new EmbedBuilder()
                    .WithTitle(searchValue)
                    .WithDescription(description)
                    .WithColor(DiscordBotConsts.MhoColorPink);

                await RespondAsync(embed: embedBuilder.Build(), ephemeral: privateMsg);
            }
        }
    }
}