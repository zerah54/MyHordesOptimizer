using System;
using System.Collections.Generic;
using System.Globalization;
using System.Text.RegularExpressions;
using MyHordesOptimizerApi.DiscordBot.Localization;

namespace MyHordesOptimizerApi.DiscordBot.Utility
{
    /// <summary>Canal par lequel la notification d'un compteur est envoyée.</summary>
    public enum DiscordTimerTarget
    {
        /// <summary>Suivi de la commande : possible tant que le jeton de l'interaction est valide.</summary>
        Interaction,

        /// <summary>Message du bot dans le salon de la commande.</summary>
        Channel,

        /// <summary>Message privé à l'auteur de la commande.</summary>
        DirectMessage
    }

    /// <summary>
    /// Règles des compteurs du bot (/aa, /timer), indépendantes du client Discord : lecture de la durée,
    /// ordre des canaux de notification et textes envoyés, dans la langue fournie.
    /// </summary>
    public static class DiscordTimerRules
    {
        /// <summary>
        /// Discord n'accepte une réponse à une interaction, suivis compris, que pendant 15 minutes.
        /// La marge couvre l'écart d'horloge et le trajet réseau.
        /// </summary>
        public static readonly TimeSpan InteractionTokenLifetime = TimeSpan.FromMinutes(15) - TimeSpan.FromSeconds(30);

        /// <summary>Retard à partir duquel la notification le signale (API redémarrée, Discord indisponible).</summary>
        public static readonly TimeSpan LateThreshold = TimeSpan.FromMinutes(1);

        /// <summary>Longueur maximale du message : tient dans un champ d'embed (1024) et dans un message (2000) avec la mention.</summary>
        public const int MaxMessageLength = 1000;

        public const int MaxPendingTimersPerUser = 20;

        /// <summary>Ordre d'application : le calendrier (années, mois) avant les durées fixes, quel que soit l'ordre saisi.</summary>
        private static readonly char[] UnitOrder = { 'Y', 'M', 'D', 'h', 'm', 's' };

        /// <summary>Seuls M (mois) et m (minutes) dépendent de la casse.</summary>
        private static readonly Regex DurationPattern = new(@"^\s*(?:(\d{1,9})\s*([YyMDdHhmSs])\s*)+$", RegexOptions.Compiled | RegexOptions.CultureInvariant);

        /// <summary>
        /// Calcule l'échéance d'une durée saisie (« 1Y 2M 7D 1h 25m 12s », espaces facultatifs).
        /// </summary>
        /// <param name="duration">La durée saisie</param>
        /// <param name="fromUtc">Le point de départ, en UTC</param>
        /// <param name="texts">La langue du message d'erreur</param>
        /// <param name="dueUtc">L'échéance, en UTC</param>
        /// <param name="error">Le message à afficher si la durée est refusée</param>
        /// <returns>Vrai si la durée est lisible, strictement positive et représentable</returns>
        public static bool TryComputeDueAt(string? duration, DateTime fromUtc, BotTexts texts, out DateTime dueUtc, out string error)
        {
            dueUtc = fromUtc;
            error = string.Empty;

            Match match = DurationPattern.Match(duration ?? string.Empty);
            if (!match.Success)
            {
                error = $"{texts.TimerDurationUnreadable} {texts.TimerDurationFormatHelp}";
                return false;
            }

            Dictionary<char, int> amounts = new Dictionary<char, int>();
            CaptureCollection values = match.Groups[1].Captures;
            CaptureCollection units = match.Groups[2].Captures;
            for (int i = 0; i < values.Count; i++)
            {
                if (!amounts.TryAdd(NormalizeUnit(units[i].Value[0]), int.Parse(values[i].Value, CultureInfo.InvariantCulture)))
                {
                    error = $"{texts.TimerDurationRepeatedUnit(units[i].Value)} {texts.TimerDurationFormatHelp}";
                    return false;
                }
            }

            DateTime due = fromUtc;
            try
            {
                foreach (char unit in UnitOrder)
                {
                    if (amounts.TryGetValue(unit, out int amount))
                    {
                        due = AddUnit(due, unit, amount);
                    }
                }
            }
            catch (ArgumentOutOfRangeException)
            {
                error = texts.TimerDurationTooLong;
                return false;
            }

            if (due <= fromUtc)
            {
                error = texts.TimerDurationNotPositive;
                return false;
            }

            dueUtc = due;
            return true;
        }

        /// <param name="interactionCreatedAt">La création de l'interaction</param>
        /// <param name="atUtc">Le moment de l'envoi, en UTC</param>
        /// <returns>Vrai si Discord acceptera encore un suivi de l'interaction à ce moment</returns>
        public static bool CanUseInteractionToken(DateTimeOffset interactionCreatedAt, DateTime atUtc)
        {
            return atUtc <= interactionCreatedAt.UtcDateTime + InteractionTokenLifetime;
        }

        /// <summary>
        /// Canaux à essayer, dans l'ordre : le suivi de la commande tant qu'il est accepté, puis le salon,
        /// puis le message privé, qui reste le dernier recours.
        /// </summary>
        public static IReadOnlyList<DiscordTimerTarget> GetDeliveryOrder(bool canUseInteractionToken, bool hasChannel)
        {
            List<DiscordTimerTarget> targets = new List<DiscordTimerTarget>(3);
            if (canUseInteractionToken)
            {
                targets.Add(DiscordTimerTarget.Interaction);
            }
            if (hasChannel)
            {
                targets.Add(DiscordTimerTarget.Channel);
            }
            targets.Add(DiscordTimerTarget.DirectMessage);
            return targets;
        }

        /// <summary>Texte de la notification : mention de l'auteur hors message privé, retard signalé.</summary>
        public static string FormatNotification(ulong userId, string message, DiscordTimerTarget target, DateTime dueUtc, DateTime nowUtc, BotTexts texts)
        {
            string text = target == DiscordTimerTarget.DirectMessage ? message : $"<@{userId}> {message}";
            if (nowUtc - dueUtc >= LateThreshold)
            {
                text += "\n" + texts.TimerSentLate(ToUnixSeconds(dueUtc));
            }
            return text;
        }

        /// <summary>Complément de « Vous serez notifié… » dans la confirmation.</summary>
        public static string DescribeTarget(DiscordTimerTarget target, bool isPrivate, BotTexts texts)
        {
            return target switch
            {
                DiscordTimerTarget.Interaction when isPrivate => texts.TimerTargetHerePrivate,
                DiscordTimerTarget.Interaction or DiscordTimerTarget.Channel => texts.TimerTargetHere,
                _ when isPrivate => texts.TimerTargetDirectMessage,
                _ => texts.TimerTargetDirectMessageFallback
            };
        }

        public static long ToUnixSeconds(DateTime utc)
        {
            return new DateTimeOffset(DateTime.SpecifyKind(utc, DateTimeKind.Utc)).ToUnixTimeSeconds();
        }

        private static char NormalizeUnit(char unit)
        {
            return unit switch
            {
                'y' => 'Y',
                'd' => 'D',
                'H' => 'h',
                'S' => 's',
                _ => unit
            };
        }

        private static DateTime AddUnit(DateTime date, char unit, int amount)
        {
            return unit switch
            {
                'Y' => date.AddYears(amount),
                'M' => date.AddMonths(amount),
                'D' => date.AddDays(amount),
                'h' => date.AddHours(amount),
                'm' => date.AddMinutes(amount),
                _ => date.AddSeconds(amount)
            };
        }
    }
}
