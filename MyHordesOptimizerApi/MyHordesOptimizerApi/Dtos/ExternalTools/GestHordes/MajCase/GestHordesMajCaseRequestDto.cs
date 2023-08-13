using Newtonsoft.Json;
using System.Collections.Generic;

namespace MyHordesOptimizerApi.Dtos.ExternalTools.GestHordes.MajCase
{
    public class GestHordesMajCaseRequestDto
    {
        public GestHordesMajCaseRequestDto()
        {
            Items = new List<GestHordesMajCaseItemDto>();
        }

        [JsonProperty("userKey")]
        public string UserKey { get; set; }

        [JsonProperty("idMap")]
        public int IdMap { get; set; }

        [JsonProperty("x")]
        public int X { get; set; }

        [JsonProperty("y")]
        public int Y { get; set; }

        [JsonProperty("nbrZombie")]
        public int NbrZombie { get; set; }

        [JsonProperty("epuise")]
        public bool Epuise { get; set; }

        [JsonProperty("items")]
        public List<GestHordesMajCaseItemDto> Items { get; set; }
    }
}
