using System;
using System.Collections.Generic;
using System.Linq;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace MyHordesOptimizerApi.Dtos.MyHordes
{
    // MyHordes construit `rewards` comme un tableau PHP indexé par idPicto. json_encode le
    // sérialise en objet ({"12": {...}}) quand il est peuplé, mais en TABLEAU VIDE ([]) quand
    // le citoyen n'a aucun picto — un cadavre sans picto ferait alors échouer la
    // désérialisation en dictionnaire, et avec elle toute la synchronisation de la ville.
    public class CadaverRewardsConverter : JsonConverter<IDictionary<string, MyHordesCadaverReward>>
    {
        public override bool CanWrite => false;

        public override IDictionary<string, MyHordesCadaverReward> ReadJson(JsonReader reader,
            Type objectType,
            IDictionary<string, MyHordesCadaverReward> existingValue,
            bool hasExistingValue,
            JsonSerializer serializer)
        {
            var token = JToken.Load(reader);
            if (token.Type == JTokenType.Array)
            {
                return token.ToObject<List<MyHordesCadaverReward>>(serializer)?
                    .ToDictionary(reward => reward.Id.ToString(), reward => reward)
                    ?? new Dictionary<string, MyHordesCadaverReward>();
            }
            if (token.Type == JTokenType.Object)
            {
                return token.ToObject<Dictionary<string, MyHordesCadaverReward>>(serializer);
            }
            return new Dictionary<string, MyHordesCadaverReward>();
        }

        public override void WriteJson(JsonWriter writer,
            IDictionary<string, MyHordesCadaverReward> value,
            JsonSerializer serializer)
        {
            throw new NotSupportedException();
        }
    }
}
