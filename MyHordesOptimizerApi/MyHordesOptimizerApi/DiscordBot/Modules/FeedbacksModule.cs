using System;
using System.Threading.Tasks;
using Discord;
using Discord.Interactions;
using Discord.WebSocket;
using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.Configuration.Interfaces;
using MyHordesOptimizerApi.DiscordBot.Localization;

namespace MyHordesOptimizerApi.DiscordBot.Modules
{
    [IntegrationType(ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall)]
    [CommandContextType(InteractionContextType.Guild, InteractionContextType.BotDm, InteractionContextType.PrivateChannel)]
    public class FeedbacksModule : InteractionModuleBase<SocketInteractionContext>
    {
        private readonly DiscordSocketClient _discordSocketClient;
        private readonly IDiscordBotConfiguration _configuration;
        private readonly ILogger<FeedbacksModule> _logger;

        public FeedbacksModule(
            DiscordSocketClient discord, 
            IDiscordBotConfiguration configuration, 
            ILogger<FeedbacksModule> logger
            )
        {
            _discordSocketClient = discord;
            _configuration = configuration;
            _logger = logger;
        }

        [SlashCommand(name: "suggestion", description: "Post a suggestion in our ideas box")]
        public async Task PostSuggestionAsync()
        {
            BotTexts texts = Context.Interaction.Texts();
            try
            {
                await RespondWithModalAsync(BuildModal("suggestion_modal", texts.FeedbackSuggestionModalTitle,
                    SuggestionModal.TitleInputId, texts.FeedbackSuggestionTitleLabel,
                    SuggestionModal.DetailsInputId, texts.FeedbackSuggestionDetailsLabel));
            }
            catch (Exception e)
            {
                _logger.LogError(e.ToString(), e);
                await RespondAsync(texts.GenericError(e.Message), ephemeral: true);
            }
        }
        
        [ModalInteraction(customId: "suggestion_modal")]
        public async Task OnSuggestionModalValidationAsync(SuggestionModal suggestionModal)
        {
            await DeferAsync(ephemeral: true);
            var msg = $"{suggestionModal.SuggestionDetails}\n\n-- {Context.User.Mention}";
            await _discordSocketClient.GetGuild(_configuration.SupportGuildId)
                .GetForumChannel(_configuration.SuggestionsChannelId)
                .CreatePostAsync(title: suggestionModal.SuggestionTitle, text: msg);
            var originalResponse = Context.Interaction.GetOriginalResponseAsync();
            await originalResponse.Result.ModifyAsync(properties => properties.Content = Context.Interaction.Texts().FeedbackSuggestionPosted);
        }
        
        [SlashCommand(name: "bug", description: "Report a bug")]
        public async Task PostBugAsync()
        {
            BotTexts texts = Context.Interaction.Texts();
            try
            {
                await RespondWithModalAsync(BuildModal("bug_modal", texts.FeedbackBugModalTitle,
                    BugModal.TitleInputId, texts.FeedbackBugTitleLabel,
                    BugModal.DetailsInputId, texts.FeedbackBugDetailsLabel));
            }
            catch (Exception e)
            {
                _logger.LogError(e.ToString(), e);
                await RespondAsync(texts.GenericError(e.Message), ephemeral: true);
            }
        }
        
        [ModalInteraction(customId: "bug_modal")]
        public async Task OnBugModalValidationAsync(BugModal bugModal)
        {
            await DeferAsync(ephemeral: true);
            var msg = $"{bugModal.BugDetails}\n\n-- {Context.User.Mention}";
            await _discordSocketClient.GetGuild(_configuration.SupportGuildId)
                .GetForumChannel(_configuration.BugsChannelId)
                .CreatePostAsync(title: bugModal.BugTitle, text: msg);
            var originalResponse = Context.Interaction.GetOriginalResponseAsync();
            await originalResponse.Result.ModifyAsync(p => p.Content  = Context.Interaction.Texts().FeedbackBugPosted);
        }

        /// <summary>
        /// Formulaire titre + détails dans la langue de l'auteur. Les identifiants des champs sont ceux que lisent
        /// <see cref="SuggestionModal"/> et <see cref="BugModal"/> à la soumission.
        /// </summary>
        private static Modal BuildModal(string customId, string title, string titleInputId, string titleLabel, string detailsInputId, string detailsLabel)
        {
            return new ModalBuilder()
                .WithTitle(title)
                .WithCustomId(customId)
                .AddTextInput(titleLabel, titleInputId, TextInputStyle.Short, placeholder: titleLabel,
                    maxLength: FeedbackModalLimits.TitleMaxLength, required: true)
                .AddTextInput(detailsLabel, detailsInputId, TextInputStyle.Paragraph, placeholder: detailsLabel,
                    maxLength: FeedbackModalLimits.DetailsMaxLength, required: true)
                .Build();
        }
    }

    public static class FeedbackModalLimits
    {
        public const int TitleMaxLength = 100;
        public const int DetailsMaxLength = 1750;
    }

    // Les classes IModal ci-dessous lisent les formulaires soumis (par identifiant de champ). Les formulaires
    // affichés sont construits par FeedbacksModule.BuildModal, dans la langue de l'auteur.

    public class SuggestionModal : IModal
    {
        public const string TitleInputId = "Titre de la suggestion";
        public const string DetailsInputId = "Détails de la suggestion";

        public string Title => "Envoyer une suggestion";

        [InputLabel("Titre de la suggestion")]
        [ModalTextInput(placeholder: "Titre de la suggestion",  customId: TitleInputId, style: TextInputStyle.Short, maxLength: FeedbackModalLimits.TitleMaxLength)]
        public string SuggestionTitle { get; set; }

        [InputLabel("Détails de la suggestion")]
        [ModalTextInput(placeholder: "Détails de la suggestion", customId: DetailsInputId, style: TextInputStyle.Paragraph, maxLength: FeedbackModalLimits.DetailsMaxLength)]
        public string SuggestionDetails { get; set; }
    }

    public class BugModal : IModal
    {
        public const string TitleInputId = "Titre du bug";
        public const string DetailsInputId = "Détails de bug";

        public string Title => "Signaler un bug";

        [InputLabel("Titre du bug")]
        [ModalTextInput(placeholder: "Titre du bug",  customId: TitleInputId, style: TextInputStyle.Short, maxLength: FeedbackModalLimits.TitleMaxLength)]
        public string BugTitle { get; set; }

        [InputLabel("Détails du bug")]
        [ModalTextInput(placeholder: "Détails du bug", customId: DetailsInputId, style: TextInputStyle.Paragraph, maxLength: FeedbackModalLimits.DetailsMaxLength)]
        public string BugDetails { get; set; }
    }
}