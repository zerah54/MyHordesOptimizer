using System.Collections.Generic;
using Newtonsoft.Json;

namespace MyHordesOptimizerApi.Dtos.MyHordes
{
    public class MyHordesCadaver
    {
        [JsonProperty("id")]
        public int Id { get; set; }

        [JsonProperty("name")]
        public string Name { get; set; }

        [JsonProperty("avatar")]
        public string Avatar { get; set; }

        [JsonProperty("survival")]
        public int Survival { get; set; }

        [JsonProperty("score")]
        public int Score { get; set; }

        [JsonProperty("dtype")]
        public int Dtype { get; set; }

        [JsonProperty("msg")]
        public string Msg { get; set; }

        [JsonProperty("comment")]
        public string Comment { get; set; }

        [JsonProperty("cleanup")]
        public MyHordesCleanup Cleanup { get; set; }

        // Pictos obtenus par ce citoyen DANS cette ville, indexés par idPicto.
        [JsonProperty("rewards")]
        [JsonConverter(typeof(CadaverRewardsConverter))]
        public IDictionary<string, MyHordesCadaverReward> Rewards { get; set; }
    }
}
