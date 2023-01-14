using Newtonsoft.Json;

namespace MyHordesOptimizerApi.Dtos.MyHordes
{
    public class MyHordesGuardiansInfos
    {
        [JsonProperty("gardians")]
        public int Gardians { get; set; }

        [JsonProperty("def")]
        public int Def { get; set; }
    }
}
