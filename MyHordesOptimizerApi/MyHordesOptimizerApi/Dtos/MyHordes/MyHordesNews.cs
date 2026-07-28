using Newtonsoft.Json;

namespace MyHordesOptimizerApi.Dtos.MyHordes
{
    /// <summary>
    /// La gazette du jour, sortie de <c>getNewsData</c>. Un objet unique.
    /// </summary>
    /// <remarks>
    /// <see cref="RegenDir"/> n'est renvoyé que si la ville a construit la Tour de guet avancée
    /// (<c>small_gather_#02</c>) ET que la gazette porte une direction de vent.
    /// </remarks>
    public class MyHordesNews
    {
        [JsonProperty("z")]
        public int? Z { get; set; }

        [JsonProperty("def")]
        public int? Def { get; set; }

        [JsonProperty("content")]
        public MyHordesLangString? Content { get; set; }

        [JsonProperty("water")]
        public int? Water { get; set; }

        [JsonProperty("regenDir")]
        public MyHordesLangString? RegenDir { get; set; }

    }
}
