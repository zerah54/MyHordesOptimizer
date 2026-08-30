using Newtonsoft.Json;

namespace MyHordesOptimizerApi.Data.Citizens
{
    /// <summary>
    /// Un statut citoyen (<c>myhordes.fixtures.citizen.status</c>), projeté vers
    /// <c>Data/Citizens/status.json</c> par <c>Scripts/Extractor</c>. Le libellé/description
    /// (source allemande, à traduire) est délibérément absent : hors périmètre du référentiel de
    /// règles, à traiter côté affichage.
    /// </summary>
    public class MyHordesCitizenStatusCodeModel
    {
        public string Name { get; set; } = null!;

        [JsonProperty("nw_def")]
        public double? NwDef { get; set; }

        [JsonProperty("nw_death")]
        public double? NwDeath { get; set; }

        public bool Volatile { get; set; }
    }
}
