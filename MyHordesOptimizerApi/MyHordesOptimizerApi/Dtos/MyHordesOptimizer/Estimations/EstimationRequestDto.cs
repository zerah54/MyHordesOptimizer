using Newtonsoft.Json;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Estimations
{
    public class EstimationRequestDto
    {

        [JsonProperty("day")]
        public int? Day { get; set; }

        [JsonProperty("estim")]
        public EstimationsDto Estim { get; set; }

        [JsonProperty("planif")]
        public EstimationsDto Planif { get; set; }

        public EstimationRequestDto()
        {
            Estim = new EstimationsDto();
            Planif = new EstimationsDto();
        }
    }
}
