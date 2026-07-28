using Newtonsoft.Json;
using System;

namespace MyHordesOptimizerApi.Dtos.MyHordes
{
    /// <summary>
    /// Lit l'avatar d'un joueur : une URL, ou <c>null</c> quand il n'en a pas.
    /// </summary>
    /// <remarks>
    /// <para>
    /// MyHordes n'est pas cohérent sur ce champ. Selon la branche qui le produit, un joueur sans
    /// avatar reçoit <c>null</c> (<c>getUserData</c>, qui n'écrit rien du tout) ou le BOOLÉEN
    /// <c>false</c> — <c>$media-&gt;getSource(200) ?: false</c> dans <c>getCadaversInformation</c>,
    /// et <c>$data['avatar'] = false</c> dans <c>getAuthorInformation</c>.
    /// </para>
    /// <para>
    /// Sans ce convertisseur, le booléen atterrit dans une propriété <c>string</c> et se retrouve
    /// stocké tel quel : la base contenait des avatars valant littéralement « false », que le site
    /// tentait ensuite de charger comme une URL.
    /// </para>
    /// <para>
    /// Un <c>false</c> signifie exactement la même chose qu'une absence : pas d'avatar. On le
    /// traduit donc en <c>null</c>, et non en chaîne vide — une chaîne vide serait une URL vide,
    /// c'est-à-dire encore une valeur.
    /// </para>
    /// </remarks>
    public class AvatarUrlConverter : JsonConverter<string?>
    {
        public override string? ReadJson(JsonReader reader, Type objectType, string? existingValue,
            bool hasExistingValue, JsonSerializer serializer)
        {
            switch (reader.TokenType)
            {
                case JsonToken.Null:
                    return null;
                case JsonToken.Boolean:
                    // `true` n'a pas plus de sens que `false` pour une URL : les deux valent « rien ».
                    return null;
                case JsonToken.String:
                    var valeur = reader.Value as string;
                    return string.IsNullOrWhiteSpace(valeur) ? null : valeur;
                default:
                    return reader.Value?.ToString();
            }
        }

        public override void WriteJson(JsonWriter writer, string? value, JsonSerializer serializer)
        {
            writer.WriteValue(value);
        }
    }
}
