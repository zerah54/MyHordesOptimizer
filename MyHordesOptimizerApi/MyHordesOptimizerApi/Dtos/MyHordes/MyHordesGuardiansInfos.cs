using Newtonsoft.Json;

namespace MyHordesOptimizerApi.Dtos.MyHordes
{
    public class MyHordesGuardiansInfos
    {
        [JsonProperty("gardians")]
        public double Gardians { get; set; }

        [JsonProperty("def")]
        public int Def { get; set; }
    }
}
