using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;

namespace MyHordesOptimizerApi.Data.Citizens
{
    /// <summary>Un niveau de maison ; l'indice dans le fichier est le niveau (0 = lit de camp).</summary>
    public class HomeLevelCodeModel
    {
        [JsonProperty("label")] public string Label { get; set; } = "";
        [JsonProperty("icon")] public string Icon { get; set; } = "";
        [JsonProperty("def")] public int Def { get; set; }
        [JsonProperty("ap")] public int Ap { get; set; }
        [JsonProperty("ap_urbanism")] public int ApUrbanism { get; set; }

        [JsonProperty("resources")]
        [JsonConverter(typeof(PhpEmptyArrayDictionaryConverter))]
        public Dictionary<string, int> Resources { get; set; } = new();

        [JsonProperty("resources_urbanism")]
        [JsonConverter(typeof(PhpEmptyArrayDictionaryConverter))]
        public Dictionary<string, int> ResourcesUrbanism { get; set; } = new();

        /// <summary>Uid du chantier requis, ou null.</summary>
        [JsonProperty("building")] public string? Building { get; set; }
        [JsonProperty("upgrades")] public bool Upgrades { get; set; }
        [JsonProperty("theft")] public bool Theft { get; set; }
    }

    /// <summary>PHP sérialise un dictionnaire vide en <c>[]</c> : on lit alors un dictionnaire vide.</summary>
    public class PhpEmptyArrayDictionaryConverter : JsonConverter<Dictionary<string, int>>
    {
        public override Dictionary<string, int> ReadJson(JsonReader reader, Type objectType, Dictionary<string, int>? existingValue, bool hasExistingValue, JsonSerializer serializer)
        {
            var token = JToken.Load(reader);
            return token.Type == JTokenType.Object
                ? token.ToObject<Dictionary<string, int>>() ?? new Dictionary<string, int>()
                : new Dictionary<string, int>();
        }

        public override void WriteJson(JsonWriter writer, Dictionary<string, int>? value, JsonSerializer serializer)
        {
            serializer.Serialize(writer, value ?? new Dictionary<string, int>());
        }
    }
}
