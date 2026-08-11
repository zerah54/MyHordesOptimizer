using System;
using System.Collections.Generic;
using Newtonsoft.Json;

namespace MyHordesOptimizerApi.Data.Items
{
    /// <summary>
    /// Contraintes ("meta") et effets ("result") d'une action, tels qu'extraits de
    /// <c>actions.json</c> — exploités par <see cref="MyHordesOptimizerApi.MappingProfiles.Items.ItemOpenerResolver"/>
    /// pour dériver mécaniquement l'outil requis, le coût et la chance de réussite d'une ouverture.
    /// </summary>
    public class MyHordesActionsCodeModel
    {
        [JsonProperty("meta")]
        public List<string> Meta { get; set; } = new List<string>();

        [JsonProperty("result")]
        [JsonConverter(typeof(ActionResultConverter))]
        public List<object> Result { get; set; } = new List<object>();
    }

    /// <summary>
    /// Quelques actions sans rapport avec l'ouverture (ex. <c>load_lpointer</c>,
    /// <c>play_soccer_1</c>) sérialisent "result" comme un objet JSON (artefact d'un tableau PHP
    /// à clés mixtes), pas un tableau. Sans incidence sur cette fonctionnalité — mais qui ferait
    /// sinon planter la désérialisation de tout le fichier. On les ignore (liste vide) ; le
    /// cas normal (tableau) délègue au comportement par défaut de Newtonsoft, inchangé.
    /// </summary>
    public class ActionResultConverter : JsonConverter
    {
        public override bool CanConvert(Type objectType) => objectType == typeof(List<object>);

        public override bool CanWrite => false;

        public override object ReadJson(JsonReader reader, Type objectType, object existingValue, JsonSerializer serializer)
        {
            if (reader.TokenType == JsonToken.StartObject)
            {
                reader.Skip();
                return new List<object>();
            }

            return serializer.Deserialize<List<object>>(reader) ?? new List<object>();
        }

        public override void WriteJson(JsonWriter writer, object value, JsonSerializer serializer)
        {
            throw new NotSupportedException();
        }
    }
}
