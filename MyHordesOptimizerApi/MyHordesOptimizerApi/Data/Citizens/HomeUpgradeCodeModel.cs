using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;

namespace MyHordesOptimizerApi.Data.Citizens
{
    public class HomeUpgradeCodeModel
    {
        [JsonProperty("name")] public string Name { get; set; } = "";
        [JsonProperty("label")] public string Label { get; set; } = "";
        [JsonProperty("desc")] public string Desc { get; set; } = "";

        /// <summary>Clé = niveau d'amélioration ("1", "2"…).</summary>
        [JsonProperty("levels")] public Dictionary<string, HomeUpgradeLevelCodeModel> Levels { get; set; } = new();
    }

    [JsonConverter(typeof(HomeUpgradeLevelConverter))]
    public class HomeUpgradeLevelCodeModel
    {
        public int Ap { get; set; }
        public Dictionary<string, int> Resources { get; set; } = new();
    }

    /// <summary>Le fichier porte chaque niveau sous la forme <c>[ap, ressources]</c>.</summary>
    public class HomeUpgradeLevelConverter : JsonConverter<HomeUpgradeLevelCodeModel>
    {
        public override HomeUpgradeLevelCodeModel ReadJson(JsonReader reader, Type objectType, HomeUpgradeLevelCodeModel? existingValue, bool hasExistingValue, JsonSerializer serializer)
        {
            var array = JArray.Load(reader);
            var resources = array.Count > 1 && array[1].Type == JTokenType.Object
                ? array[1].ToObject<Dictionary<string, int>>() ?? new Dictionary<string, int>()
                : new Dictionary<string, int>();
            return new HomeUpgradeLevelCodeModel { Ap = array.Count > 0 ? array[0].Value<int>() : 0, Resources = resources };
        }

        public override void WriteJson(JsonWriter writer, HomeUpgradeLevelCodeModel? value, JsonSerializer serializer)
        {
            new JArray(value?.Ap ?? 0, JObject.FromObject(value?.Resources ?? new Dictionary<string, int>())).WriteTo(writer);
        }
    }
}
