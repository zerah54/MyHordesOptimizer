using System.Collections.Generic;
using System.Linq;
using System.Text.Json;

namespace MyHordesOptimizerApi.Services.Impl.Estimations
{
    /// <summary>Âmes par palier stockées en JSON (clé = %, paliers à 0 omis ; "{}" = aucune âme, null = jamais renseigné).</summary>
    public static class SoulsJson
    {
        public static Dictionary<int, int> Parse(string? json)
        {
            if (string.IsNullOrWhiteSpace(json))
            {
                return new Dictionary<int, int>();
            }
            try
            {
                return JsonSerializer.Deserialize<Dictionary<int, int>>(json) ?? new Dictionary<int, int>();
            }
            catch (JsonException)
            {
                return new Dictionary<int, int>();
            }
        }

        public static string Serialize(IReadOnlyDictionary<int, int> souls) =>
            JsonSerializer.Serialize(souls.Where(entry => entry.Value > 0).OrderBy(entry => entry.Key).ToDictionary(entry => entry.Key, entry => entry.Value));
    }
}
