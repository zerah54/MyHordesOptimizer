using Newtonsoft.Json;

namespace MyHordesOptimizerApi.Dtos.MyHordes
{
    public class MyHordesDefense
    {
        [JsonProperty("total")]
        public int Total { get; set; }

        [JsonProperty("base")]
        public int Base { get; set; }

        [JsonProperty("buildings")]
        public int Buildings { get; set; }

        [JsonProperty("upgrades")]
        public int Upgrades { get; set; }

        [JsonProperty("items")]
        public int Items { get; set; }

        [JsonProperty("itemsMul")]
        public double ItemsMul { get; set; }

        [JsonProperty("citizenHomes")]
        public int CitizenHomes { get; set; }

        [JsonProperty("citizenGuardians")]
        public int CitizenGuardians { get; set; }

        [JsonProperty("watchmen")]
        public int Watchmen { get; set; }

        [JsonProperty("souls")]
        public int Souls { get; set; }

        [JsonProperty("temp")]
        public int Temp { get; set; }

        [JsonProperty("cadavers")]
        public int Cadavers { get; set; }

        [JsonProperty("guardiansInfos")]
        public MyHordesGuardiansInfos GuardiansInfos { get; set; }
    }
}
