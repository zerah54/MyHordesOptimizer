using System.Collections.Generic;
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
            var goToWebsite = new ButtonBuilder()
                .WithLabel("Aller au site")
                .WithUrl("https://myhordes-optimizer.web.app")
                .WithStyle(ButtonStyle.Link);
            
            var components = new ComponentBuilder()
                .WithButton(goToWebsite);
            
            await RespondAsync(components: components.Build(), ephemeral: privateMsg);
        }

        [SlashCommand(name: "script", description: "The script address")]
        public async Task ScriptAsync(
            [Summary(name: "private-msg", description: "True if the message should not be seen by all")]
            bool privateMsg = false
        )
        {
            var scriptTutorial = new ButtonBuilder()
                .WithLabel("Aller au tutoriel")
                .WithUrl("https://myhordes-optimizer.web.app/tutorials/script/installation")
                .WithStyle(ButtonStyle.Link);
            
            var scriptInstall = new ButtonBuilder()
                .WithLabel("Installer le script")
                .WithUrl("https://github.com/zerah54/MyHordesOptimizer/raw/main/Scripts/Tampermonkey/my_hordes_optimizer.user.js")
                .WithStyle(ButtonStyle.Link);
            
            var components = new ComponentBuilder()
                .WithButton(scriptTutorial)
                .WithButton(scriptInstall);
            
            await RespondAsync(components: components.Build(), ephemeral: privateMsg);
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
        
        [SlashCommand(name: "mse", description: "mse")]
        public async Task MseResultAsync(
            [Summary(name: "private-msg", description: "True if the message should not be seen by all")]
            bool privateMsg = false
        )
        {
            var description = "";
            description += "Donne 6 PA : 40%\n";
            description += "Terrorise : 20%\n";
            description += "Donne 7 PA + addiction : 20%\n";
            description += "Ne fait rien : 20%\n";

            var embedBuilder = new EmbedBuilder()
                .WithTitle("Résultats de la consommation de MSE")
                .WithDescription(description)
                .WithColor(DiscordBotConsts.MhoColorPink);

            await RespondAsync(embed: embedBuilder.Build(), ephemeral: privateMsg);
        }
        
        [SlashCommand(name: "discord-cheat-sheet", description: "List of Discord shaping shortcuts")]
        public async Task DiscordCheatSheetAsync(
            [Summary(name: "private-msg", description: "True if the message should not be seen by all")]
            bool privateMsg = false
        )
        {
            var fields = new List<KeyValuePair<string, string>>();
            fields.Add(new KeyValuePair<string, string>("\\*\\*gras\\*\\*", "**gras**"));
            fields.Add(new KeyValuePair<string, string>("\\*italique\\*", "*italique*"));
            fields.Add(new KeyValuePair<string, string>("\\_italique\\_", "_italique_"));
            fields.Add(new KeyValuePair<string, string>("\\_\\_souligné\\_\\_", "__souligné__"));
            fields.Add(new KeyValuePair<string, string>("\\~\\~barré\\~\\~", "~~barré~~"));
            fields.Add(new KeyValuePair<string, string>("\\|\\|spoiler\\|\\|", "||spoiler||"));
            fields.Add(new KeyValuePair<string, string>("\\`bloc de texte\\`", "`bloc de texte`"));
            fields.Add(new KeyValuePair<string, string>("\u200b\n", "\u200b\n"));
            fields.Add(new KeyValuePair<string, string>("\\> citation", "> citation"));
            fields.Add(new KeyValuePair<string, string>("\\`\\`\\`bloc de texte\nsur plusieurs lignes\\`\\`\\`", "```bloc de texte\nsur plusieurs lignes```\n"));
            fields.Add(new KeyValuePair<string, string>("\u200b\n", "\u200b\n"));
            fields.Add(new KeyValuePair<string, string>("\\>\\>\\> Citation\nsur plusieurs lignes", ">>> Citation\nsur plusieurs lignes"));
            fields.Add(new KeyValuePair<string, string>("\\[Lien masqué]\\(https://myhordes-optimizer.web.app/)", "[Lien masqué](https://myhordes-optimizer.web.app/)"));
            
            var descriptions = new List<KeyValuePair<string, string>>();
            descriptions.Add(new KeyValuePair<string, string>("# \\# Gros titre", "\n\n"));
            descriptions.Add(new KeyValuePair<string, string>("## \\#\\# Moyen titre", "\n\n"));
            descriptions.Add(new KeyValuePair<string, string>("### \\#\\#\\# Petit titre", "\n\n"));
            descriptions.Add(new KeyValuePair<string, string>("\\* Liste à puce (les \a représentent les espaces)\n\a\a\\* Niveau 2\n\a\a\a\a\\* Niveau 3", "* Liste à puce\n * Niveau 2\n    * Niveau 3\n\n"));
            descriptions.Add(new KeyValuePair<string, string>("\u200a1. Liste ordonnée (les \a représentent les espaces)\n\a\a1. niveau 2\n\a\a2. Niveau 2\n\a\a\a\a1. Niveau 3", "1. Liste ordonnée\n 1.  Niveau 2\n  2. Niveau 2\n    1. Niveau 3\n\n"));
            
            var completeDescription = "";
            
            descriptions.ForEach((description) =>
            {
                completeDescription += $"{description.Key}\n{description.Value}";
            });
                
            var embedBuilder = new EmbedBuilder()
                .WithDescription(completeDescription)
                .WithColor(DiscordBotConsts.MhoColorPink);
            
            fields.ForEach((field) =>
            {
                var fieldBuilder = new EmbedFieldBuilder()
                    .WithName(field.Key)
                    .WithValue(field.Value)
                    .WithIsInline(true);
                embedBuilder.AddField(fieldBuilder);
            });

            await RespondAsync(embed: embedBuilder.Build(), ephemeral: privateMsg);
        }
    }
}