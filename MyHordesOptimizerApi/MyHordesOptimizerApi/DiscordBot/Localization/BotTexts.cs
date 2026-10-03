using System;
using System.Collections.Generic;
using Discord;
using MyHordesOptimizerApi.DiscordBot.Enums;

namespace MyHordesOptimizerApi.DiscordBot.Localization
{
    /// <summary>
    /// Textes des réponses du bot, une instance par langue (<see cref="Fr"/>, <see cref="En"/>, <see cref="De"/>,
    /// <see cref="Es"/>, dans les fichiers <c>BotTexts.*.cs</c>). Tous les membres sont requis : une traduction
    /// manquante ne compile pas. Les textes à paramètres sont des fonctions typées.
    /// La langue est celle du client Discord de l'auteur de la commande ; une langue non gérée prend l'anglais,
    /// comme les noms et descriptions des commandes (écrits en anglais, traduits par <c>Assets/messages.*.json</c>).
    /// </summary>
    public sealed partial class BotTexts
    {
        public required Locales Locale { get; init; }

        // ------------------------------------------------------------------ commun

        /// <summary>Erreur inattendue, avec le message technique.</summary>
        public required Func<string, string> GenericError { get; init; }

        /// <summary>Commande refusée par Discord.Net, avec son motif.</summary>
        public required Func<string, string> CommandFailed { get; init; }

        // ------------------------------------------------------------------ /aa, /timer

        /// <summary>Message envoyé à la fin du compteur /aa.</summary>
        public required string AntiAbuseResetMessage { get; init; }

        /// <summary>Confirmation de /aa ; paramètre : où arrivera la notification (<see cref="TimerTargetHere"/>…).</summary>
        public required Func<string, string> AntiAbuseStarted { get; init; }

        /// <summary>Confirmation de /timer ; paramètre : où arrivera la notification.</summary>
        public required Func<string, string> TimerScheduled { get; init; }

        public required string TimerNotCreated { get; init; }
        public required Func<string, string> TimerCreationError { get; init; }
        public required string TimerReasonEmpty { get; init; }

        /// <summary>Paramètre : longueur maximale.</summary>
        public required Func<int, string> TimerReasonTooLong { get; init; }

        /// <summary>Paramètres : compteurs en cours, maximum.</summary>
        public required Func<int, int, string> TimerTooMany { get; init; }

        public required string TimerReasonField { get; init; }
        public required string TimerExpirationField { get; init; }
        public required string TimerDurationFormatHelp { get; init; }
        public required string TimerDurationUnreadable { get; init; }

        /// <summary>Paramètre : l'unité répétée, telle que saisie.</summary>
        public required Func<string, string> TimerDurationRepeatedUnit { get; init; }

        public required string TimerDurationTooLong { get; init; }
        public required string TimerDurationNotPositive { get; init; }

        /// <summary>Note ajoutée à une notification en retard ; paramètre : échéance prévue (secondes Unix).</summary>
        public required Func<long, string> TimerSentLate { get; init; }

        public required string TimerTargetHere { get; init; }
        public required string TimerTargetHerePrivate { get; init; }
        public required string TimerTargetDirectMessage { get; init; }
        public required string TimerTargetDirectMessageFallback { get; init; }

        // ------------------------------------------------------------------ /attack get

        /// <summary>Paramètre : jour de l'attaque.</summary>
        public required Func<int, string> AttackEstimationsTitle { get; init; }

        /// <summary>Paramètres : jour, minimum, maximum.</summary>
        public required Func<int, int, int, string> AttackCalculated { get; init; }

        /// <summary>Paramètre : jour du planificateur (la veille de l'attaque).</summary>
        public required Func<int, string> AttackPlannerField { get; init; }

        /// <summary>Paramètre : jour de l'estimation.</summary>
        public required Func<int, string> AttackEstimationField { get; init; }

        public required string AttackSentByDirectMessage { get; init; }
        public required Func<string, string> AttackError { get; init; }

        // ------------------------------------------------------------------ /instructions

        public required string InstructionsDraftNotFound { get; init; }
        public required string InstructionsMaxSections { get; init; }
        public required string InstructionsAddTitle { get; init; }
        public required string InstructionsUpdateTitle { get; init; }
        public required string InstructionsAddDescription { get; init; }
        public required string InstructionsUpdateDescription { get; init; }
        public required string InstructionsAddSection { get; init; }
        public required string InstructionsAddSectionLimitReached { get; init; }
        public required string InstructionsPublish { get; init; }
        public required Func<string, string> InstructionsPublishError { get; init; }
        public required string InstructionsTitleEmpty { get; init; }
        public required string InstructionsDescriptionEmpty { get; init; }
        public required string InstructionsSectionEmpty { get; init; }

        /// <summary>Paramètres : longueur obtenue, limite Discord.</summary>
        public required Func<int, int, string> InstructionsTooLong { get; init; }

        /// <summary>
        /// Paramètres : élément refusé (<see cref="InstructionsElementTitle"/>…), limite Discord.
        /// </summary>
        public required Func<string, int, string> InstructionsFull { get; init; }

        public required string InstructionsElementTitle { get; init; }
        public required string InstructionsElementDescription { get; init; }
        public required string InstructionsElementSection { get; init; }
        public required string InstructionsTitleLabel { get; init; }
        public required string InstructionsDescriptionLabel { get; init; }
        public required string InstructionsSectionTitleLabel { get; init; }
        public required string InstructionsSectionContentLabel { get; init; }

        // ------------------------------------------------------------------ /suggestion, /bug

        public required string FeedbackSuggestionModalTitle { get; init; }
        public required string FeedbackSuggestionTitleLabel { get; init; }
        public required string FeedbackSuggestionDetailsLabel { get; init; }
        public required string FeedbackSuggestionPosted { get; init; }
        public required string FeedbackBugModalTitle { get; init; }
        public required string FeedbackBugTitleLabel { get; init; }
        public required string FeedbackBugDetailsLabel { get; init; }
        public required string FeedbackBugPosted { get; init; }

        // ------------------------------------------------------------------ /faq

        public required string FaqGoToWebsite { get; init; }
        public required string FaqGoToTutorial { get; init; }
        public required string FaqChromeExtension { get; init; }
        public required string FaqFirefoxExtension { get; init; }
        public required string FaqInstallScript { get; init; }
        public required string FaqGhoulTitle { get; init; }
        public required string FaqMseTitle { get; init; }

        /// <summary>Ligne « libellé : pourcentage » des FAQ chiffrées ; paramètres : libellé, pourcentage.</summary>
        public required Func<string, int, string> FaqValueLine { get; init; }

        /// <summary>Noms des objets, tels que dans le jeu.</summary>
        public required string ItemMeatyBone { get; init; }
        public required string ItemFleshroomPuree { get; init; }
        public required string ItemHumanFlesh { get; init; }
        public required string ItemTravellersCorpse { get; init; }

        /// <summary>Paramètre : points d'action gagnés.</summary>
        public required Func<int, string> FaqMseGivesAp { get; init; }

        /// <summary>Paramètre : points d'action gagnés.</summary>
        public required Func<int, string> FaqMseGivesApAndAddiction { get; init; }

        public required string FaqMseTerrorises { get; init; }
        public required string FaqMseNoEffect { get; init; }
        public required string FaqCampingTitle { get; init; }

        /// <summary>
        /// Mots d'exemple de l'aide-mémoire Discord : ils sont affichés tels quels et entourés de syntaxe
        /// Markdown, ils ne doivent donc contenir aucun caractère de mise en forme (<c>* _ ~ | ` &gt; # [ ]</c>).
        /// </summary>
        public required string CheatBold { get; init; }
        public required string CheatItalic { get; init; }
        public required string CheatUnderline { get; init; }
        public required string CheatStrikethrough { get; init; }
        public required string CheatSpoiler { get; init; }
        public required string CheatCode { get; init; }
        public required string CheatQuote { get; init; }
        public required string CheatMultilineCode { get; init; }
        public required string CheatMultilineQuote { get; init; }
        public required string CheatMaskedLink { get; init; }
        public required string CheatBigTitle { get; init; }
        public required string CheatMediumTitle { get; init; }
        public required string CheatSmallTitle { get; init; }
        public required string CheatSmallText { get; init; }
        public required string CheatBulletList { get; init; }
        public required string CheatOrderedList { get; init; }

        /// <summary>Paramètre : niveau d'imbrication d'une liste.</summary>
        public required Func<int, string> CheatLevel { get; init; }

        public required string CheatSpacesHint { get; init; }

        // ------------------------------------------------------------------ /glossary

        /// <summary>Paramètre : texte recherché.</summary>
        public required Func<string, string> GlossaryNoMatch { get; init; }

        // ------------------------------------------------------------------ /recipe

        public required Func<string, string> RecipeError { get; init; }
        public required string RecipeNoResult { get; init; }

        /// <summary>Paramètre : nombre de recettes non affichées (au moins 1).</summary>
        public required Func<int, string> RecipeTruncated { get; init; }

        public required string RecipeComponents { get; init; }
        public required string RecipeResults { get; init; }

        // ------------------------------------------------------------------ /translate

        public required string TranslateSearchExpired { get; init; }
        public required string TranslateSentByDirectMessage { get; init; }

        /// <summary>Paramètre : texte recherché.</summary>
        public required Func<string, string> TranslateNoResult { get; init; }

        public required Func<string, string> TranslateError { get; init; }
        public required string TranslatePrevious { get; init; }
        public required string TranslateNext { get; init; }

        // ------------------------------------------------------------------ /play

        public required string PlayRock { get; init; }
        public required string PlayPaper { get; init; }
        public required string PlayScissors { get; init; }
        public required string PlayHeads { get; init; }
        public required string PlayTails { get; init; }

        /// <summary>Les 13 valeurs d'une couleur, de l'as au deux.</summary>
        public required IReadOnlyList<string> PlayCardRanks { get; init; }

        /// <summary>Les 4 couleurs : cœur, trèfle, carreau, pique.</summary>
        public required IReadOnlyList<string> PlayCardSuits { get; init; }

        /// <summary>Paramètres : valeur, couleur.</summary>
        public required Func<string, string, string> PlayCard { get; init; }

        // ------------------------------------------------------------------ choix de la langue

        /// <summary>Textes d'une langue gérée.</summary>
        public static BotTexts For(Locales locale)
        {
            return locale switch
            {
                Locales.Fr => Fr,
                Locales.De => De,
                Locales.Es => Es,
                _ => En
            };
        }

        /// <summary>Textes de la langue gérée la plus proche d'une locale Discord (« fr », « en-US », « es-419 »…).</summary>
        public static BotTexts For(string? discordLocale)
        {
            return For(ParseLocale(discordLocale));
        }

        /// <summary>Langue gérée d'une locale Discord ou d'un code enregistré (« fr ») ; anglais à défaut.</summary>
        public static Locales ParseLocale(string? discordLocale)
        {
            string language = discordLocale?.Split('-')[0].Trim().ToLowerInvariant() ?? string.Empty;
            return language switch
            {
                "fr" => Locales.Fr,
                "de" => Locales.De,
                "es" => Locales.Es,
                _ => Locales.En
            };
        }

        /// <summary>Code court d'une langue (« fr »), relu par <see cref="ParseLocale"/>.</summary>
        public static string ToCode(Locales locale)
        {
            return locale.ToString().ToLowerInvariant();
        }
    }

    public static class BotTextsExtensions
    {
        /// <summary>Textes dans la langue du client Discord de l'auteur de l'interaction.</summary>
        public static BotTexts Texts(this IDiscordInteraction interaction)
        {
            return BotTexts.For(interaction.UserLocale);
        }
    }
}
