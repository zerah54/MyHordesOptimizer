using Newtonsoft.Json;
using System.Collections.Generic;

namespace MyHordesOptimizerApi.Dtos.MyHordes.Me
{
    public class MyHordesMeResponseDto
    {
        [JsonProperty("id")]
        public int Id { get; set; }

        [JsonProperty("name")]
        public string Name { get; set; }

        [JsonProperty("isGhost")]
        public bool IsGhost { get; set; }

        [JsonProperty("locale")]
        public string Locale { get; set; }

        [JsonProperty("twinId")]
        public object TwinId { get; set; }

        [JsonProperty("mapId")]
        public int MapId { get; set; }

        [JsonProperty("map")]
        public MyHordesMap Map { get; set; }

        [JsonProperty("homeMessage")]
        public object HomeMessage { get; set; }

        [JsonProperty("avatar")]
        public string Avatar { get; set; }

        [JsonProperty("hero")]
        public bool Hero { get; set; }

        [JsonProperty("job")]
        public MyHordesJob Job { get; set; }

        [JsonProperty("dead")]
        public bool Dead { get; set; }

        [JsonProperty("out")]
        public bool Out { get; set; }

        [JsonProperty("baseDef")]
        public int BaseDef { get; set; }

        [JsonProperty("ban")]
        public bool Ban { get; set; }

        [JsonProperty("x")]
        public int X { get; set; }

        [JsonProperty("y")]
        public int Y { get; set; }

        [JsonProperty("rewards")]
        public List<MyHordesReward> Rewards { get; set; }
    }
}
