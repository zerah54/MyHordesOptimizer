using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System;

namespace MyHordesOptimizerApi.Dtos.MyHordes
{
    /// <summary>
    /// Désérialise une branche que MyHordes émet soit en objet, soit en TABLEAU VIDE.
    /// </summary>
    /// <remarks>
    /// <para>
    /// Côté MyHordes ces branches sont construites comme des tableaux PHP associatifs, remplis
    /// champ par champ. Quand aucun champ n'est renseigné — parce qu'ils sont tous conditionnels et
    /// qu'aucune condition n'est remplie — le tableau reste vide, et <c>json_encode</c> le sérialise
    /// en <c>[]</c> et non en <c>{}</c>. Sans ce convertisseur, Newtonsoft lève une
    /// <c>JsonSerializationException</c> en tentant de lire un tableau dans un objet.
    /// </para>
    /// <para>
    /// Le tableau vide est traduit en <c>null</c> : il signifie « MyHordes n'a rien à dire ici »,
    /// ce qui est exactement la sémantique d'une propriété absente.
    /// </para>
    /// <para>
    /// Branches concernées, toutes vérifiées dans <c>JSONv1Controller.php</c> :
    /// <c>zones.details</c> (ses trois champs sont conditionnels, donc vide pour presque toutes les
    /// cases), <c>city.estimations</c> et <c>city.estimationsNext</c> (trois sorties anticipées :
    /// pas d'estimation, seuil de tour de guet non atteint, pas de nuit suivante), et
    /// <c>city.upgrades</c> (vide s'il n'existe aucun bâtiment amélioré).
    /// </para>
    /// </remarks>
    public class EmptyPhpArrayConverter<T> : JsonConverter<T?> where T : class
    {
        public override bool CanWrite => false;

        public override T? ReadJson(JsonReader reader,
            Type objectType,
            T? existingValue,
            bool hasExistingValue,
            JsonSerializer serializer)
        {
            var token = JToken.Load(reader);
            return token.Type == JTokenType.Object
                ? token.ToObject<T>(serializer)
                : null;
        }

        public override void WriteJson(JsonWriter writer, T? value, JsonSerializer serializer)
        {
            throw new NotSupportedException();
        }
    }
}
