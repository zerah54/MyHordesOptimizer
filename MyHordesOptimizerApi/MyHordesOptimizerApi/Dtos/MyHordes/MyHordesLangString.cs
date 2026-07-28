using Newtonsoft.Json;

namespace MyHordesOptimizerApi.Dtos.MyHordes
{
    /// <summary>
    /// Libellé multilingue renvoyé par <c>getTranslate</c>. Cette forme à quatre clés dépend du
    /// paramètre <c>languages=fr,es,en,de</c> ajouté sans condition par
    /// <c>AbstractMyHordeRepositoryBase</c> : avec une seule langue demandée, MyHordes renverrait
    /// une chaîne nue et la désérialisation casserait.
    /// </summary>
    public class MyHordesLangString
    {
        [JsonProperty("fr")]
        public string? Fr { get; set; }

        [JsonProperty("es")]
        public string? Es { get; set; }

        [JsonProperty("en")]
        public string? En { get; set; }

        [JsonProperty("de")]
        public string? De { get; set; }

        public override string ToString()
        {
            return Fr ?? string.Empty;
        }
    }
}
