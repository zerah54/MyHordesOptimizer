using System;
using Discord.Interactions;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;

namespace MyHordesOptimizerApi.DiscordBot.Modules
{
    public class RecipesModule : InteractionModuleBase<SocketInteractionContext>
    {
        private readonly ILogger<RecipesModule> _logger;

        public RecipesModule(ILogger<RecipesModule> logger)
        {
            _logger = logger;
        }

        [SlashCommand(name: "recipe", description: "Trouve la recette d'un objet")]
        public async Task RecipeAsync(string item, bool privateMsg = false)
        {
            try
            {
                await RespondAsync("", ephemeral: privateMsg);
            }
            catch (Exception e)
            {
                _logger.LogWarning(e.ToString(), e);
                await RespondAsync($"Une erreur s'est produite lors de la récupération de l'objet\n```{e.Message}```",
                    ephemeral: true);
            }
        }
    }
}