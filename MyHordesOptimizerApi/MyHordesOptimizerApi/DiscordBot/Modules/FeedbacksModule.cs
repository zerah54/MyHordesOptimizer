using System;
using System.Threading.Tasks;
using Discord;
using Discord.Interactions;
using Discord.WebSocket;
using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.Configuration.Interfaces;

namespace MyHordesOptimizerApi.DiscordBot.Modules
{
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
            try
            {
                await RespondWithModalAsync<SuggestionModal>("suggestion_modal");;
            }
            catch (Exception e)
            {
                _logger.LogError(e.ToString(), e);
                await RespondAsync($"Une erreur s'est produite\n```{e.Message}```", ephemeral: true);
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
            await originalResponse.Result.ModifyAsync(properties => properties.Content = "La suggestion a bien été postée");
        }
        
        [SlashCommand(name: "bug", description: "Report a bug")]
        public async Task PostBugAsync()
        {
            try
            {
                await RespondWithModalAsync<BugModal>("bug_modal");;
            }
            catch (Exception e)
            {
                _logger.LogError(e.ToString(), e);
                await RespondAsync($"Une erreur s'est produite\n```{e.Message}```", ephemeral: true);
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
            await originalResponse.Result.ModifyAsync(p => p.Content  = "Le bug a bien été signalé");
        }
    }
    
    public class SuggestionModal : IModal
    {
        public string Title => "Envoyer une suggestion";

        [ModalTextInput(placeholder: "Titre de la suggestion",  customId: "Titre de la suggestion", style: TextInputStyle.Short, maxLength: 100)]
        public string SuggestionTitle { get; set; }

        [ModalTextInput(placeholder: "Détails de la suggestion", customId: "Détails de la suggestion", style: TextInputStyle.Paragraph, maxLength: 1750)]
        public string SuggestionDetails { get; set; }
    }
    
    public class BugModal : IModal
    {
        public string Title => "Signaler un bug";

        [ModalTextInput(placeholder: "Titre du bug",  customId: "Titre du bug", style: TextInputStyle.Short, maxLength: 100)]
        public string BugTitle { get; set; }

        [ModalTextInput(placeholder: "Détails du bug", customId: "Détails de bug", style: TextInputStyle.Paragraph, maxLength: 1750)]
        public string BugDetails { get; set; }
    }
}