using Newtonsoft.Json;

namespace MyHordesOptimizerApi.Dtos.MyHordes.Import
{
    public class ImportHeroSkillRequestDto
    {
        [JsonProperty("HeroSkill")]
        public string HeroSkill { get; set; }

        [JsonProperty("en")]
        public string En { get; set; }

        [JsonProperty("fr")]
        public string Fr { get; set; }

        [JsonProperty("es")]
        public string Es { get; set; }
    }
}
