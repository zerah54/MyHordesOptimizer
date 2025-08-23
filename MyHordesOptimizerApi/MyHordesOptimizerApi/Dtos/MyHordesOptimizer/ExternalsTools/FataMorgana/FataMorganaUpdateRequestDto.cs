using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.Bags;
using MyHordesOptimizerApi.Models;
using Newtonsoft.Json;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.FataMorgana
{
    public class FataMorganaUpdateRequestDto
    {
        [JsonProperty("accessKey")]
        [JsonPropertyName("accessKey")]
        public string AccessKey { get; set; }

        [JsonProperty("userKey")]
        [JsonPropertyName("userKey")]
        public string UserKey { get; set; }

        [JsonProperty("mapId")]
        [JsonPropertyName("mapId")]
        public int MapId { get; set; }

        [JsonProperty("userId")]
        [JsonPropertyName("userId")]
        public int UserId { get; set; }

        [JsonProperty("x")]
        [JsonPropertyName("x")]
        public int X { get; set; }

        [JsonProperty("y")]
        [JsonPropertyName("y")]
        public int Y { get; set; }

        [JsonProperty("nbrKill")]
        [JsonPropertyName("nbrKill")]
        public int? NbrKill { get; set; }

        [JsonProperty("nbrZombie")]
        [JsonPropertyName("nbrZombie")]
        public int? NbrZombie { get; set; }

        [JsonProperty("zoneDepleted")]
        [JsonPropertyName("zoneDepleted")]
        public bool? ZoneDepleted { get; set; }

        [JsonProperty("scoutRadar")]
        [JsonPropertyName("scoutRadar")]
        public FataMorganaScoutRadarDto? ScoutRadar { get; set; }

        [JsonProperty("scavRadar")]
        [JsonPropertyName("scavRadar")]
        public FataMorganaScavRadarDto? ScavRadar { get; set; }

        [JsonProperty("playerList")]
        [JsonPropertyName("playerList")]
        public List<int>? PlayerList { get; set; }

        [JsonProperty("items")]
        [JsonPropertyName("items")]
        public List<UpdateObjectDto>? Items { get; set; }
    }
}
