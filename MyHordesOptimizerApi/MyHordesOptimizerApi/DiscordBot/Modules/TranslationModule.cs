using System;
using System.Collections.Generic;
using System.Globalization;
using System.Threading.Tasks;
using Discord;
using Discord.Interactions;
using Discord.WebSocket;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.DiscordBot.Enums;
using MyHordesOptimizerApi.DiscordBot.Localization;
using MyHordesOptimizerApi.DiscordBot.Utility;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Translations;
using MyHordesOptimizerApi.Services.Interfaces.Translations;

namespace MyHordesOptimizerApi.DiscordBot.Modules
{
    [IntegrationType(ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall)]
    [CommandContextType(InteractionContextType.Guild, InteractionContextType.BotDm, InteractionContextType.PrivateChannel)]
    public class TranslationModule : InteractionModuleBase<SocketInteractionContext>
    {
        // Custom id des boutons de pagination : "{préfixe}{page}:{identifiant de la recherche}". Discord limite un
        // custom id à 100 caractères : le texte recherché n'y figure donc plus, la recherche est gardée côté serveur.
        private const string PreviousCustomIdPrefix = "previous:";
        private const string NextCustomIdPrefix = "next:";
        private const string SearchCacheKeyPrefix = "discord:translate:";

        // Une recherche reste consultable 30 min après son dernier affichage et 6 h au plus : la borne absolue
        // plafonne la mémoire occupée par une recherche parcourue sans fin. Au-delà, ses boutons signalent l'expiration.
        private static readonly TimeSpan SearchSlidingExpiration = TimeSpan.FromMinutes(30);
        private static readonly TimeSpan SearchAbsoluteExpiration = TimeSpan.FromHours(6);

        // Texte recherché tel qu'affiché dans le titre des pages (256 caractères au plus, drapeau et compteur
        // compris) et dans le message sans résultat.
        private const int MaxDisplayedSearchValueLength = 200;

        private readonly ILogger<TranslationModule> _logger;
        private readonly ITranslationService _translationService;
        private readonly IMemoryCache _cache;

        public TranslationModule(ILogger<TranslationModule> logger, ITranslationService translationService, IMemoryCache cache)
        {
            _logger = logger;
            _translationService = translationService;
            _cache = cache;
        }

        [ComponentInteraction(customId: PreviousCustomIdPrefix + "*")]
        public async Task OnPreviousAsync()
        {
            await ShowTranslationPageAsync(PreviousCustomIdPrefix);
        }

        [ComponentInteraction(customId: NextCustomIdPrefix + "*")]
        public async Task OnNextAsync()
        {
            await ShowTranslationPageAsync(NextCustomIdPrefix);
        }

        /// <summary>
        /// Affiche la page demandée par un bouton de pagination (custom id : cf. <see cref="CreateComponents"/>).
        /// La recherche est relue dans le cache : si elle a expiré, ou si le bouton date de l'ancien format (qui
        /// portait la langue et le texte recherché), l'auteur du clic reçoit un message éphémère, dans sa langue.
        /// Les boutons restent dans la langue de l'auteur de la recherche : le message est commun.
        /// </summary>
        private async Task ShowTranslationPageAsync(string customIdPrefix)
        {
            SocketMessageComponent interaction = (SocketMessageComponent)Context.Interaction;
            string[] arguments = interaction.Data.CustomId.Substring(customIdPrefix.Length).Split(':');
            if (arguments.Length != 2
                || !int.TryParse(arguments[0], NumberStyles.None, CultureInfo.InvariantCulture, out int page)
                || !_cache.TryGetValue(SearchCacheKeyPrefix + arguments[1], out TranslationSearch? search)
                || search is null)
            {
                await RespondAsync(Context.Interaction.Texts().TranslateSearchExpired, ephemeral: true);
                return;
            }

            // Les boutons ne visent que des pages existantes : la borne ne protège que d'un custom id forgé.
            int shownPage = Math.Min(page, search.Translations.Count - 1);
            Embed embed = BuildPageEmbed(search, shownPage);
            MessageComponent components = CreateComponents(arguments[1], shownPage, search.Translations.Count, BotTexts.For(search.AuthorLocale));
            // La recherche est en mémoire : le message est modifié en réponse directe, sans différer l'interaction.
            await interaction.UpdateAsync(props =>
            {
                props.Embed = embed;
                props.Components = components;
            });
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
            BotTexts texts = Context.Interaction.Texts();
            try
            {
                await DeferAsync(ephemeral: privateMsg);

                if (privateMsg)
                {
                    await ModifyOriginalResponseAsync(props => { props.Content = texts.TranslateSentByDirectMessage; });
                }

                TranslationSearch search = await SearchTranslationsAsync(locale, searchValue, onlyExactMatch, texts.Locale);

                if (search.Translations.Count == 0)
                {
                    await Context.Interaction.SendEphemeralAsync(
                        texts.TranslateNoResult(Truncate(searchValue, MaxDisplayedSearchValueLength)),
                        isDeferredEphemeral: privateMsg);
                    return;
                }

                Embed firstPage = BuildPageEmbed(search, 0);
                // Pas de boutons pour une page unique : seule une recherche à parcourir est gardée en cache.
                MessageComponent? components = search.Translations.Count > 1
                    ? CreateComponents(StoreSearch(search), 0, search.Translations.Count, texts)
                    : null;

                if (privateMsg)
                {
                    await Context.User.SendMessageAsync(embed: firstPage, components: components);
                }
                else if (components is null)
                {
                    await ModifyOriginalResponseAsync(props => { props.Embed = firstPage; });
                }
                else
                {
                    await ModifyOriginalResponseAsync(props =>
                    {
                        props.Embed = firstPage;
                        props.Components = components;
                    });
                }
            }
            catch (Exception e)
            {
                _logger.LogError(e.ToString(), e);
                await Context.Interaction.SendEphemeralAsync(texts.TranslateError(e.Message), isDeferredEphemeral: privateMsg);
            }
        }

        /// <summary>
        /// Recherche les traductions et applique l'option « résultats exacts uniquement » : les résultats inexacts ne
        /// sont écartés que si au moins un résultat exact existe.
        /// </summary>
        private async Task<TranslationSearch> SearchTranslationsAsync(Locales locale, string searchValue, bool onlyExactMatch, Locales authorLocale)
        {
            TranslationResultDto completeTranslation = await _translationService.GetTranslationAsync(locale.ToString().ToLowerInvariant(), searchValue);

            bool hasExactResponse = completeTranslation.Translations
                .Exists(translation => translation.Key.IsExactMatch);
            bool shouldAddInexactMatch = (hasExactResponse && !onlyExactMatch) || !hasExactResponse;

            List<KeyValuePair<TranslationKeyDto, TranslationDto>> translations = completeTranslation.Translations
                .FindAll(translation => translation.Key.IsExactMatch || shouldAddInexactMatch);

            string header = $"{GetFlag(locale)} {Truncate(searchValue, MaxDisplayedSearchValueLength)}";
            return new TranslationSearch(header, translations, authorLocale);
        }

        private static string GetFlag(Locales locale)
        {
            return locale switch
            {
                Locales.De => ":flag_de:",
                Locales.En => ":flag_gb:",
                Locales.Es => ":flag_es:",
                Locales.Fr => ":flag_fr:",
                _ => throw new ArgumentException("La langue doit avoir pour valeur \"de\", \"en\", \"es\" ou \"fr\"")
            };
        }

        /// <summary>
        /// Construit l'embed d'une page (une traduction par page), à la demande : une recherche large peut compter
        /// des centaines de résultats, dont seuls ceux consultés sont mis en forme.
        /// </summary>
        private static Embed BuildPageEmbed(TranslationSearch search, int page)
        {
            TranslationDto translation = search.Translations[page].Value;
            string description =
                $":flag_de: {FormatTranslation(translation.De[0])}\n" +
                $":flag_gb: {FormatTranslation(translation.En[0])}\n" +
                $":flag_es: {FormatTranslation(translation.Es[0])}\n" +
                $":flag_fr: {FormatTranslation(translation.Fr[0])}\n";

            return new EmbedBuilder()
                .WithTitle($"{search.Header} ({page + 1} / {search.Translations.Count})")
                // Les quatre versions d'un texte long du jeu peuvent dépasser les 4096 caractères d'une description.
                .WithDescription(Truncate(description, EmbedBuilder.MaxDescriptionLength))
                .WithColor(DiscordBotConsts.MhoColorPink)
                .Build();
        }

        private static string FormatTranslation(string translation)
        {
            return translation.Replace("<strong>", "**").Replace("</strong>", "**").Replace("{hr}", "\n");
        }

        /// <summary>
        /// Garde la recherche en cache le temps de la parcourir et renvoie l'identifiant court qui la désigne.
        /// </summary>
        private string StoreSearch(TranslationSearch search)
        {
            string searchId = Guid.NewGuid().ToString("N");
            _cache.Set(SearchCacheKeyPrefix + searchId, search, new MemoryCacheEntryOptions
            {
                SlidingExpiration = SearchSlidingExpiration,
                AbsoluteExpirationRelativeToNow = SearchAbsoluteExpiration
            });
            return searchId;
        }

        /// <summary>
        /// Boutons de pagination. Custom id : "{préfixe}{page visée}:{identifiant de la recherche}", soit une
        /// cinquantaine de caractères au plus quel que soit le texte recherché.
        /// </summary>
        private static MessageComponent CreateComponents(string searchId, int page, int pageCount, BotTexts texts)
        {
            ButtonBuilder previous = new ButtonBuilder()
                .WithCustomId($"{PreviousCustomIdPrefix}{Math.Max(0, page - 1)}:{searchId}")
                .WithLabel(texts.TranslatePrevious)
                .WithDisabled(page == 0)
                .WithStyle(ButtonStyle.Primary);

            ButtonBuilder next = new ButtonBuilder()
                .WithCustomId($"{NextCustomIdPrefix}{Math.Min(page + 1, pageCount - 1)}:{searchId}")
                .WithLabel(texts.TranslateNext)
                .WithDisabled(page >= pageCount - 1)
                .WithStyle(ButtonStyle.Primary);

            return new ComponentBuilder()
                .WithButton(previous)
                .WithButton(next)
                .Build();
        }

        private static string Truncate(string value, int maxLength)
        {
            return value.Length <= maxLength ? value : string.Concat(value.AsSpan(0, maxLength - 1), "…");
        }

        /// <summary>
        /// Recherche gardée en cache le temps de parcourir ses pages : en-tête commun (drapeau et texte recherché),
        /// résultats retenus et langue de l'auteur (libellés des boutons).
        /// </summary>
        private sealed record TranslationSearch(string Header, List<KeyValuePair<TranslationKeyDto, TranslationDto>> Translations, Locales AuthorLocale);
    }
}
