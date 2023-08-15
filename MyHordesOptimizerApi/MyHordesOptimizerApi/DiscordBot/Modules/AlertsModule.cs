using System;
using System.Threading.Tasks;
using Discord;
using Discord.Interactions;
using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.DiscordBot.Utility;

namespace MyHordesOptimizerApi.DiscordBot.Modules
{
    public class AlertsModule : InteractionModuleBase<SocketInteractionContext>
    {
        private readonly ILogger<AlertsModule> _logger;

        public AlertsModule(ILogger<AlertsModule> logger)
        {
            _logger = logger;
        }

        [SlashCommand(name: "aa", description: "Starts a 15 minutes counter")]
        public async Task AntiAbuseAsync(
            [Summary(name:"private-msg", description: "True if the message should not be seen by all")]
            bool privateMsg = false
            )
        {
            try
            {
                var msg = "Le compteur anti-abus a été lancé ! Vous serez notifié ";
                msg += privateMsg ? "par message privé " : "";
                msg += "dans 15 minutes";

                var now = DateTime.Now;
                var alert = DateTime.Now
                    .AddMinutes(15);


                var expirationFieldExpiration = new EmbedFieldBuilder();
                expirationFieldExpiration.Name = "Expiration";
                expirationFieldExpiration.Value = $"<t:{Math.Floor((alert.ToUniversalTime() - DateTime.UnixEpoch.ToUniversalTime()).TotalSeconds)}:R>";
                
                var embedBuilder = new EmbedBuilder()
                    .WithDescription(msg)
                    .WithFields(expirationFieldExpiration)
                    .WithColor(DiscordBotConsts.MhoColorPink);
                
                await RespondAsync(embed: embedBuilder.Build(), ephemeral: true);
                await Task.Delay(alert - now);

                if (privateMsg)
                {
                    await Context.User.SendMessageAsync(
                        $"{Context.User.Mention} Le compteur anti-abus a été réinitialisé !");
                }
                else
                {
                    await Context.Channel.SendMessageAsync(
                        $"{Context.User.Mention} Le compteur anti-abus a été réinitialisé !");
                }
            }
            catch (Exception e)
            {
                _logger.LogWarning(e.ToString(), e);
                await RespondAsync($"Une erreur s'est produite lors de la création du compteur\n```{e.Message}```",
                    ephemeral: true);
            }
        }

        [SlashCommand(name: "timer", description: "Launches a custom counter. Example: 1h 25m 12s")]
        public async Task CounterAsync(
            [Summary(name:"time", description: "The duration of the counter (Example: 1h 25m 12s)")]
            string time, 
            [Summary(name:"reason", description: "The reason for the counter. It is this message that will be sent at the end of the counter")]
            string reason, 
            [Summary(name:"private-msg", description: "True if the message should not be seen by all")]
            bool privateMsg = false
            )
        {
            try
            {
                var splittedTime = time.Split(" ");
                
                var years = Array.Find(splittedTime, (timePart) => timePart.EndsWith("Y"));
                var months = Array.Find(splittedTime, (timePart) => timePart.EndsWith("M"));
                var days = Array.Find(splittedTime, (timePart) => timePart.EndsWith("D"));
                var hours = Array.Find(splittedTime, (timePart) => timePart.EndsWith("h"));
                var minutes = Array.Find(splittedTime, (timePart) => timePart.EndsWith("m"));
                var seconds = Array.Find(splittedTime, (timePart) => timePart.EndsWith("s"));

                var yearsInt = years != null ? int.Parse(years.Replace("Y", "")) : 0;
                var monthsInt = months != null ? int.Parse(months.Replace("M", "")) : 0;
                var daysInt = days != null ? int.Parse(days.Replace("D", "")) : 0;
                var hoursInt = hours != null ? int.Parse(hours.Replace("h", "")) : 0;
                var minutesInt = minutes != null ? int.Parse(minutes.Replace("m", "")) : 0;
                var secondsInt = seconds != null ? int.Parse(seconds.Replace("s", "")) : 0;
                
                var now = DateTime.Now;
                var alert = DateTime.Now
                    .AddYears(yearsInt)
                    .AddMonths(monthsInt)
                    .AddDays(daysInt)
                    .AddHours(hoursInt)
                    .AddMinutes(minutesInt)
                    .AddSeconds(secondsInt);

                var msg = "Votre compteur a bien été programmé !";
                msg += privateMsg ? " Vous serez notifié par message privé." : "";
                
                var expirationFieldReason = new EmbedFieldBuilder();
                expirationFieldReason.Name = "Raison";
                expirationFieldReason.Value = reason;

                var expirationFieldExpiration = new EmbedFieldBuilder();
                expirationFieldExpiration.Name = "Expiration";
                expirationFieldExpiration.Value = $"<t:{Math.Floor((alert.ToUniversalTime() - DateTime.UnixEpoch.ToUniversalTime()).TotalSeconds)}:R>";

                var embedBuilder = new EmbedBuilder()
                    .WithDescription(msg)
                    .WithFields(expirationFieldReason)
                    .WithFields(expirationFieldExpiration)
                    .WithColor(DiscordBotConsts.MhoColorPink);
                
                await RespondAsync(embed: embedBuilder.Build(), ephemeral: true);
                await Task.Delay(alert - now);

                if (privateMsg)
                {
                    await Context.User.SendMessageAsync($"{Context.User.Mention} {reason}");
                }
                else
                {
                    await Context.Channel.SendMessageAsync($"{Context.User.Mention} {reason}");
                }
            }
            catch (Exception e)
            {
                _logger.LogWarning(e.ToString(), e);
                await RespondAsync($"Une erreur s'est produite lors de la création du compteur\n```{e.Message}```",
                    ephemeral: true);
            }
        }

        // [SlashCommand("alarm", "Programme une alerte pour une heure donnée")]
        // public async Task Alarm(int day, int month, int year, int hour, int minute, int second)
        // {
        //     double sqrt = Modules.AlertsModule.Sqrt(number);
        //     await RespondAsync($"The square root of `{number}` is `{sqrt}`.", ephemeral: true);
        // }
    }
}