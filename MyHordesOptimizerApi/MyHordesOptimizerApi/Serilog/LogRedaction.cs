using Microsoft.AspNetCore.HttpLogging;
using System.Text.RegularExpressions;

namespace MyHordesOptimizerApi.Serilog
{
    /// <summary>Masque les clés joueur, clés d'application et jetons avant qu'un texte n'atteigne un log.</summary>
    public static class LogRedaction
    {
        // Query et corps portent la clé joueur et le JWT : exclus du journal HTTP.
        public const HttpLoggingFields HttpLoggingFields = HttpLoggingFields.All & ~(HttpLoggingFields.RequestQuery | HttpLoggingFields.RequestBody | HttpLoggingFields.ResponseBody);

        private const string Mask = "***";
        private const string SecretNames = "userkey|appkey|accesskey|apikey|key|token|access_token|accesstoken|myhordeskey";

        /// <summary>Paramètre de query ou de formulaire (`userKey=…`) : le lookbehind écarte les noms qui finissent par un secret (`monkey=`).</summary>
        private static readonly Regex QueryParameter = new($@"(?<!\w)({SecretNames})=[^&\s""'\]]+", RegexOptions.IgnoreCase | RegexOptions.Compiled);

        /// <summary>Champ JSON (`"userKey": "…"`).</summary>
        private static readonly Regex JsonField = new($@"(""(?:{SecretNames})""\s*:\s*)""[^""]*""", RegexOptions.IgnoreCase | RegexOptions.Compiled);

        /// <summary>JWT (en-tête, charge, signature), où qu'il apparaisse.</summary>
        private static readonly Regex Jwt = new(@"eyJ[\w-]+\.[\w-]+\.[\w-]+", RegexOptions.Compiled);

        /// <summary>Texte dont les valeurs secrètes sont remplacées par `***` ; null reste null.</summary>
        public static string? Redact(string? text)
        {
            if (string.IsNullOrEmpty(text))
            {
                return text;
            }
            var redacted = QueryParameter.Replace(text, $"$1={Mask}");
            redacted = JsonField.Replace(redacted, $"$1\"{Mask}\"");
            return Jwt.Replace(redacted, Mask);
        }
    }
}
