using System;
using System.Threading.Tasks;
using Discord;
using Discord.Interactions;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.DiscordBot.Utility;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Estimations;
using MyHordesOptimizerApi.Services.Interfaces.Estimations;

namespace MyHordesOptimizerApi.DiscordBot.Modules
{
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
            try
            {
                await DeferAsync(ephemeral: privateMsg);

                using var scope = _serviceScopeFactory.CreateScope();
                var estimationService = scope.ServiceProvider.GetRequiredService<IMyHordesOptimizerEstimationService>();

                var resultForDay = estimationService.ApofooCalculateAttack(townId: townId, dayAttack: day);
                var resultForDayBeta = estimationService.ApofooCalculateAttack(townId: townId, dayAttack: day, beta: true);

                var resultForDayDisplay = $"*Attaque J{day} calculée (par Apofoo)* : {resultForDay.Result.Min} - {resultForDay.Result.Max}";
                var resultForDayBetaDisplay = $"*Attaque J{day} calculée (par Apofoo) (Beta)* : {resultForDayBeta.Result.Min} - {resultForDayBeta.Result.Max}";

                var embedBuilder = new EmbedBuilder()
                    .WithTitle($"Estimations pour le jour {day}")
                    .WithDescription($"{resultForDayDisplay}\n{resultForDayBetaDisplay}")
                    .WithColor(DiscordBotConsts.MhoColorPink);

                var estimationsForDayPlanif = estimationService.GetEstimations(townId: townId, day: day - 1);
                var estimationsForDayPlanifValues = estimationsForDayPlanif.Planif.GetType().GetProperties();
                if (estimationsForDayPlanifValues.Length > 0)
                {
                    var values = "";
                    foreach (var tuple in estimationsForDayPlanifValues)
                    {
                        var estimationTuple = estimationService.CreateTupleFromValue(tuple.Name, tuple.GetValue(estimationsForDayPlanif.Planif) as EstimationValueDto);
                        values += estimationTuple.Percent + "% : " + estimationTuple.Min + " - " + estimationTuple.Max + "\n";
                    }
                    var estimationsForDayPlanifField = new EmbedFieldBuilder()
                        .WithName($"Planificateur J{day - 1}")
                        .WithValue(values)
                        .WithIsInline(true);
                    embedBuilder.WithFields(estimationsForDayPlanifField);
                }

                var estimationsForDayEstim = estimationService.GetEstimations(townId: townId, day: day);
                var estimationsForDayEstimValues = estimationsForDayEstim.Estim.GetType().GetProperties();
                if (estimationsForDayEstimValues.Length > 0)
                {
                    var values = "";
                    foreach (var tuple in estimationsForDayEstimValues)
                    {
                        var estimationTuple = estimationService.CreateTupleFromValue(tuple.Name, tuple.GetValue(estimationsForDayEstim.Estim) as EstimationValueDto);
                        values += estimationTuple.Percent + "% : " + estimationTuple.Min + " - " + estimationTuple.Max + "\n";
                    }
                    var estimationsForDayEstimField = new EmbedFieldBuilder()
                        .WithName($"Estimation J{day}")
                        .WithValue(values)
                        .WithIsInline(true);
                    embedBuilder.WithFields(estimationsForDayEstimField);
                }

                if (privateMsg)
                {
                    await Context.User.SendMessageAsync(embed: embedBuilder.Build());
                }
                else
                {
                    await ModifyOriginalResponseAsync(props => { props.Embed = embedBuilder.Build(); });
                }
            }
            catch (Exception e)
            {
                _logger.LogError(e.ToString(), e);
                await RespondAsync($"Une erreur s'est produite lors de la récupération des estimations\n```{e.Message}```", ephemeral: true);
            }
        }
    }
}
