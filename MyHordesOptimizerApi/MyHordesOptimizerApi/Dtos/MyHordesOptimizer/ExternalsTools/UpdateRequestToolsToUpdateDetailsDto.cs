using Newtonsoft.Json;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools
{
    public class UpdateRequestToolsToUpdateDetailsDto
    {
        [JsonProperty("IsFataMorgana")]
        public bool IsFataMorgana { get; set; }
        [JsonProperty("IsBigBrothHordes")]
        public bool IsBigBrothHordes { get; set; }
        [JsonProperty("IsGestHordes")]
        public bool IsGestHordes { get; set; }
        [JsonProperty("IsMyHordesOptimizer")]
        public bool IsMyHordesOptimizer { get; set; }
    }
}
