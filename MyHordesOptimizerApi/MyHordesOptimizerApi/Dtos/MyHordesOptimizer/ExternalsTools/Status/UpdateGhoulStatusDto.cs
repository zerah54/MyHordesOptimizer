using Newtonsoft.Json;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.Status
{
    public class UpdateGhoulStatusDto
    {
        [JsonProperty("isGhoul")]
        public bool IsGhoul { get; set; }

        /// <summary>Voracité ; absente = inchangée (saisie manuelle de l'état goule).</summary>
        [JsonProperty("voracity")]
        public int? Voracity { get; set; }

        /// <summary>Citoyen concerné ; absent = l'appelant. Tout citoyen de la ville peut renseigner n'importe quel citoyen.</summary>
        [JsonProperty("userId")]
        public int? UserId { get; set; }
    }
}
