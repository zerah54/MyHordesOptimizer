using System.Threading.Tasks;
using Discord;
using Discord.Interactions;
using MyHordesOptimizerApi.DiscordBot.Utility;

namespace MyHordesOptimizerApi.DiscordBot.Modules
{
    [Group(name: "faq", description: "Frequently Asked Questions")]
    public class FaqModule : InteractionModuleBase<SocketInteractionContext>
    {
        [SlashCommand(name: "website", description: "The website address")]
        public async Task WebsiteAsync(
            [Summary(name: "private-msg", description: "True if the message should not be seen by all")]
            bool privateMsg = false
        )
        {
            var embedBuilder = new EmbedBuilder()
                .WithDescription("https://myhordes-optimizer.web.app")
                .WithColor(DiscordBotConsts.MhoColorPink);
            await RespondAsync(embed: embedBuilder.Build(), ephemeral: privateMsg);
        }

        [SlashCommand(name: "script", description: "The script address")]
        public async Task ScriptAsync(
            [Summary(name: "private-msg", description: "True if the message should not be seen by all")]
            bool privateMsg = false
        )
        {
            var embedBuilder = new EmbedBuilder()
                .WithDescription(
                    "https://github.com/zerah54/MyHordesOptimizer/raw/main/Scripts/Tampermonkey/my_hordes_optimizer.user.js")
                .WithColor(DiscordBotConsts.MhoColorPink);
            await RespondAsync(embed: embedBuilder.Build(), ephemeral: privateMsg);
        }

        [SlashCommand(name: "become-ghoul", description: "Different ways to turn into a ghoul")]
        public async Task BecomeGhoulAsync(
            [Summary(name: "private-msg", description: "True if the message should not be seen by all")]
            bool privateMsg = false
        )
        {
            var description = "";
            description += "Os Charnu : 3%\n";
            description += "Purée de Charognardes : 4%\n";
            description += "Viande Humaine : 5%\n";
            description += "Cadavre d'un Voyageur : 90%\n";

            var embedBuilder = new EmbedBuilder()
                .WithTitle("Chances de devenir goule")
                .WithDescription(description)
                .WithColor(DiscordBotConsts.MhoColorPink);

            await RespondAsync(embed: embedBuilder.Build(), ephemeral: privateMsg);
        }
    }
}