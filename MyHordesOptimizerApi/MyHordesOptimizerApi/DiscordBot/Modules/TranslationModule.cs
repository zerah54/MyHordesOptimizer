using System;
using System.Collections.Generic;
using Discord.Interactions;
using System.Threading.Tasks;
using Discord;
using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.DiscordBot.Enums;
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

        [SlashCommand(name: "translate", description: "Trouve les correspondances des termes de MyHordes dans d'autres langues")]
        public async Task TranslateAsync(string locale, string searchValue, bool privateMsg = false,
            bool onlyExactMatchIfPossible = true)
        {
            _logger.LogWarning($"locale {locale}");
            try
            {
                var completeTranslation = _translationService.GetTranslation(locale.ToString(), searchValue);


                var hasExactResponse = completeTranslation.Translations
                    .Exists((translation) => translation.Key.IsExactMatch);
                var shouldAddInexactMatch = (hasExactResponse && !onlyExactMatchIfPossible) || !hasExactResponse;

                var searchValueResponse = "";

                switch (locale)
                {
                    case "de":
                        searchValueResponse += ":flag_de:";
                        break;
                    case "en":
                        searchValueResponse += ":flag_gb:";
                        break;
                    case "es":
                        searchValueResponse += ":flag_es:";
                        break;
                    case "fr":
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
                    await Context.User.SendMessageAsync(searchValueResponse);
                    await Context.User.SendMessageAsync("\n``` ```\n");
                }
                else
                {
                    await RespondAsync(searchValueResponse);
                    await Context.Channel.SendMessageAsync("\n``` ```\n");
                }


                foreach (KeyValuePair<TranslationKeyDto, TranslationDto> result in completeTranslation.Translations)
                {
                    if (result.Key.IsExactMatch || shouldAddInexactMatch)
                    {
                        var notExactResponse = "";
                        // Ajoute toutes les traductions
                        notExactResponse +=
                            $":flag_de: {result.Value.De[0].Replace("<strong>", "**").Replace("</strong>", "**").Replace("{hr}", "\n")}\n";
                        notExactResponse +=
                            $":flag_gb: {result.Value.En[0].Replace("<strong>", "**").Replace("</strong>", "**").Replace("{hr}", "\n")}\n";
                        notExactResponse +=
                            $":flag_es: {result.Value.Es[0].Replace("<strong>", "**").Replace("</strong>", "**").Replace("{hr}", "\n")}\n";
                        notExactResponse +=
                            $":flag_fr: {result.Value.Fr[0].Replace("<strong>", "**").Replace("</strong>", "**").Replace("{hr}", "\n")}\n";


                        if (privateMsg)
                        {
                            await Context.User.SendMessageAsync(notExactResponse);
                            await Context.User.SendMessageAsync("\n``` ```\n");
                        }
                        else
                        {
                            await Context.Channel.SendMessageAsync(notExactResponse);
                            await Context.Channel.SendMessageAsync("\n``` ```\n");
                        }
                    }
                }
            }
            catch (Exception e)
            {
                _logger.LogWarning(e.ToString(), e);
                await RespondAsync(
                    $"Une erreur s'est produite lors de la récupération des traductions\n```{e.Message}```",
                    ephemeral: true);
            }
        }
    }
}