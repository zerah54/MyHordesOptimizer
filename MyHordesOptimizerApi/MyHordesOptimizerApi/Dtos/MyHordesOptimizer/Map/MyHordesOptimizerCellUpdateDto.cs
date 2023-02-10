using Newtonsoft.Json;
using System.Collections.Generic;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Map
{
    public class MyHordesOptimizerCellUpdateDto
    {
        [JsonProperty("isDryed")]
        public bool IsDryed { get; set; }

        [JsonProperty("nbZombie")]
        public int NbZombie { get; set; }

        [JsonProperty("nbZombieKilled")]
        public int NbZombieKilled { get; set; }

        [JsonProperty("isRuinCamped")]
        public bool? IsRuinCamped { get; set; }

        [JsonProperty("items")]
        public List<CellItemDto> Items { get; set; }

        [JsonProperty("citizens")]
        public List<int> Citizens { get; set; }

        [JsonProperty("note")]
        public string Note { get; set; }
        [JsonProperty("x")]
        public int X { get; set; }
        [JsonProperty("y")]
        public int Y { get; set; }
    }
}
