using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Citizens;
using Newtonsoft.Json;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.HeroicAction
{
    public class UpdateSingleHeroicActionsDto
    {
        [JsonProperty("userId")]
        public int UserId { get; set; }

        [JsonProperty("heroicActions")]
        public CitizenActionsHeroicValue HeroicActions { get; set; }
    }
}
