using System;
using System.Threading.Tasks;
using Discord;
using Discord.Interactions;
using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.DiscordBot.Localization;
using MyHordesOptimizerApi.DiscordBot.Services;
using MyHordesOptimizerApi.DiscordBot.Utility;

namespace MyHordesOptimizerApi.DiscordBot.Modules
{

    [IntegrationType(ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall)]
    [CommandContextType(InteractionContextType.Guild, InteractionContextType.BotDm, InteractionContextType.PrivateChannel)]
    public class AlertsModule : InteractionModuleBase<SocketInteractionContext>
    {
        private static readonly TimeSpan AntiAbuseDuration = TimeSpan.FromMinutes(15);

        private readonly ILogger<AlertsModule> _logger;
        private readonly IDiscordTimerScheduler _timerScheduler;

        public AlertsModule(ILogger<AlertsModule> logger, IDiscordTimerScheduler timerScheduler)
        {
            _logger = logger;
            _timerScheduler = timerScheduler;
        }

        [SlashCommand(name: "aa", description: "Starts a 15 minutes counter")]
        public async Task AntiAbuseAsync(
            [Summary(name:"private-msg", description: "True if the message should not be seen by all")]
            bool privateMsg = false
            )
        {
            BotTexts texts = Context.Interaction.Texts();
            await DeferAsync(ephemeral: true);
            try
            {
                DateTime dueAt = DateTime.UtcNow + AntiAbuseDuration;
                DiscordTimerScheduleResult result = await _timerScheduler.ScheduleAsync(Context.Interaction, dueAt, texts.AntiAbuseResetMessage, privateMsg);
                if (!result.IsScheduled)
                {
                    await Context.Interaction.SendEphemeralAsync(result.Error ?? texts.TimerNotCreated, isDeferredEphemeral: true);
                    return;
                }

                string description = texts.AntiAbuseStarted(DiscordTimerRules.DescribeTarget(result.Target, privateMsg, texts));
                await ModifyOriginalResponseAsync(props => props.Embed = BuildConfirmation(texts, description, dueAt, reason: null));
            }
            catch (Exception e)
            {
                _logger.LogWarning(e, "Création du compteur anti-abus impossible");
                await Context.Interaction.SendEphemeralAsync(texts.TimerCreationError(e.Message), isDeferredEphemeral: true);
            }
        }

        [SlashCommand(name: "timer", description: "Launches a custom counter. Example: 1Y 2M 7D 1h 25m 12s")]
        public async Task CounterAsync(
            [Summary(name:"time", description: "The duration of the counter (Example: 1Y 2M 7D 1h 25m 12s)")]
            string time,
            [Summary(name:"reason", description: "The reason for the counter. It is this message that will be sent at the end of the counter")]
            [MaxLength(DiscordTimerRules.MaxMessageLength)]
            string reason,
            [Summary(name:"private-msg", description: "True if the message should not be seen by all")]
            bool privateMsg = false
            )
        {
            BotTexts texts = Context.Interaction.Texts();
            await DeferAsync(ephemeral: true);
            try
            {
                if (!DiscordTimerRules.TryComputeDueAt(time, DateTime.UtcNow, texts, out DateTime dueAt, out string error))
                {
                    await Context.Interaction.SendEphemeralAsync(error, isDeferredEphemeral: true);
                    return;
                }
                if (string.IsNullOrWhiteSpace(reason))
                {
                    await Context.Interaction.SendEphemeralAsync(texts.TimerReasonEmpty, isDeferredEphemeral: true);
                    return;
                }
                if (reason.Length > DiscordTimerRules.MaxMessageLength)
                {
                    await Context.Interaction.SendEphemeralAsync(texts.TimerReasonTooLong(DiscordTimerRules.MaxMessageLength), isDeferredEphemeral: true);
                    return;
                }

                DiscordTimerScheduleResult result = await _timerScheduler.ScheduleAsync(Context.Interaction, dueAt, reason, privateMsg);
                if (!result.IsScheduled)
                {
                    await Context.Interaction.SendEphemeralAsync(result.Error ?? texts.TimerNotCreated, isDeferredEphemeral: true);
                    return;
                }

                string description = texts.TimerScheduled(DiscordTimerRules.DescribeTarget(result.Target, privateMsg, texts));
                await ModifyOriginalResponseAsync(props => props.Embed = BuildConfirmation(texts, description, dueAt, reason));
            }
            catch (Exception e)
            {
                _logger.LogWarning(e, "Création du compteur impossible");
                await Context.Interaction.SendEphemeralAsync(texts.TimerCreationError(e.Message), isDeferredEphemeral: true);
            }
        }

        private static Embed BuildConfirmation(BotTexts texts, string description, DateTime dueAtUtc, string? reason)
        {
            EmbedBuilder embedBuilder = new EmbedBuilder()
                .WithDescription(description)
                .WithColor(DiscordBotConsts.MhoColorPink);

            if (reason is not null)
            {
                embedBuilder.AddField(texts.TimerReasonField, reason);
            }
            embedBuilder.AddField(texts.TimerExpirationField, $"<t:{DiscordTimerRules.ToUnixSeconds(dueAtUtc)}:R>");

            return embedBuilder.Build();
        }

        // [SlashCommand("alarm", "Programme une alerte pour une heure donnée")]
        // public async Task Alarm(int day, int month, int year, int hour, int minute, int second)
        // {
        //     double sqrt = Modules.AlertsModule.Sqrt(number);
        //     await RespondAsync($"The square root of `{number}` is `{sqrt}`.", ephemeral: true);
        // }
    }
}
