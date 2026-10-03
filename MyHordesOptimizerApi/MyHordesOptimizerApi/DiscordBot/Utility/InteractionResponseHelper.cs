using System.Threading.Tasks;
using Discord;

namespace MyHordesOptimizerApi.DiscordBot.Utility
{
    public static class InteractionResponseHelper
    {
        /// <summary>
        /// Envoie un message visible du seul auteur de la commande, quel que soit l'état de l'interaction.
        /// </summary>
        /// <param name="interaction">L'interaction en cours</param>
        /// <param name="message">Le message à afficher</param>
        /// <param name="isDeferredEphemeral">Vrai si l'interaction a été différée en éphémère</param>
        public static async Task SendEphemeralAsync(this IDiscordInteraction interaction, string message, bool isDeferredEphemeral)
        {
            if (!interaction.HasResponded)
            {
                await interaction.RespondAsync(message, ephemeral: true);
            }
            else if (isDeferredEphemeral)
            {
                // La réponse différée est déjà éphémère : on la remplace.
                await interaction.ModifyOriginalResponseAsync(props => { props.Content = message; });
            }
            else
            {
                // Juste après une réponse différée publique, Discord transforme le premier suivi en modification
                // de cette réponse, qui reste publique. On la supprime donc avant d'envoyer le suivi éphémère.
                await interaction.DeleteOriginalResponseAsync();
                await interaction.FollowupAsync(message, ephemeral: true);
            }
        }
    }
}
