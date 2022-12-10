using Newtonsoft.Json;

namespace MyHordesOptimizerApi.Dtos.MyHordes
{
    public class MyHordesJob
    {
        [JsonProperty("id")]
        public int Id;

        [JsonProperty("uid")]
        public string Uid { get; set; }

        [JsonProperty("name")]
        public MyHordesLangString Name { get; set; }

        [JsonProperty("desc")]
        public MyHordesLangString Desc;
    }

}
