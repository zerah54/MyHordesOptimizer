using Newtonsoft.Json;

namespace MyHordesOptimizerApi.Data.Glossary
{
    public class GlossaryModel
    {
        [JsonProperty("word")] public string Word { get; set; }
        [JsonProperty("definition")] public string Definition { get; set; }
    }
}