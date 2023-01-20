using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System.Collections.Generic;

namespace MyHordesOptimizerApi.Dtos.MyHordes
{
    public class MyHordesCity
    {
        [JsonProperty("name")]
        public string Name { get; set; }

        [JsonProperty("water")]
        public int Water { get; set; }

        [JsonProperty("x")]
        public int X { get; set; }

        [JsonProperty("y")]
        public int Y { get; set; }

        [JsonProperty("door")]
        public bool Door { get; set; }

        [JsonProperty("chaos")]
        public bool Chaos { get; set; }

        [JsonProperty("hard")]
        public bool Hard { get; set; }

        [JsonProperty("devast")]
        public bool Devast { get; set; }

        [JsonProperty("chantiers")]
        public List<MyHordesChantier> Chantiers { get; set; }

        [JsonProperty("buildings")]
        public List<MyHordesBuilding> Buildings { get; set; }

        [JsonProperty("news")]
        public dynamic News { get; set; }

        [JsonProperty("defense")]
        public MyHordesDefense Defense { get; set; }

        [JsonProperty("upgrades")]
        public dynamic Upgrades { get; set; }

        [JsonProperty("estimations")]
        public dynamic Estimations { get; set; }

        [JsonProperty("estimationsNext")]
        public dynamic EstimationsNext { get; set; }

        [JsonProperty("bank")]
        public List<MyHordesBank> Bank { get; set; }
    }
}
