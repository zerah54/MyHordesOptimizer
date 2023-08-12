using Discord.Interactions;
using System.Threading.Tasks;

namespace MyHordesOptimizerApi.DiscordBot.Modules;

public class DocumentationModule : InteractionModuleBase<SocketInteractionContext>
{
    
    [SlashCommand(name: "website", description: "Renvoie le lien vers le site web")]
    public async Task WebsiteAsync(bool privateMsg = false)
    {
        await RespondAsync("https://myhordes-optimizer.web.app", ephemeral: privateMsg);
    }    
    
    [SlashCommand(name: "script", "Renvoie le lien vers le script")]
    public async Task ScriptAsync(bool privateMsg = false)
    {
        await RespondAsync("https://github.com/zerah54/MyHordesOptimizer/raw/main/Scripts/Tampermonkey/my_hordes_optimizer.user.js", ephemeral: privateMsg);
    }
}