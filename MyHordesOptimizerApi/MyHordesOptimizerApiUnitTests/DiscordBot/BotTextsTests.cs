using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using FluentAssertions;
using MyHordesOptimizerApi.DiscordBot.Enums;
using MyHordesOptimizerApi.DiscordBot.Localization;
using MyHordesOptimizerApi.DiscordBot.Utility;
using Xunit;

namespace MyHordesOptimizerApiUnitTests.DiscordBot
{
    /// <summary>
    /// Textes du bot : choix de la langue d'après la locale Discord, et textes complets dans chaque langue
    /// (la présence de chaque membre est garantie à la compilation par <c>required</c>).
    /// </summary>
    public class BotTextsTests
    {
        public static IEnumerable<object[]> AllTexts()
        {
            yield return new object[] { BotTexts.Fr };
            yield return new object[] { BotTexts.En };
            yield return new object[] { BotTexts.De };
            yield return new object[] { BotTexts.Es };
        }

        [Theory]
        [InlineData("fr", Locales.Fr)]
        [InlineData("en-US", Locales.En)]
        [InlineData("en-GB", Locales.En)]
        [InlineData("de", Locales.De)]
        [InlineData("es-ES", Locales.Es)]
        [InlineData("es-419", Locales.Es)]
        [InlineData("pt-BR", Locales.En)]
        [InlineData("", Locales.En)]
        [InlineData(null, Locales.En)]
        public void Langue_de_la_locale_Discord_anglais_a_defaut(string? discordLocale, Locales expected)
        {
            BotTexts.ParseLocale(discordLocale).Should().Be(expected);
            BotTexts.For(discordLocale).Locale.Should().Be(expected);
        }

        [Theory]
        [InlineData(Locales.Fr)]
        [InlineData(Locales.En)]
        [InlineData(Locales.De)]
        [InlineData(Locales.Es)]
        public void Code_enregistre_relu_dans_la_meme_langue(Locales locale)
        {
            BotTexts.For(BotTexts.ToCode(locale)).Locale.Should().Be(locale);
        }

        [Theory]
        [MemberData(nameof(AllTexts))]
        public void Aucun_texte_vide_et_chaque_fonction_produit_un_texte(BotTexts texts)
        {
            foreach (PropertyInfo property in typeof(BotTexts).GetProperties(BindingFlags.Public | BindingFlags.Instance))
            {
                object? value = property.GetValue(texts);
                switch (value)
                {
                    case string text:
                        text.Should().NotBeNullOrWhiteSpace($"{texts.Locale}.{property.Name}");
                        break;
                    case IReadOnlyList<string> list:
                        list.Should().NotBeEmpty().And.OnlyContain(item => !string.IsNullOrWhiteSpace(item), $"{texts.Locale}.{property.Name}");
                        break;
                    case Delegate function:
                        object?[] arguments = function.GetType().GetMethod(nameof(Action.Invoke))!.GetParameters()
                            .Select(parameter => parameter.ParameterType == typeof(string) ? "x" : Activator.CreateInstance(parameter.ParameterType))
                            .ToArray();
                        string? result = function.DynamicInvoke(arguments) as string;
                        result.Should().NotBeNullOrWhiteSpace($"{texts.Locale}.{property.Name}");
                        break;
                    case Locales:
                        break;
                    default:
                        throw new InvalidOperationException($"Type de texte non vérifié : {property.PropertyType} ({property.Name})");
                }
            }
        }

        [Theory]
        [MemberData(nameof(AllTexts))]
        public void Jeu_de_cartes_complet(BotTexts texts)
        {
            texts.PlayCardRanks.Should().HaveCount(13).And.OnlyHaveUniqueItems();
            texts.PlayCardSuits.Should().HaveCount(4).And.OnlyHaveUniqueItems();
        }

        [Theory]
        [MemberData(nameof(AllTexts))]
        public void Mots_de_l_aide_memoire_sans_syntaxe_Markdown(BotTexts texts)
        {
            string[] words =
            {
                texts.CheatBold, texts.CheatItalic, texts.CheatUnderline, texts.CheatStrikethrough, texts.CheatSpoiler,
                texts.CheatCode, texts.CheatQuote, texts.CheatMultilineCode, texts.CheatMultilineQuote, texts.CheatMaskedLink,
                texts.CheatBigTitle, texts.CheatMediumTitle, texts.CheatSmallTitle, texts.CheatSmallText,
                texts.CheatBulletList, texts.CheatOrderedList, texts.CheatLevel(2)
            };

            words.Should().OnlyContain(word => word.IndexOfAny(new[] { '*', '_', '~', '|', '`', '>', '#', '[', ']' }) < 0);
        }

        [Fact]
        public void Compteurs_dans_la_langue_fournie()
        {
            DateTime from = new DateTime(2026, 1, 31, 12, 0, 0, DateTimeKind.Utc);
            long dueUnix = new DateTimeOffset(from).ToUnixTimeSeconds();

            DiscordTimerRules.TryComputeDueAt("abc", from, BotTexts.En, out _, out string error).Should().BeFalse();
            error.Should().Be("Unreadable duration. " + BotTexts.En.TimerDurationFormatHelp);
            DiscordTimerRules.FormatNotification(42, "Bank", DiscordTimerTarget.DirectMessage, from, from.AddMinutes(10), BotTexts.En)
                .Should().Be($"Bank\n-# Scheduled for <t:{dueUnix}:f>, sent late.");
            DiscordTimerRules.DescribeTarget(DiscordTimerTarget.DirectMessage, isPrivate: false, BotTexts.De)
                .Should().Be("per Direktnachricht (der Bot kann hier nicht schreiben)");
        }
    }
}
