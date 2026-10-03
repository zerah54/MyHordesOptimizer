using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading;
using System.Threading.Tasks;
using Discord;
using Discord.Net;
using Discord.WebSocket;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.DiscordBot.Localization;
using MyHordesOptimizerApi.DiscordBot.Utility;
using MyHordesOptimizerApi.Models;

namespace MyHordesOptimizerApi.DiscordBot.Services
{
    /// <summary>Résultat de la programmation d'un compteur.</summary>
    /// <param name="IsScheduled">Faux si le compteur est refusé</param>
    /// <param name="Target">Canal prévu pour la notification</param>
    /// <param name="Error">Motif du refus</param>
    public sealed record DiscordTimerScheduleResult(bool IsScheduled, DiscordTimerTarget Target, string? Error);

    public interface IDiscordTimerScheduler
    {
        /// <summary>
        /// Enregistre un compteur et programme sa notification.
        /// </summary>
        /// <param name="interaction">La commande qui crée le compteur</param>
        /// <param name="dueAtUtc">L'échéance, en UTC</param>
        /// <param name="message">Le message envoyé à l'échéance, dans la langue de l'auteur</param>
        /// <param name="isPrivate">Vrai si seul l'auteur doit voir la notification</param>
        Task<DiscordTimerScheduleResult> ScheduleAsync(IDiscordInteraction interaction, DateTime dueAtUtc, string message, bool isPrivate);
    }

    /// <summary>
    /// Compteurs du bot (/aa, /timer). Discord n'accepte le suivi d'une commande que pendant 15 minutes :
    /// au-delà, la notification part dans le salon si le bot peut y écrire, sinon en message privé.
    /// Les compteurs sont persistés et rechargés au démarrage. Une seule boucle attend la prochaine
    /// échéance, par tranches d'une heure au plus : aucune limite de durée, pas de dérive d'horloge.
    /// </summary>
    public sealed class DiscordTimerHostedService : BackgroundService, IDiscordTimerScheduler
    {
        private static readonly TimeSpan MaxWait = TimeSpan.FromHours(1);
        private static readonly TimeSpan RetryDelay = TimeSpan.FromMinutes(1);
        private const int MaxDeliveryAttempts = 5;

        private readonly DiscordSocketClient _client;
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<DiscordTimerHostedService> _logger;

        /// <summary>Terminée au premier Ready : avant, l'envoi et le cache des serveurs ne sont pas fiables.</summary>
        private readonly TaskCompletionSource _ready = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);

        private readonly object _lock = new object();
        private readonly PriorityQueue<PendingTimer, DateTime> _queue = new PriorityQueue<PendingTimer, DateTime>();

        /// <summary>Compteurs en file ou en cours d'envoi : évite un doublon entre le chargement initial et une commande concurrente.</summary>
        private readonly HashSet<int> _knownIds = new HashSet<int>();

        /// <summary>Réveille la boucle quand un compteur est ajouté : il peut échoir avant celui qu'elle attend.</summary>
        private readonly SemaphoreSlim _wakeUp = new SemaphoreSlim(0, 1);

        public DiscordTimerHostedService(DiscordSocketClient client, IServiceScopeFactory scopeFactory, ILogger<DiscordTimerHostedService> logger)
        {
            _client = client;
            _scopeFactory = scopeFactory;
            _logger = logger;

            // Abonnement dès la construction : les services hébergés sont tous construits avant la connexion du bot.
            _client.Ready += OnReadyAsync;
        }

        public async Task<DiscordTimerScheduleResult> ScheduleAsync(IDiscordInteraction interaction, DateTime dueAtUtc, string message, bool isPrivate)
        {
            ulong userId = interaction.User.Id;
            BotTexts texts = interaction.Texts();
            ulong? channelId = isPrivate ? null : ResolveWritableChannelId(interaction);
            bool canUseInteraction = DiscordTimerRules.CanUseInteractionToken(interaction.CreatedAt, dueAtUtc);
            DiscordTimerTarget target = DiscordTimerRules.GetDeliveryOrder(canUseInteraction, channelId.HasValue)[0];

            using IServiceScope scope = _scopeFactory.CreateScope();
            MhoContext dbContext = scope.ServiceProvider.GetRequiredService<MhoContext>();

            int pendingCount = await dbContext.DiscordTimers.CountAsync(timer => timer.UserId == userId);
            if (pendingCount >= DiscordTimerRules.MaxPendingTimersPerUser)
            {
                return new DiscordTimerScheduleResult(false, target, texts.TimerTooMany(pendingCount, DiscordTimerRules.MaxPendingTimersPerUser));
            }

            DiscordTimer row = new DiscordTimer
            {
                UserId = userId,
                ChannelId = channelId,
                Message = message,
                Locale = BotTexts.ToCode(texts.Locale),
                DueAt = dueAtUtc,
                CreatedAt = DateTime.UtcNow
            };
            dbContext.DiscordTimers.Add(row);
            await dbContext.SaveChangesAsync();

            Enqueue(new PendingTimer(row.IdDiscordTimer, userId, channelId, message, texts, dueAtUtc)
            {
                Interaction = interaction,
                IsPrivate = isPrivate
            });

            return new DiscordTimerScheduleResult(true, target, null);
        }

        public override void Dispose()
        {
            _client.Ready -= OnReadyAsync;
            _wakeUp.Dispose();
            base.Dispose();
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            try
            {
                await _ready.Task.WaitAsync(stoppingToken);
                await LoadPendingTimersAsync(stoppingToken);

                while (!stoppingToken.IsCancellationRequested)
                {
                    TimeSpan? wait = GetWaitBeforeNextTimer(DateTime.UtcNow);
                    if (wait is null || wait > TimeSpan.Zero)
                    {
                        await _wakeUp.WaitAsync(wait ?? Timeout.InfiniteTimeSpan, stoppingToken);
                        continue;
                    }

                    foreach (PendingTimer timer in DequeueDueTimers(DateTime.UtcNow))
                    {
                        await DeliverAsync(timer);
                    }
                }
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                // Arrêt de l'API : les compteurs restants sont en base et seront rechargés au démarrage.
            }
        }

        private Task OnReadyAsync()
        {
            _ready.TrySetResult();
            return Task.CompletedTask;
        }

        /// <summary>Recharge les compteurs persistés ; réessaie tant que la base ne répond pas.</summary>
        private async Task LoadPendingTimersAsync(CancellationToken stoppingToken)
        {
            while (true)
            {
                try
                {
                    using IServiceScope scope = _scopeFactory.CreateScope();
                    MhoContext dbContext = scope.ServiceProvider.GetRequiredService<MhoContext>();
                    List<DiscordTimer> rows = await dbContext.DiscordTimers.AsNoTracking().ToListAsync(stoppingToken);
                    foreach (DiscordTimer row in rows)
                    {
                        Enqueue(new PendingTimer(row.IdDiscordTimer, row.UserId, row.ChannelId, row.Message, BotTexts.For(row.Locale),
                            DateTime.SpecifyKind(row.DueAt, DateTimeKind.Utc)));
                    }
                    _logger.LogInformation("{Count} compteur(s) Discord rechargé(s)", rows.Count);
                    return;
                }
                catch (Exception e) when (e is not OperationCanceledException)
                {
                    _logger.LogError(e, "Chargement des compteurs Discord impossible, nouvel essai dans une minute");
                    await Task.Delay(RetryDelay, stoppingToken);
                }
            }
        }

        /// <returns>Null si aucun compteur n'est en attente, zéro si le prochain est échu</returns>
        private TimeSpan? GetWaitBeforeNextTimer(DateTime nowUtc)
        {
            lock (_lock)
            {
                if (!_queue.TryPeek(out _, out DateTime nextAttemptAt))
                {
                    return null;
                }
                TimeSpan wait = nextAttemptAt - nowUtc;
                return wait <= TimeSpan.Zero ? TimeSpan.Zero : wait < MaxWait ? wait : MaxWait;
            }
        }

        private List<PendingTimer> DequeueDueTimers(DateTime nowUtc)
        {
            List<PendingTimer> dueTimers = new List<PendingTimer>();
            lock (_lock)
            {
                while (_queue.TryPeek(out PendingTimer? timer, out DateTime nextAttemptAt) && nextAttemptAt <= nowUtc)
                {
                    _queue.Dequeue();
                    dueTimers.Add(timer);
                }
            }
            return dueTimers;
        }

        private void Enqueue(PendingTimer timer)
        {
            lock (_lock)
            {
                if (!_knownIds.Add(timer.Id))
                {
                    return;
                }
                _queue.Enqueue(timer, timer.NextAttemptAtUtc);
                if (_wakeUp.CurrentCount == 0)
                {
                    _wakeUp.Release();
                }
            }
        }

        /// <summary>Essaie les canaux dans l'ordre ; réessaie plus tard si seul un incident passager a empêché l'envoi.</summary>
        private async Task DeliverAsync(PendingTimer timer)
        {
            DateTime nowUtc = DateTime.UtcNow;
            bool canUseInteraction = timer.Interaction is not null && DiscordTimerRules.CanUseInteractionToken(timer.Interaction.CreatedAt, nowUtc);
            bool isSent = false;
            bool hasTransientFailure = false;

            foreach (DiscordTimerTarget target in DiscordTimerRules.GetDeliveryOrder(canUseInteraction, timer.ChannelId.HasValue))
            {
                SendOutcome outcome = await TrySendAsync(timer, target, nowUtc);
                if (outcome == SendOutcome.Sent)
                {
                    isSent = true;
                    break;
                }
                hasTransientFailure |= outcome == SendOutcome.TransientFailure;
            }

            if (!isSent && hasTransientFailure && ++timer.Attempts < MaxDeliveryAttempts)
            {
                timer.NextAttemptAtUtc = nowUtc + RetryDelay;
                lock (_lock)
                {
                    _queue.Enqueue(timer, timer.NextAttemptAtUtc);
                }
                return;
            }

            if (!isSent)
            {
                _logger.LogWarning("Compteur Discord {TimerId} non délivré à l'utilisateur {UserId}", timer.Id, timer.UserId);
            }
            await DeleteAsync(timer.Id);
        }

        private async Task<SendOutcome> TrySendAsync(PendingTimer timer, DiscordTimerTarget target, DateTime nowUtc)
        {
            string text = DiscordTimerRules.FormatNotification(timer.UserId, timer.Message, target, timer.DueAtUtc, nowUtc, timer.Texts);
            // Seul l'auteur peut être mentionné : le message saisi pourrait contenir @everyone ou des rôles.
            AllowedMentions allowedMentions = new AllowedMentions(AllowedMentionTypes.None) { UserIds = new List<ulong> { timer.UserId } };

            try
            {
                switch (target)
                {
                    case DiscordTimerTarget.Interaction:
                        await timer.Interaction!.FollowupAsync(text, ephemeral: timer.IsPrivate, allowedMentions: allowedMentions);
                        break;
                    case DiscordTimerTarget.Channel:
                        if (await _client.GetChannelAsync(timer.ChannelId!.Value) is not IMessageChannel channel)
                        {
                            return SendOutcome.Failed;
                        }
                        await channel.SendMessageAsync(text, allowedMentions: allowedMentions);
                        break;
                    default:
                        IUser? user = await _client.GetUserAsync(timer.UserId);
                        if (user is null)
                        {
                            return SendOutcome.Failed;
                        }
                        IDMChannel directMessageChannel = await user.CreateDMChannelAsync();
                        await directMessageChannel.SendMessageAsync(text, allowedMentions: allowedMentions);
                        break;
                }
                return SendOutcome.Sent;
            }
            catch (HttpException e) when ((int)e.HttpCode >= 400 && (int)e.HttpCode < 500 && e.HttpCode != HttpStatusCode.TooManyRequests)
            {
                // Refus définitif (jeton expiré, accès retiré, messages privés fermés) : on passe au canal suivant.
                _logger.LogInformation("Compteur Discord {TimerId} : envoi {Target} refusé ({Code} {DiscordCode})", timer.Id, target, e.HttpCode, e.DiscordCode);
                return SendOutcome.Failed;
            }
            catch (Exception e)
            {
                _logger.LogWarning(e, "Compteur Discord {TimerId} : envoi {Target} en échec", timer.Id, target);
                return SendOutcome.TransientFailure;
            }
        }

        private async Task DeleteAsync(int timerId)
        {
            try
            {
                using IServiceScope scope = _scopeFactory.CreateScope();
                MhoContext dbContext = scope.ServiceProvider.GetRequiredService<MhoContext>();
                await dbContext.DiscordTimers.Where(timer => timer.IdDiscordTimer == timerId).ExecuteDeleteAsync();
            }
            catch (Exception e)
            {
                _logger.LogError(e, "Suppression du compteur Discord {TimerId} impossible : il sera renvoyé au prochain démarrage", timerId);
            }
            finally
            {
                lock (_lock)
                {
                    _knownIds.Remove(timerId);
                }
            }
        }

        /// <summary>
        /// Salon où le bot peut publier la notification d'un compteur public, ou null (message privé) :
        /// conversation privée entre joueurs, ou serveur dont le bot n'est pas membre (application installée
        /// sur le compte de l'utilisateur), ou salon sans droit d'écriture.
        /// </summary>
        private ulong? ResolveWritableChannelId(IDiscordInteraction interaction)
        {
            if (interaction.ChannelId is not ulong channelId)
            {
                return null;
            }
            if (interaction.GuildId is not ulong guildId)
            {
                return interaction.ContextType == InteractionContextType.BotDm ? channelId : null;
            }

            try
            {
                SocketGuild? guild = _client.GetGuild(guildId);
                SocketGuildUser? botUser = guild?.CurrentUser;
                SocketGuildChannel? channel = guild?.GetChannel(channelId);
                if (botUser is null || channel is not IMessageChannel)
                {
                    return null;
                }

                // Les fils n'ont pas de permissions propres : elles se lisent sur le salon parent.
                bool isThread = channel is SocketThreadChannel;
                ChannelPermissions permissions = botUser.GetPermissions(channel is SocketThreadChannel thread ? thread.ParentChannel : channel);
                bool canSend = isThread ? permissions.SendMessagesInThreads : permissions.SendMessages;
                return permissions.ViewChannel && canSend ? channelId : null;
            }
            catch (Exception e)
            {
                _logger.LogInformation(e, "Droits du bot sur le salon {ChannelId} illisibles : notification en message privé", channelId);
                return null;
            }
        }

        private enum SendOutcome
        {
            Sent,
            Failed,
            TransientFailure
        }

        private sealed class PendingTimer
        {
            public PendingTimer(int id, ulong userId, ulong? channelId, string message, BotTexts texts, DateTime dueAtUtc)
            {
                Id = id;
                UserId = userId;
                ChannelId = channelId;
                Message = message;
                Texts = texts;
                DueAtUtc = dueAtUtc;
                NextAttemptAtUtc = dueAtUtc;
            }

            public int Id { get; }

            public ulong UserId { get; }

            public ulong? ChannelId { get; }

            public string Message { get; }

            /// <summary>Langue de l'auteur, pour les textes ajoutés à l'envoi.</summary>
            public BotTexts Texts { get; }

            public DateTime DueAtUtc { get; }

            public DateTime NextAttemptAtUtc { get; set; }

            public int Attempts { get; set; }

            /// <summary>Commande d'origine, tant que l'API n'a pas redémarré : permet un suivi, éphémère si privé.</summary>
            public IDiscordInteraction? Interaction { get; init; }

            public bool IsPrivate { get; init; }
        }
    }
}
