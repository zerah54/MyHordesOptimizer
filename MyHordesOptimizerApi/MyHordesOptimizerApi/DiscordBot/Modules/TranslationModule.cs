using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Discord;
using Discord.Interactions;
using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.DiscordBot.Enums;
using MyHordesOptimizerApi.DiscordBot.Utility;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Translations;
using MyHordesOptimizerApi.Services.Interfaces.Translations;

namespace MyHordesOptimizerApi.DiscordBot.Modules
{
    public class TranslationModule : InteractionModuleBase<SocketInteractionContext>
    {
        private readonly ILogger<TranslationModule> _logger;
        private readonly ITranslationService _translationService;

        public TranslationModule(ILogger<TranslationModule> logger, ITranslationService translationService)
        {
            _logger = logger;
            _translationService = translationService;
        }

        [SlashCommand(name: "translate", description: "Find matches for MyHordes terms in other languages")]
        public async Task TranslateAsync(
            [Summary(name:"language", description: "The language of the source text")]
            Locales locale,
            [Summary(name:"text-to-translate", description: "The text to be translated")]
            string searchValue,
            [Summary(name:"only-exact-match", description: "If true and there are exact results, only exact results are returned")]
            bool onlyExactMatch = true,
            [Summary(name:"private-msg", description: "True if the message should not be seen by all")]
            bool privateMsg = false)
        {
            try
            {
                var completeTranslation = await _translationService.GetTranslationAsync(locale.ToString().ToLower(), searchValue);

                var hasExactResponse = completeTranslation.Translations
                    .Exists((translation) => translation.Key.IsExactMatch);
                var shouldAddInexactMatch = (hasExactResponse && !onlyExactMatch) || !hasExactResponse;

                var searchValueResponse = "";

                switch (locale)
                {
                    case Locales.De:
                        searchValueResponse += ":flag_de:";
                        break;
                    case Locales.En:
                        searchValueResponse += ":flag_gb:";
                        break;
                    case Locales.Es:
                        searchValueResponse += ":flag_es:";
                        break;
                    case Locales.Fr:
                        searchValueResponse += ":flag_fr:";
                        break;
                    default:
                        throw new ArgumentException(
                            "La langue doit avoir pour valeur \"de\", \"en\", \"es\" ou \"fr\"");
                }

                searchValueResponse += $" {searchValue}";

                if (privateMsg)
                {
                    await RespondAsync("Les traductions seront envoyées par message privé", ephemeral: true);
                }

                var count = 1;

                var translations = completeTranslation.Translations
                    .FindAll((translation) => translation.Key.IsExactMatch || shouldAddInexactMatch);

                foreach (KeyValuePair<TranslationKeyDto, TranslationDto> translation in translations)
                {
                    var notExactResponse = "";
                    // Ajoute toutes les traductions
                    notExactResponse +=
                        $":flag_de: {translation.Value.De[0].Replace("<strong>", "**").Replace("</strong>", "**").Replace("{hr}", "\n")}\n";
                    notExactResponse +=
                        $":flag_gb: {translation.Value.En[0].Replace("<strong>", "**").Replace("</strong>", "**").Replace("{hr}", "\n")}\n";
                    notExactResponse +=
                        $":flag_es: {translation.Value.Es[0].Replace("<strong>", "**").Replace("</strong>", "**").Replace("{hr}", "\n")}\n";
                    notExactResponse +=
                        $":flag_fr: {translation.Value.Fr[0].Replace("<strong>", "**").Replace("</strong>", "**").Replace("{hr}", "\n")}\n";

                    var embedBuilder = new EmbedBuilder()
                        .WithTitle($"{searchValueResponse} ({count} / {translations.Count})")
                        .WithDescription(notExactResponse)
                        .WithColor(DiscordBotConsts.MhoColorPink);

                    if (privateMsg)
                    {
                        await Context.User.SendMessageAsync(embed: embedBuilder.Build());
                    }
                    else
                    {
                        if (count == 1)
                        {
                            await RespondAsync(embed: embedBuilder.Build());
                        } else {
                            await Context.Channel.SendMessageAsync(embed: embedBuilder.Build());
                        }
                    }

                    count++;
                }
            }
            catch (Exception e)
            {
                _logger.LogError(e.ToString(), e);
                await RespondAsync(
                    $"Une erreur s'est produite lors de la récupération des traductions\n```{e.Message}```",
                    ephemeral: true);
            }
        }
    }
}