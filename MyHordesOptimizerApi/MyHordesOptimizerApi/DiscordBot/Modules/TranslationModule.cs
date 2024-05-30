using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Discord;
using Discord.Interactions;
using Discord.WebSocket;
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

        [ComponentInteraction(customId: "previous:*")]
        public async Task OnPreviousAsync()
        {
            await DeferAsync();

            var variables = ((SocketMessageComponent)Context.Interaction).Data.CustomId.Replace("previous:", "").Split(":");
            var page = int.Parse(variables[0]);
            var locale = (Locales)Enum.Parse(typeof(Locales), variables[1]);
            var searchValue = variables[2];
            var onlyExactMatch = variables[3] != "0";

            var embeds = await getTranslationsEmbeds(locale, searchValue, onlyExactMatch);
            if (page >= 0 && page < embeds.Count - 1)
            {
                await ModifyOriginalResponseAsync(props =>
                {
                    props.Embed = embeds[page];
                    props.Components = CreateComponents(embeds, page, locale, searchValue, onlyExactMatch);
                });
            }
        }

        [ComponentInteraction(customId: "next:*")]
        public async Task OnNextAsync()
        {
            await DeferAsync();

            var variables = ((SocketMessageComponent)Context.Interaction).Data.CustomId.Replace("next:", "").Split(":");
            var page = int.Parse(variables[0]);
            var locale = (Locales)Enum.Parse(typeof(Locales), variables[1]);
            var searchValue = variables[2];
            var onlyExactMatch = variables[3] != "0";

            var embeds = await getTranslationsEmbeds(locale, searchValue, onlyExactMatch);
            if (page >= 0 && page < embeds.Count - 1)
            {
                await ModifyOriginalResponseAsync(props =>
                {
                    props.Embed = embeds[page];
                    props.Components = CreateComponents(embeds, page, locale, searchValue, onlyExactMatch);
                });
            }
        }

        [SlashCommand(name: "translate", description: "Find matches for MyHordes terms in other languages")]
        public async Task TranslateAsync(
            [Summary(name: "language", description: "The language of the source text")]
            Locales locale,
            [Summary(name: "text-to-translate", description: "The text to be translated")]
            string searchValue,
            [Summary(name: "only-exact-match", description: "If true and there are exact results, only exact results are returned")]
            bool onlyExactMatch = true,
            [Summary(name: "private-msg", description: "True if the message should not be seen by all")]
            bool privateMsg = false)
        {
            try
            {
                await DeferAsync(ephemeral: privateMsg);

                if (privateMsg)
                {
                    await ModifyOriginalResponseAsync(props => { props.Content = "Les traductions seront envoyées par message privé"; });
                }

                var embeds = await getTranslationsEmbeds(locale, searchValue, onlyExactMatch);

                if (privateMsg)
                {
                    if (embeds.Count <= 1)
                    {
                        await Context.User.SendMessageAsync(embed: embeds[0]);
                    }
                    else
                    {
                        await Context.User.SendMessageAsync(embed: embeds[0], components: CreateComponents(embeds, 0, locale, searchValue, onlyExactMatch));
                    }
                }
                else
                {
                    if (embeds.Count <= 1)
                    {
                        await ModifyOriginalResponseAsync(props => { props.Embed = embeds[0]; });
                    }
                    else
                    {
                        await ModifyOriginalResponseAsync(props =>
                        {
                            props.Embed = embeds[0];
                            props.Components = CreateComponents(embeds, 0, locale, searchValue, onlyExactMatch);
                        });
                    }
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

        private async Task<List<Embed>> getTranslationsEmbeds(Locales locale, string searchValue, bool onlyExactMatch)
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

            var count = 1;
            var embeds = new List<Embed>();

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

                embeds.Add(embedBuilder.Build());

                count++;
            }

            return embeds;
        }

        private MessageComponent CreateComponents(List<Embed> embeds, int page, Locales locale, string searchValue, bool onlyExactMatch)
        {
            var onlyExactMatchNumber = onlyExactMatch ? "0" : "1";

            var previous = new ButtonBuilder()
                .WithCustomId($"previous:{Math.Max(0, page - 1)}:{locale.ToString()}:{searchValue}:{onlyExactMatchNumber}")
                .WithLabel("Précédent")
                .WithDisabled(page == 0)
                .WithStyle(ButtonStyle.Primary);

            var next = new ButtonBuilder()
                .WithCustomId($"next:{Math.Min(page + 1, embeds.Count - 1)}:{locale.ToString()}:{searchValue}:{onlyExactMatchNumber}")
                .WithLabel("Suivant")
                .WithDisabled(page >= embeds.Count - 1)
                .WithStyle(ButtonStyle.Primary);

            var components = new ComponentBuilder()
                .WithButton(previous)
                .WithButton(next);

            return components.Build();
        }
    }
}
