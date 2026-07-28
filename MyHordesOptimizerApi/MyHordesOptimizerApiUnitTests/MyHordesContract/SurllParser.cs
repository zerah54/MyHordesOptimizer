using System.Text.RegularExpressions;

namespace MyHordesOptimizerApiUnitTests.MyHordesContract
{
    /// <summary>
    /// Parseur de la grammaire « SURLL » utilisée par les paramètres <c>fields=</c> de l'API
    /// MyHordes. Portage fidèle de <c>SURLL_preparser</c> / <c>SURLL_parser</c>
    /// (<c>src/Controller/API/JSONv1Controller.php</c>, l. 217-248).
    /// </summary>
    /// <remarks>
    /// MyHordes ne vérifie pas que le jeton d'imbrication s'appelle bien « fields » : n'importe
    /// quel jeton commençant par un point déclenche l'imbrication. Le portage conserve ce
    /// comportement volontairement, pour rester fidèle au contrat réel.
    /// </remarks>
    public static class SurllParser
    {
        private static readonly Regex _tokenizer =
            new(@"\.[a-z0-9\-]+|[a-z0-9\-]+|\(|\)", RegexOptions.IgnoreCase | RegexOptions.Compiled);

        public static IReadOnlyList<SurllField> Parse(string surll)
        {
            if (string.IsNullOrWhiteSpace(surll))
            {
                return Array.Empty<SurllField>();
            }

            var tokens = new Queue<string>(_tokenizer.Matches(surll).Select(match => match.Value));
            return ParseLevel(tokens);
        }

        private static List<SurllField> ParseLevel(Queue<string> tokens)
        {
            var parsed = new List<SurllField>();

            while (tokens.Count > 0)
            {
                var token = tokens.Dequeue();

                if (token == "(")
                {
                    continue;
                }

                if (token == ")")
                {
                    return parsed;
                }

                if (token[0] == '.')
                {
                    // « .fields » s'applique au dernier champ lu : on le remplace par une version
                    // portant les sous-champs du niveau suivant.
                    if (parsed.Count == 0)
                    {
                        continue;
                    }

                    var last = parsed[^1];
                    parsed[^1] = last with { Fields = ParseLevel(tokens) };
                    continue;
                }

                parsed.Add(new SurllField(token, Array.Empty<SurllField>()));
            }

            return parsed;
        }
    }
}
