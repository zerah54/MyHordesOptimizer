using System.Collections.Generic;
using Newtonsoft.Json;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Estimations
{
    public class EstimationRequestDto
    {

        [JsonProperty("day")]
        public int Day { get; set; }

        [JsonProperty("estim")]
        public EstimationsDto Estim { get; set; }

        [JsonProperty("planif")]
        public EstimationsDto Planif { get; set; }

        /// <summary>Âmes par palier de la tour du jour (clé = %). En POST : null = ne pas modifier, vide = effacer.</summary>
        [JsonProperty("estimSouls")]
        public Dictionary<int, int>? EstimSouls { get; set; }

        /// <summary>Âmes par palier du planificateur du jour (clé = %). En POST : null = ne pas modifier, vide = effacer.</summary>
        [JsonProperty("planifSouls")]
        public Dictionary<int, int>? PlanifSouls { get; set; }

        /// <summary>Niveau SPA (0-3) à la lecture de la tour. En POST : null = ne pas modifier.</summary>
        [JsonProperty("estimSpaLevel")]
        public int? EstimSpaLevel { get; set; }

        /// <summary>Niveau SPA (0-3) à la lecture du planificateur. En POST : null = ne pas modifier.</summary>
        [JsonProperty("planifSpaLevel")]
        public int? PlanifSpaLevel { get; set; }

        public EstimationRequestDto()
        {
            Estim = new EstimationsDto();
            Planif = new EstimationsDto();
        }
    }
}
