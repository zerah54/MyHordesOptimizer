using System.Collections.Generic;
using Newtonsoft.Json;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer
{
    public class CampingBonusDto
    {
        [JsonProperty("tomb")] 
        public int Tomb { get; set; }

        [JsonProperty("pande")] 
        public int Pande { get; set; }

        [JsonProperty("improve")] 
        public int Improve { get; set; }

        [JsonProperty("objectImprove")] 
        public int ObjectImprove { get; set; }

        [JsonProperty("lighthouse")] 
        public int Lighthouse { get; set; }

        [JsonProperty("campItems")] 
        public int CampItems { get; set; }

        [JsonProperty("zombieVest")] 
        public int ZombieVest { get; set; }

        [JsonProperty("zombieNoVest")] 
        public int ZombieNoVest { get; set; }

        [JsonProperty("night")] 
        public int Night { get; set; }

        [JsonProperty("devastated")] 
        public int Devastated { get; set; }

        [JsonProperty("distChances")] 
        public List<int> DistChances { get; set; }

        [JsonProperty("crowdChances")] 
        public List<int> CrowdChances { get; set; }

        [JsonProperty("pandaProCamperByAlreadyCamped")]
        public List<int> PandaProCamperByAlreadyCamped { get; set; }

        [JsonProperty("pandaNoProCamperByAlreadyCamped")]
        public List<int> PandaNoProCamperByAlreadyCamped { get; set; }

        [JsonProperty("normalProCamperByAlreadyCamped")]
        public List<int> NormalProCamperByAlreadyCamped { get; set; }

        [JsonProperty("normalNoProCamperByAlreadyCamped")]
        public List<int> NormalNoProCamperByAlreadyCamped { get; set; }
    }
}