using System;
using FluentAssertions;
using MyHordesOptimizerApi.DiscordBot.Localization;
using MyHordesOptimizerApi.DiscordBot.Utility;
using Xunit;

namespace MyHordesOptimizerApiUnitTests.DiscordBot
{
    /// <summary>
    /// Compteurs du bot : lecture de la durée, fenêtre de validité du jeton d'interaction,
    /// ordre des canaux de notification et texte envoyé.
    /// </summary>
    public class DiscordTimerRulesTests
    {
        private static readonly DateTime From = new DateTime(2026, 1, 31, 12, 0, 0, DateTimeKind.Utc);

        /// <summary>Textes français : les attendus ci-dessous sont ceux d'avant la traduction du bot.</summary>
        private static readonly BotTexts Fr = BotTexts.Fr;

        [Fact]
        public void Duree_complete_appliquee_du_calendrier_aux_secondes()
        {
            DiscordTimerRules.TryComputeDueAt("1Y 2M 7D 1h 25m 12s", From, Fr, out DateTime due, out string error).Should().BeTrue(error);

            due.Should().Be(From.AddYears(1).AddMonths(2).AddDays(7).AddHours(1).AddMinutes(25).AddSeconds(12));
        }

        [Theory]
        [InlineData("10 m", 10 * 60)]
        [InlineData("1h1m", 61 * 60)]
        [InlineData("  90s ", 90)]
        [InlineData("1d", 24 * 3600)]
        [InlineData("2H 3S", 2 * 3600 + 3)]
        public void Espaces_facultatifs_et_casse_libre_sauf_mois_et_minutes(string duration, int expectedSeconds)
        {
            DiscordTimerRules.TryComputeDueAt(duration, From, Fr, out DateTime due, out string error).Should().BeTrue(error);

            due.Should().Be(From.AddSeconds(expectedSeconds));
        }

        [Fact]
        public void M_majuscule_mois_et_m_minuscule_minutes()
        {
            DiscordTimerRules.TryComputeDueAt("1M", From, Fr, out DateTime months, out _).Should().BeTrue();
            DiscordTimerRules.TryComputeDueAt("1m", From, Fr, out DateTime minutes, out _).Should().BeTrue();

            months.Should().Be(From.AddMonths(1));
            minutes.Should().Be(From.AddMinutes(1));
        }

        [Fact]
        public void Ordre_de_saisie_sans_effet()
        {
            DiscordTimerRules.TryComputeDueAt("1D 1M", From, Fr, out DateTime dayFirst, out _).Should().BeTrue();
            DiscordTimerRules.TryComputeDueAt("1M 1D", From, Fr, out DateTime monthFirst, out _).Should().BeTrue();

            dayFirst.Should().Be(monthFirst);
        }

        [Theory]
        [InlineData(null)]
        [InlineData("")]
        [InlineData("abc")]
        [InlineData("10")]
        [InlineData("5x")]
        [InlineData("1h 2h")]
        [InlineData("1d 1D")]
        [InlineData("0s")]
        [InlineData("999999999Y")]
        [InlineData("-5m")]
        public void Duree_refusee_avec_message(string? duration)
        {
            DiscordTimerRules.TryComputeDueAt(duration, From, Fr, out DateTime due, out string error).Should().BeFalse();

            error.Should().NotBeNullOrWhiteSpace();
            due.Should().Be(From);
        }

        [Fact]
        public void Jeton_utilisable_jusqu_a_quinze_minutes_moins_la_marge()
        {
            DateTimeOffset createdAt = new DateTimeOffset(From);

            DiscordTimerRules.CanUseInteractionToken(createdAt, From.AddMinutes(14)).Should().BeTrue();
            DiscordTimerRules.CanUseInteractionToken(createdAt, From.AddMinutes(14).AddSeconds(30)).Should().BeTrue();
            DiscordTimerRules.CanUseInteractionToken(createdAt, From.AddMinutes(14).AddSeconds(31)).Should().BeFalse();
            DiscordTimerRules.CanUseInteractionToken(createdAt, From.AddMinutes(15)).Should().BeFalse();
        }

        [Fact]
        public void Ordre_des_canaux_message_prive_en_dernier_recours()
        {
            DiscordTimerRules.GetDeliveryOrder(true, true).Should().Equal(DiscordTimerTarget.Interaction, DiscordTimerTarget.Channel, DiscordTimerTarget.DirectMessage);
            DiscordTimerRules.GetDeliveryOrder(false, true).Should().Equal(DiscordTimerTarget.Channel, DiscordTimerTarget.DirectMessage);
            DiscordTimerRules.GetDeliveryOrder(true, false).Should().Equal(DiscordTimerTarget.Interaction, DiscordTimerTarget.DirectMessage);
            DiscordTimerRules.GetDeliveryOrder(false, false).Should().Equal(DiscordTimerTarget.DirectMessage);
        }

        [Fact]
        public void Mention_hors_message_prive()
        {
            DiscordTimerRules.FormatNotification(42, "Banque", DiscordTimerTarget.Channel, From, From, Fr).Should().Be("<@42> Banque");
            DiscordTimerRules.FormatNotification(42, "Banque", DiscordTimerTarget.Interaction, From, From, Fr).Should().Be("<@42> Banque");
            DiscordTimerRules.FormatNotification(42, "Banque", DiscordTimerTarget.DirectMessage, From, From, Fr).Should().Be("Banque");
        }

        [Fact]
        public void Retard_signale_au_dela_d_une_minute()
        {
            long dueUnix = new DateTimeOffset(From).ToUnixTimeSeconds();

            DiscordTimerRules.FormatNotification(42, "Banque", DiscordTimerTarget.Channel, From, From.AddSeconds(59), Fr).Should().Be("<@42> Banque");
            DiscordTimerRules.FormatNotification(42, "Banque", DiscordTimerTarget.DirectMessage, From, From.AddMinutes(10), Fr)
                .Should().Be($"Banque\n-# Prévu <t:{dueUnix}:f>, envoyé en retard.");
        }

        [Fact]
        public void Confirmation_indique_ou_arrivera_la_notification()
        {
            DiscordTimerRules.DescribeTarget(DiscordTimerTarget.Interaction, isPrivate: true, Fr).Should().Be("ici, par un message visible de vous seul");
            DiscordTimerRules.DescribeTarget(DiscordTimerTarget.Interaction, isPrivate: false, Fr).Should().Be("ici");
            DiscordTimerRules.DescribeTarget(DiscordTimerTarget.Channel, isPrivate: false, Fr).Should().Be("ici");
            DiscordTimerRules.DescribeTarget(DiscordTimerTarget.DirectMessage, isPrivate: true, Fr).Should().Be("par message privé");
            DiscordTimerRules.DescribeTarget(DiscordTimerTarget.DirectMessage, isPrivate: false, Fr).Should().Be("par message privé (le bot ne peut pas écrire ici)");
        }
    }
}
