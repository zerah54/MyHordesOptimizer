using System.Collections.Generic;
using System.Threading.Tasks;
using Discord;
using Discord.Interactions;
using MyHordesOptimizerApi.DiscordBot.Enums;
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
        
        [SlashCommand(name: "mse", description: "Probabilities of effects of unlabeled drugs")]
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
            descriptions.Add(new KeyValuePair<string, string>("-# \\-\\# Petit texte", "\n\n"));
            descriptions.Add(new KeyValuePair<string, string>("\\* Liste à puce (les ⋅ représentent les espaces)\n⋅⋅\\* Niveau 2\n⋅⋅⋅⋅\\* Niveau 3", "* Liste à puce\n  * Niveau 2\n    * Niveau 3\n\n"));
            descriptions.Add(new KeyValuePair<string, string>("\u200a1. Liste ordonnée (les ⋅ représentent les espaces)\n⋅⋅1. niveau 2\n⋅⋅2. Niveau 2\n⋅⋅⋅⋅⋅⋅1. Niveau 3", "1. Liste ordonnée\n  1. Niveau 2\n  2. Niveau 2\n      1. Niveau 3\n\n"));
            
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
        
        
        
        [SlashCommand(name: "camping-phrases", description: "The different phrases we get while camping depending on the actual chances of survival")]
        public async Task CampingPhrasesAsync(
            [Summary(name: "private-msg", description: "True if the message should not be seen by all")]
            bool privateMsg = false,
            [Summary(name: "language", description: "The language of the searched text")]
            Locales locale = Locales.Fr
        )
        {
            var description = "";
            
            switch (locale)
            {
                case Locales.De:
                    description += "`0% - 10%` : Du schätzt, dass deine Überlebenschancen hier quasi Null sind... Besser gleich 'ne Zyanidkapsel schlucken.";
                    description += "`11% - 30%` : Du schätzt, dass deine Überlebenschancen hier sehr gering sind. Vielleicht hast du ja Bock 'ne Runde Kopf oder Zahl zu spielen?";
                    description += "`31% - 50%` : Du schätzt, dass deine Überlebenschancen hier gering sind. Hmmm... schwer zu sagen, wie das hier ausgeht.";
                    description += "`51% - 65%` : Du schätzt, dass deine Überlebenschancen hier mittelmäßig sind. Ist allerdings einen Versuch wert.. obwohl, Unfälle passieren schnell...";
                    description += "`66% - 80%` : Du schätzt, dass deine Überlebenschancen hier zufriedenstellend sind - vorausgesetzt du erlebst keine böse Überraschung.";
                    description += "`81% - 90%` : Du schätzt, dass deine Überlebenschancen hier korrekt sind. Jetzt heißt's nur noch Daumen drücken!";
                    description += "`91% - 99%` : Du schätzt, dass deine Überlebenschancen hier gut sind. Du müsstest hier problemlos die Nacht verbringen können.";
                    description += "`100%` : Du schätzt, dass deine Überlebenschancen hier optimal sind. Niemand wird dich sehen - selbst wenn man mit dem Finger auf dich zeigt.";
                    break;
                case Locales.En:                    
                    description += "`0% - 10%` : You reckon your chances of surviving here are hee haw... Might as well take some cyanide now.";
                    description += "`11% - 30%` : You reckon your chances of surviving here are really poor. Maybe you should play heads or tails?";
                    description += "`31% - 50%` : You reckon your chances of surviving here are poor. Difficult to say.";
                    description += "`51% - 65%` : You reckon your chances of surviving here are limited, but tempting. However, accidents happen...";
                    description += "`66% - 80%` : You reckon your chances of surviving here are largely satisfactory, as long as nothing unforeseen happens.";
                    description += "`81% - 90%` : You reckon your chances of surviving here are decent: you just have to hope for the best!";
                    description += "`91% - 99%` : You reckon your chances of surviving here are good, you should be able to spend the night here.";
                    description += "`100%` : You reckon your chances of surviving here are optimal. Nobody would see you, even if they were looking straight at you.";
                    break;
                case Locales.Es:                    
                    description += "`0% - 10%` : Crees que tus posibilidades de sobrevivir aquí son casi nulas... ¿Cianuro?";
                    description += "`11% - 30%` : Crees que tus posibilidades de sobrevivir aquí son muy pocas. ¿Apostamos?";
                    description += "`31% - 50%` : Crees que tus posibilidades de sobrevivir aquí son pocas. Quién sabe...";
                    description += "`51% - 65%` : Crees que tus posibilidades de sobrevivir aquí son reducidas, aunque se puede intentar. Tú sabes, podrías sufrir un accidente...";
                    description += "`66% - 80%` : Crees que tus posibilidades de sobrevivir aquí son aceptables, esperando que no suceda ningún imprevisto.";
                    description += "`81% - 90%` : Crees que tus posibilidades de sobrevivir aquí son buenas. ¡Cruza los dedos!";
                    description += "`91% - 99%` : Crees que tus posibilidades de sobrevivir aquí son altas. Podías pasar la noche aquí.";
                    description += "`100%` : Crees que tus posibilidades de sobrevivir aquí son óptimas. Nadie te verá, ni señalándote con el dedo";
                    break;
                case Locales.Fr:                  
                default:  
                    description += "`0% - 10%` : Vous estimez que vos chances de survie ici sont quasi nulles… Autant gober du cyanure tout de suite.";
                    description += "`11% - 30%` : Vous estimez que vos chances de survie ici sont très faibles. Peut-être que vous aimez jouer à pile ou face ?";
                    description += "`31% - 50%` : Vous estimez que vos chances de survie ici sont faibles. Difficile à dire.";
                    description += "`51% - 65%` : Vous estimez que vos chances de survie ici sont limitées, bien que ça puisse se tenter. Mais un accident est vite arrivé...";
                    description += "`66% - 80%` : Vous estimez que vos chances de survie ici sont à peu près satisfaisantes, pour peu qu'aucun imprévu ne vous tombe dessus.";
                    description += "`81% - 90%` : Vous estimez que vos chances de survie ici sont correctes : il ne vous reste plus qu'à croiser les doigts !";
                    description += "`91% - 99%` : Vous estimez que vos chances de survie ici sont élevées : vous devriez pouvoir passer la nuit ici.";
                    description += "`100%` : Vous estimez que vos chances de survie ici sont optimales : personne ne vous verrait même en vous pointant du doigt.";
                    break;
            }

            var embedBuilder = new EmbedBuilder()
                .WithTitle("Chances de survie en camping")
                .WithDescription(description)
                .WithColor(DiscordBotConsts.MhoColorPink);

            await RespondAsync(embed: embedBuilder.Build(), ephemeral: privateMsg);
        }

    }
}