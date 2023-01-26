using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using Newtonsoft.Json;
using System.Collections.Generic;

namespace MyHordesOptimizerApi.Dtos.MyHordes
{
    public class MyHordesMap
    {
        [JsonProperty("id")]
        public int Id { get; set; }

        [JsonProperty("date")]
        public string Date { get; set; }

        [JsonProperty("wid")]
        public int Wid { get; set; }

        [JsonProperty("hei")]
        public int Hei { get; set; }

        [JsonProperty("conspiracy")]
        public bool Conspiracy { get; set; }

        [JsonProperty("bonusPts")]
        public int BonusPts { get; set; }

        [JsonProperty("days")]
        public int Days { get; set; }

        [JsonProperty("custom")]
        public bool Custom { get; set; }

        [JsonProperty("zones")]
        public List<MyHordesZone> Zones { get; set; }

        [JsonProperty("citizens")]
        public List<MyHordesCitizen> Citizens { get; set; }

        [JsonProperty("city")]
        public MyHordesCity City { get; set; }

        [JsonProperty("cadavers")]
        public List<MyHordesCadaver> Cadavers { get; set; }

        [JsonProperty("expeditions")]
        public List<object> Expeditions { get; set; }

        [JsonProperty("season")]
        public int Season { get; set; }

        [JsonProperty("shaman")]
        public int Shaman { get; set; }

        [JsonProperty("guide")]
        public int Guide { get; set; }

        public LastUpdateInfo LastUpdateInfo { get; set; }
    }
}
