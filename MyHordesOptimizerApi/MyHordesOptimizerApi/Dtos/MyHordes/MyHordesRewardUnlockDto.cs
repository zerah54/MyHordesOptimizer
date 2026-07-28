using Newtonsoft.Json;

namespace MyHordesOptimizerApi.Dtos.MyHordes
{
    /// <summary>Élément du champ <c>unlocks</c> de <c>getRewardsData</c>.</summary>
    public class MyHordesRewardUnlockDto
    {
        [JsonProperty("id")]
        public int? Id { get; set; }

        /// <summary>Nombre de pictos à partir duquel la récompense est débloquée.</summary>
        [JsonProperty("at")]
        public int? At { get; set; }

        /// <summary><c>title</c> ou <c>icon</c>.</summary>
        [JsonProperty("type")]
        public string? Type { get; set; }

        /// <summary>Libellé traduit si <see cref="Type"/> vaut <c>title</c>, URL d'icône sinon.</summary>
        [JsonProperty("value")]
        public string? Value { get; set; }
    }
}
