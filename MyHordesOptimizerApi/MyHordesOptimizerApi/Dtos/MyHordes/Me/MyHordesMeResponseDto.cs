using Newtonsoft.Json;

namespace MyHordesOptimizerApi.Dtos.MyHordes.Me
{
    public class MyHordesMeResponseDto
    {
        [JsonProperty("map")]
        public MyHordesMap Map { get; set; }
    }
}
