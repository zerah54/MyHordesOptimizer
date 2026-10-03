using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Discord;
using Discord.Interactions;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.DiscordBot.Localization;
using MyHordesOptimizerApi.DiscordBot.Utility;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Estimations;
using MyHordesOptimizerApi.Services.Interfaces.Estimations;

namespace MyHordesOptimizerApi.DiscordBot.Modules
{
    [IntegrationType(ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall)]
    [CommandContextType(InteractionContextType.Guild, InteractionContextType.BotDm, InteractionContextType.PrivateChannel)]
    [Group(name: "attack", description: "Tools related to attack estimation")]
    public class AttackModule : InteractionModuleBase<SocketInteractionContext>
    {
        private readonly ILogger<AttackModule> _logger;
        private readonly IServiceScopeFactory _serviceScopeFactory;

        public AttackModule(ILogger<AttackModule> logger, IServiceScopeFactory serviceScopeFactory)
        {
            _logger = logger;
            _serviceScopeFactory = serviceScopeFactory;
        }

        [SlashCommand(name: "get", description: "Retrieves the calculated estimate and saved list of estimates for the chosen day and town")]
        public async Task GetAttackAsync(
            [Summary(name: "town-id", description: "The identifier of the town for which you want the estimate")]
            int townId,
            [Summary(name: "day", description: "The day you want the estimate for")]
            int day,
            [Summary(name: "private-msg", description: "True if the message should not be seen by all")]
            bool privateMsg = false)
        {
            BotTexts texts = Context.Interaction.Texts();
            try
            {
                await DeferAsync(ephemeral: privateMsg);

                using var scope = _serviceScopeFactory.CreateScope();
                var estimationService = scope.ServiceProvider.GetRequiredService<IMyHordesOptimizerEstimationService>();

                var resultForDay = estimationService.CalculateAttack(townId: townId, dayAttack: day);

                var embedBuilder = new EmbedBuilder()
                    .WithTitle(texts.AttackEstimationsTitle(day))
                    .WithDescription(texts.AttackCalculated(day, resultForDay.Result.Min, resultForDay.Result.Max))
                    .WithColor(DiscordBotConsts.MhoColorPink);

                AddEstimationField(embedBuilder, estimationService, texts.AttackPlannerField(day - 1), estimationService.GetEstimations(townId: townId, day: day - 1).Planif);
                AddEstimationField(embedBuilder, estimationService, texts.AttackEstimationField(day), estimationService.GetEstimations(townId: townId, day: day).Estim);

                if (privateMsg)
                {
                    await Context.User.SendMessageAsync(embed: embedBuilder.Build());
                    await ModifyOriginalResponseAsync(props => { props.Content = texts.AttackSentByDirectMessage; });
                }
                else
                {
                    await ModifyOriginalResponseAsync(props => { props.Embed = embedBuilder.Build(); });
                }
            }
            catch (Exception e)
            {
                _logger.LogError(e.ToString(), e);
                await Context.Interaction.SendEphemeralAsync(texts.AttackError(e.Message), isDeferredEphemeral: privateMsg);
            }
        }

        /// <summary>
        /// Ajoute un champ listant les paliers renseignés (pourcentage : min - max) ; aucun champ si aucun ne l'est.
        /// </summary>
        private static void AddEstimationField(EmbedBuilder embedBuilder, IMyHordesOptimizerEstimationService estimationService, string name, EstimationsDto estimations)
        {
            IEnumerable<string> lines = typeof(EstimationsDto).GetProperties()
                .Select(property => estimationService.CreateTupleFromValue(property.Name, property.GetValue(estimations) as EstimationValueDto))
                .Where(tuple => tuple.Min.HasValue && tuple.Max.HasValue)
                .Select(tuple => $"{tuple.Percent}% : {tuple.Min} - {tuple.Max}");

            string values = string.Join("\n", lines);
            if (values.Length > 0)
            {
                embedBuilder.AddField(name, values, inline: true);
            }
        }
    }
}
