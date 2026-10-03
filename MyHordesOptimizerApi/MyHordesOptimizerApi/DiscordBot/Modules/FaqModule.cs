using System.Collections.Generic;
using System.Threading.Tasks;
using Discord;
using Discord.Interactions;
using MyHordesOptimizerApi.DiscordBot.Enums;
using MyHordesOptimizerApi.DiscordBot.Localization;
using MyHordesOptimizerApi.DiscordBot.Utility;

namespace MyHordesOptimizerApi.DiscordBot.Modules
{
    [IntegrationType(ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall)]
    [CommandContextType(InteractionContextType.Guild, InteractionContextType.BotDm, InteractionContextType.PrivateChannel)]
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
                .WithLabel(Context.Interaction.Texts().FaqGoToWebsite)
                .WithUrl("https://myhordes-optimizer.web.app")
                .WithStyle(ButtonStyle.Link);
            
            var components = new ComponentBuilder()
                .WithButton(goToWebsite);
            
            await RespondAsync(components: components.Build(), ephemeral: privateMsg);
        }

        [SlashCommand(name: "addon", description: "Displays the links for the extension and script MyHordes Optimizer")]
        public async Task AddonAsync(
            [Summary(name: "private-msg", description: "True if the message should not be seen by all")]
            bool privateMsg = false
        )
        {
            BotTexts texts = Context.Interaction.Texts();

            // 1. Le tutoriel
            var scriptTutorial = new ButtonBuilder()
                .WithLabel(texts.FaqGoToTutorial)
                .WithUrl("https://myhordes-optimizer.web.app/tutorials/script-extension/installation")
                .WithStyle(ButtonStyle.Link);

            // 2. L'extension Chrome
            var chromeAddon = new ButtonBuilder()
                .WithLabel(texts.FaqChromeExtension)
                .WithUrl("https://chromewebstore.google.com/detail/mho-addon/jolghobcgphmgaiachbipnpiimmgknno")
                .WithStyle(ButtonStyle.Link);

            // 3. L'extension Firefox (sans langue dans l'adresse : AMO prend celle du navigateur)
            var firefoxAddon = new ButtonBuilder()
                .WithLabel(texts.FaqFirefoxExtension)
                .WithUrl("https://addons.mozilla.org/firefox/addon/mho-addon/")
                .WithStyle(ButtonStyle.Link);

            // 4. Le script
            var scriptInstall = new ButtonBuilder()
                .WithLabel(texts.FaqInstallScript)
                .WithUrl("https://github.com/zerah54/MyHordesOptimizer/raw/main/Scripts/Tampermonkey/my_hordes_optimizer.user.js")
                .WithStyle(ButtonStyle.Link);

            // Ajout des composants dans l'ordre d'affichage souhaité
            var components = new ComponentBuilder()
                .WithButton(scriptTutorial)
                .WithButton(chromeAddon)
                .WithButton(firefoxAddon)
                .WithButton(scriptInstall);

            await RespondAsync(components: components.Build(), ephemeral: privateMsg);
        }

        [SlashCommand(name: "become-ghoul", description: "Different ways to turn into a ghoul")]
        public async Task BecomeGhoulAsync(
            [Summary(name: "private-msg", description: "True if the message should not be seen by all")]
            bool privateMsg = false
        )
        {
            // Valeurs des fixtures MyHordes (ActionDataService : eat_bone, eat_fleshroom, eat_meat, eat_cadaver)
            BotTexts texts = Context.Interaction.Texts();
            string description = string.Join("\n",
                texts.FaqValueLine(texts.ItemMeatyBone, 3),
                texts.FaqValueLine(texts.ItemFleshroomPuree, 4),
                texts.FaqValueLine(texts.ItemHumanFlesh, 5),
                texts.FaqValueLine(texts.ItemTravellersCorpse, 90));

            var embedBuilder = new EmbedBuilder()
                .WithTitle(texts.FaqGhoulTitle)
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
            // Valeurs des fixtures MyHordes (ActionDataService : drug_rand_1)
            BotTexts texts = Context.Interaction.Texts();
            string description = string.Join("\n",
                texts.FaqValueLine(texts.FaqMseGivesAp(6), 40),
                texts.FaqValueLine(texts.FaqMseTerrorises, 20),
                texts.FaqValueLine(texts.FaqMseGivesApAndAddiction(7), 20),
                texts.FaqValueLine(texts.FaqMseNoEffect, 20));

            var embedBuilder = new EmbedBuilder()
                .WithTitle(texts.FaqMseTitle)
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
            // Chaque paire : syntaxe échappée (affichée telle quelle), puis son rendu.
            BotTexts t = Context.Interaction.Texts();
            string level2 = t.CheatLevel(2);
            string level3 = t.CheatLevel(3);
            var fields = new List<KeyValuePair<string, string>>
            {
                new($"\\*\\*{t.CheatBold}\\*\\*", $"**{t.CheatBold}**"),
                new($"\\*{t.CheatItalic}\\*", $"*{t.CheatItalic}*"),
                new($"\\_{t.CheatItalic}\\_", $"_{t.CheatItalic}_"),
                new($"\\_\\_{t.CheatUnderline}\\_\\_", $"__{t.CheatUnderline}__"),
                new($"\\~\\~{t.CheatStrikethrough}\\~\\~", $"~~{t.CheatStrikethrough}~~"),
                new($"\\|\\|{t.CheatSpoiler}\\|\\|", $"||{t.CheatSpoiler}||"),
                new($"\\`{t.CheatCode}\\`", $"`{t.CheatCode}`"),
                new("\u200b\n", "\u200b\n"),
                new($"\\> {t.CheatQuote}", $"> {t.CheatQuote}"),
                new($"\\`\\`\\`{t.CheatMultilineCode}\\`\\`\\`", $"```{t.CheatMultilineCode}```\n"),
                new("\u200b\n", "\u200b\n"),
                new($"\\>\\>\\> {t.CheatMultilineQuote}", $">>> {t.CheatMultilineQuote}"),
                new($"\\[{t.CheatMaskedLink}]\\(https://myhordes-optimizer.web.app/)", $"[{t.CheatMaskedLink}](https://myhordes-optimizer.web.app/)")
            };

            var descriptions = new List<KeyValuePair<string, string>>
            {
                new($"# \\# {t.CheatBigTitle}", "\n\n"),
                new($"## \\#\\# {t.CheatMediumTitle}", "\n\n"),
                new($"### \\#\\#\\# {t.CheatSmallTitle}", "\n\n"),
                new($"-# \\-\\# {t.CheatSmallText}", "\n\n"),
                new($"\\* {t.CheatBulletList} {t.CheatSpacesHint}\n⋅⋅\\* {level2}\n⋅⋅⋅⋅\\* {level3}",
                    $"* {t.CheatBulletList}\n  * {level2}\n    * {level3}\n\n"),
                new($"\u200a1. {t.CheatOrderedList} {t.CheatSpacesHint}\n⋅⋅1. {level2}\n⋅⋅2. {level2}\n⋅⋅⋅⋅⋅⋅1. {level3}",
                    $"1. {t.CheatOrderedList}\n  1. {level2}\n  2. {level2}\n      1. {level3}\n\n")
            };
            
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
            Locales? locale = null
        )
        {
            BotTexts texts = Context.Interaction.Texts();
            var description = "";

            // Phrases du jeu : dans la langue choisie, à défaut celle de l'auteur de la commande
            switch (locale ?? texts.Locale)
            {
                case Locales.De:
                    description += "`0% - 10%` : Du schätzt, dass deine Überlebenschancen hier quasi Null sind... Besser gleich 'ne Zyanidkapsel schlucken.\n";
                    description += "`11% - 30%` : Du schätzt, dass deine Überlebenschancen hier sehr gering sind. Vielleicht hast du ja Bock 'ne Runde Kopf oder Zahl zu spielen?\n";
                    description += "`31% - 50%` : Du schätzt, dass deine Überlebenschancen hier gering sind. Hmmm... schwer zu sagen, wie das hier ausgeht.\n";
                    description += "`51% - 65%` : Du schätzt, dass deine Überlebenschancen hier mittelmäßig sind. Ist allerdings einen Versuch wert.. obwohl, Unfälle passieren schnell...\n";
                    description += "`66% - 80%` : Du schätzt, dass deine Überlebenschancen hier zufriedenstellend sind - vorausgesetzt du erlebst keine böse Überraschung.\n";
                    description += "`81% - 90%` : Du schätzt, dass deine Überlebenschancen hier korrekt sind. Jetzt heißt's nur noch Daumen drücken!\n";
                    description += "`91% - 99%` : Du schätzt, dass deine Überlebenschancen hier gut sind. Du müsstest hier problemlos die Nacht verbringen können.\n";
                    description += "`100%` : Du schätzt, dass deine Überlebenschancen hier optimal sind. Niemand wird dich sehen - selbst wenn man mit dem Finger auf dich zeigt.\n";
                    break;
                case Locales.En:                    
                    description += "`0% - 10%` : You reckon your chances of surviving here are hee haw... Might as well take some cyanide now.\n";
                    description += "`11% - 30%` : You reckon your chances of surviving here are really poor. Maybe you should play heads or tails?\n";
                    description += "`31% - 50%` : You reckon your chances of surviving here are poor. Difficult to say.\n";
                    description += "`51% - 65%` : You reckon your chances of surviving here are limited, but tempting. However, accidents happen...\n";
                    description += "`66% - 80%` : You reckon your chances of surviving here are largely satisfactory, as long as nothing unforeseen happens.\n";
                    description += "`81% - 90%` : You reckon your chances of surviving here are decent: you just have to hope for the best!\n";
                    description += "`91% - 99%` : You reckon your chances of surviving here are good, you should be able to spend the night here.\n";
                    description += "`100%` : You reckon your chances of surviving here are optimal. Nobody would see you, even if they were looking straight at you.\n";
                    break;
                case Locales.Es:                    
                    description += "`0% - 10%` : Crees que tus posibilidades de sobrevivir aquí son casi nulas... ¿Cianuro?\n";
                    description += "`11% - 30%` : Crees que tus posibilidades de sobrevivir aquí son muy pocas. ¿Apostamos?\n";
                    description += "`31% - 50%` : Crees que tus posibilidades de sobrevivir aquí son pocas. Quién sabe...\n";
                    description += "`51% - 65%` : Crees que tus posibilidades de sobrevivir aquí son reducidas, aunque se puede intentar. Tú sabes, podrías sufrir un accidente...\n";
                    description += "`66% - 80%` : Crees que tus posibilidades de sobrevivir aquí son aceptables, esperando que no suceda ningún imprevisto.\n";
                    description += "`81% - 90%` : Crees que tus posibilidades de sobrevivir aquí son buenas. ¡Cruza los dedos!\n";
                    description += "`91% - 99%` : Crees que tus posibilidades de sobrevivir aquí son altas. Podías pasar la noche aquí.\n";
                    description += "`100%` : Crees que tus posibilidades de sobrevivir aquí son óptimas. Nadie te verá, ni señalándote con el dedo\n";
                    break;
                case Locales.Fr:                  
                default:  
                    description += "`0% - 10%` : Vous estimez que vos chances de survie ici sont quasi nulles... Autant gober du cyanure tout de suite.\n";
                    description += "`11% - 30%` : Vous estimez que vos chances de survie ici sont très faibles. Peut-être que vous aimez jouer à pile ou face ?\n";
                    description += "`31% - 50%` : Vous estimez que vos chances de survie ici sont faibles. Difficile à dire.\n";
                    description += "`51% - 65%` : Vous estimez que vos chances de survie ici sont limitées, bien que ça puisse se tenter. Mais un accident est vite arrivé...\n";
                    description += "`66% - 80%` : Vous estimez que vos chances de survie ici sont à peu près satisfaisantes, pour peu qu'aucun imprévu ne vous tombe dessus.\n";
                    description += "`81% - 90%` : Vous estimez que vos chances de survie ici sont correctes : il ne vous reste plus qu'à croiser les doigts !\n";
                    description += "`91% - 99%` : Vous estimez que vos chances de survie ici sont élevées : vous devriez pouvoir passer la nuit ici.\n";
                    description += "`100%` : Vous estimez que vos chances de survie ici sont optimales : personne ne vous verrait même en vous pointant du doigt.\n";
                    break;
            }

            var embedBuilder = new EmbedBuilder()
                .WithTitle(texts.FaqCampingTitle)
                .WithDescription(description)
                .WithColor(DiscordBotConsts.MhoColorPink);

            await RespondAsync(embed: embedBuilder.Build(), ephemeral: privateMsg);
        }

    }
}