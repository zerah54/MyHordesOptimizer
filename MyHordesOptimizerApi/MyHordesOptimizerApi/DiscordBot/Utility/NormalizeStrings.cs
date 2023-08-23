using System.Text;
using System.Text.RegularExpressions;

namespace MyHordesOptimizerApi.DiscordBot.Utility
{
    public static class NormalizeStrings
    {
        private readonly static Regex nonSpacingMarkRegex = new Regex(@"\p{Mn}", RegexOptions.Compiled);

        public static string RemoveDiacritics(string text)
        {
            if (text == null)
                return string.Empty;

            var normalizedText =
                text.Normalize(NormalizationForm.FormD);

            return nonSpacingMarkRegex.Replace(normalizedText, string.Empty);
        }
        
        public static string NormalizeLower(string text)
        {
            return RemoveDiacritics(text).ToLower();
        }
    }
}