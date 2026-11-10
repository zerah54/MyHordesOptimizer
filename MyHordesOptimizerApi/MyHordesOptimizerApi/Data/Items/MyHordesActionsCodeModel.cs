using System;
using System.Collections.Generic;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace MyHordesOptimizerApi.Data.Items
{
    /// <summary>
    /// Contraintes ("meta") et effets ("result") d'une action, tels qu'extraits de
    /// <c>actions.json</c> — exploités par <see cref="MyHordesOptimizerApi.MappingProfiles.Items.ItemOpenerResolver"/>
    /// pour dériver mécaniquement l'outil requis, le coût et la chance de réussite d'une ouverture.
    /// </summary>
    public class MyHordesActionsCodeModel
    {
        [JsonProperty("label")]
        public string? Label { get; set; }

        [JsonProperty("meta")]
        public List<string> Meta { get; set; } = new List<string>();

        [JsonProperty("result")]
        [JsonConverter(typeof(ActionResultConverter))]
        public List<object> Result { get; set; } = new List<object>();
    }

    /// <summary>
    /// Quelques actions sérialisent "result" comme un objet JSON (artefact d'un tableau PHP à clés
    /// mixtes, ex. <c>{"0": "kill_1_zombie_s", "chances": {...}}</c>), pas un tableau. L'objet est
    /// aplati en liste de ses valeurs dans l'ordre des clés ; les chaînes restent des <c>string</c>,
    /// les autres jetons des <c>JToken</c> (<c>JObject</c>…), comme pour la forme tableau.
    /// </summary>
    public class ActionResultConverter : JsonConverter
    {
        public override bool CanConvert(Type objectType) => objectType == typeof(List<object>);

        public override bool CanWrite => false;

        public override object? ReadJson(JsonReader reader, Type objectType, object? existingValue, JsonSerializer serializer)
        {
            if (reader.TokenType == JsonToken.StartObject)
            {
                var result = new List<object>();
                foreach (JProperty property in JObject.Load(reader).Properties())
                {
                    result.Add(property.Value is JValue { Type: JTokenType.String } value ? value.Value! : property.Value);
                }
                return result;
            }

            return serializer.Deserialize<List<object>>(reader) ?? new List<object>();
        }

        public override void WriteJson(JsonWriter writer, object? value, JsonSerializer serializer)
        {
            throw new NotSupportedException();
        }
    }
}
