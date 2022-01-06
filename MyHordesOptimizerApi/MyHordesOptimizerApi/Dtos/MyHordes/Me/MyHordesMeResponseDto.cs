using Newtonsoft.Json;

namespace MyHordesOptimizerApi.Dtos.MyHordes.Me
{
    public class MyHordesMeResponseDto
    {
        [JsonProperty("id")]
        public int Id { get; set; }
        [JsonProperty("map")]
        public MyHordesMap Map { get; set; }
    }
}
