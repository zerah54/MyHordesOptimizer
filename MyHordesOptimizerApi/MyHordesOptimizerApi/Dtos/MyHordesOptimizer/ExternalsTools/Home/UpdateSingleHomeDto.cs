using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Citizens;
using Newtonsoft.Json;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.Home
{
    public class UpdateSingleHomeDto
    {
        [JsonProperty("userId")]
        public int UserId { get; set; }

        [JsonProperty("home")]
        public CitizenHomeValue Home { get; set; }
    }
}
