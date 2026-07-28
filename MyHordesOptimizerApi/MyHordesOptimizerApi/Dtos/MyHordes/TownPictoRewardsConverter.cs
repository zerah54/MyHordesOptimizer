using System;
using System.Collections.Generic;
using System.Linq;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace MyHordesOptimizerApi.Dtos.MyHordes
{
    /// <summary>
    /// Rend le champ <c>rewards</c> de <see cref="MyHordesCitizenRankingDto"/> désérialisable dans
    /// les deux formes que MyHordes peut émettre.
    /// </summary>
    /// <remarks>
    /// MyHordes construit <c>rewards</c> comme un tableau PHP indexé par idPicto. <c>json_encode</c>
    /// le sérialise en objet (<c>{"12": {...}}</c>) quand il est peuplé, mais en TABLEAU VIDE
    /// (<c>[]</c>) quand le citoyen n'a aucun picto — sans ce convertisseur, un seul citoyen sans
    /// picto ferait échouer la désérialisation en dictionnaire, et avec elle toute la
    /// synchronisation de la ville.
    /// </remarks>
    public class TownPictoRewardsConverter : JsonConverter<IDictionary<string, MyHordesTownPictoDto>>
    {
        public override bool CanWrite => false;

        public override IDictionary<string, MyHordesTownPictoDto> ReadJson(JsonReader reader,
            Type objectType,
            IDictionary<string, MyHordesTownPictoDto> existingValue,
            bool hasExistingValue,
            JsonSerializer serializer)
        {
            var token = JToken.Load(reader);
            if (token.Type == JTokenType.Array)
            {
                // L'id sert de clé : une entrée sans id est écartée plutôt que de se retrouver
                // sous la clé vide, où elle écraserait toute autre entrée sans id.
                return token.ToObject<List<MyHordesTownPictoDto>>(serializer)?
                    .Where(reward => reward.Id.HasValue)
                    .ToDictionary(reward => reward.Id.Value.ToString(), reward => reward)
                    ?? new Dictionary<string, MyHordesTownPictoDto>();
            }
            if (token.Type == JTokenType.Object)
            {
                return token.ToObject<Dictionary<string, MyHordesTownPictoDto>>(serializer);
            }
            return new Dictionary<string, MyHordesTownPictoDto>();
        }

        public override void WriteJson(JsonWriter writer,
            IDictionary<string, MyHordesTownPictoDto> value,
            JsonSerializer serializer)
        {
            throw new NotSupportedException();
        }
    }
}
