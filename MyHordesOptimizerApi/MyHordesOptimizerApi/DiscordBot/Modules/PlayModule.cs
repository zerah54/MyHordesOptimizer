using System;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Discord;
using Discord.Interactions;
using MyHordesOptimizerApi.DiscordBot.Utility;
using MyHordesOptimizerApi.Extensions;

namespace MyHordesOptimizerApi.DiscordBot.Modules
{
    public class PlayModule : InteractionModuleBase<SocketInteractionContext>
    {
        [SlashCommand(name: "play", description: "The same games as on MyHordes, but on Discord")]
        public async Task PlayAllAsync(
            [Summary(name: "text", description: "Use the same shortcuts as on MyHordes! (Example: {d100}{d20})")]
            string text
            )
        {
            var result = Regex.Replace(text, @"(\{\w+\})", match => GetReplacement(match.ToString()));

            var embedBuilder = new EmbedBuilder()
                .WithAuthor(Context.User)
                .WithDescription(result)
                .WithColor(DiscordBotConsts.MhoColorPink);
            await RespondAsync(embed: embedBuilder.Build());
        }

        private static string RollDice(int value)
        {
            var random = new Random();
            return random.Next(1, value + 1).ToString();
        }

        private static string RollPfc()
        {
            var values = Enum.GetValues(typeof(DiscordBotGamesValues.PFC));
            var random = new Random();
            var randomValue = values.GetValue(random.Next(values.Length)).ToString();
            return randomValue;
        }

        private static string RollPf()
        {
            var values = Enum.GetValues(typeof(DiscordBotGamesValues.PF));
            var random = new Random();
            var randomValue = values.GetValue(random.Next(values.Length)).ToString();
            return randomValue;
        }

        private static string RollCards()
        {
            var values = Enum.GetValues(typeof(DiscordBotGamesValues.Cards));
            var random = new Random();
            var randomValue = values.GetValue(random.Next(values.Length));
            return ((DiscordBotGamesValues.Cards)randomValue).GetDescription();
        }

        private static string RollLetter()
        {
            var values = Enum.GetValues(typeof(DiscordBotGamesValues.Letters));
            var random = new Random();
            var randomValue = values.GetValue(random.Next(values.Length)).ToString();
            return randomValue.ToLower();
        }

        private static string RollVowel()
        {
            var values = Enum.GetValues(typeof(DiscordBotGamesValues.Vowels));
            var random = new Random();
            var randomValue = values.GetValue(random.Next(values.Length)).ToString();
            return randomValue.ToLower();
        }

        private static string RollConsonant()
        {
            var values = Enum.GetValues(typeof(DiscordBotGamesValues.Consonants));
            var random = new Random();
            var randomValue = values.GetValue(random.Next(values.Length)).ToString();
            return randomValue.ToLower();
        }

        private static string GetReplacement(string text)
        {
            switch (text.ToLower())
            {
                case "{d100}":
                case "{dice100}":
                case "{dc100}":
                case "{de100}":
                case "{des100}":
                case "{w100}":
                case "{dado100}":
                    return $" `{RollDice(100)}` ";
                case "{d20}":
                case "{dice20}":
                case "{dc20}":
                case "{de20}":
                case "{des20}":
                case "{w20}":
                case "{dado20}":
                    return $" `{RollDice(20)}` ";
                case "{d12}":
                case "{dice12}":
                case "{dc12}":
                case "{de12}":
                case "{des12}":
                case "{w12}":
                case "{dado12}":
                    return $" `{RollDice(12)}` ";
                case "{d10}":
                case "{dice10}":
                case "{dc10}":
                case "{de10}":
                case "{des10}":
                case "{w10}":
                case "{dado10}":
                    return $" `{RollDice(10)}` ";
                case "{d8}":
                case "{dice8}":
                case "{dc8}":
                case "{de8}":
                case "{des8}":
                case "{w8}":
                case "{dado8}":
                    return $" `{RollDice(8)}` ";
                case "{d6}":
                case "{dice6}":
                case "{dc6}":
                case "{de6}":
                case "{des6}":
                case "{w6}":
                case "{dado6}":
                    return $" `{RollDice(6)}` ";
                case "{d4}":
                case "{dice4}":
                case "{dc4}":
                case "{de4}":
                case "{des4}":
                case "{w4}":
                case "{dado4}":
                    return $" `{RollDice(4)}` ";
                case "{pfc}":
                case "{rps}":
                case "{ssp}":
                case "{ppt}":
                    return $" `{RollPfc()}` ";
                case "{flip}":
                case "{coin}":
                case "{ht}":
                case "{pf}":
                case "{mw}":
                case "{moneda}":
                case "{zk}":
                    return $" `{RollPf()}` ";
                case "{carte}":
                case "{card}":
                case "{skat}":
                case "{blatt}":
                case "{carta}":
                case "{karte}":
                    return $" `{RollCards()}` ";
                case "{letter}":
                case "{lettre}":
                case "{letra}":
                    return $" :regional_indicator_{RollLetter()}: ";
                case "{vowel}":
                case "{voyelle}":
                case "{vocal}":
                    return $" :regional_indicator_{RollVowel()}: ";
                case "{consonant}":
                case "{consonne}":
                case "{consonante}":
                    return $" :regional_indicator_{RollConsonant()}: ";
                default:
                    return "";
            }
        }
    }
}
