using System;
using System.Collections.Generic;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace MyHordesOptimizerApi.Data.Items
{
    /// <summary>
    /// Catalogue des effets d'action (<c>meta_results</c> de la chaîne de fixtures MyHordes),
    /// projeté vers <c>Data/Items/meta-results.json</c> par <c>Scripts/Extractor</c>.
    /// </summary>
    [JsonConverter(typeof(MetaResultEntryConverter))]
    public class MyHordesMetaResultCodeModel
    {
        public string Identifier { get; set; } = null!;
        public List<MetaResultAtom> AtomList { get; set; } = new();
    }

    /// <summary>
    /// Une entrée (<c>do_nothing</c>) sérialise sa valeur comme un tableau vide au lieu d'un objet
    /// — artefact PHP identique dans son principe à <see cref="ActionResultConverter"/> pour
    /// <c>actions.json</c>. Sans ce convertisseur, elle ferait planter la désérialisation de tout
    /// <c>meta-results.json</c>.
    /// </summary>
    public class MetaResultEntryConverter : JsonConverter
    {
        public override bool CanConvert(Type objectType) => objectType == typeof(MyHordesMetaResultCodeModel);

        public override bool CanWrite => false;

        public override object ReadJson(JsonReader reader, Type objectType, object? existingValue, JsonSerializer serializer)
        {
            if (reader.TokenType == JsonToken.StartArray)
            {
                reader.Skip();
                return new MyHordesMetaResultCodeModel();
            }

            var jObject = JObject.Load(reader);

            return new MyHordesMetaResultCodeModel
            {
                Identifier = jObject["identifier"]?.Value<string>() ?? string.Empty,
                AtomList = jObject["atomList"]?.ToObject<List<MetaResultAtom>>(serializer) ?? new List<MetaResultAtom>(),
            };
        }

        public override void WriteJson(JsonWriter writer, object? value, JsonSerializer serializer)
        {
            throw new NotSupportedException();
        }
    }

    /// <summary>
    /// Un atome d'effet hétérogène. <see cref="Payload"/> reste un <see cref="JToken"/> non décodé
    /// tant que <see cref="Atom"/> n'est pas reconnu — voir <see cref="MetaResultAtomExtensions"/>.
    /// Typé en <see cref="JToken"/> et non <see cref="JObject"/> : au moins un atome non décodé
    /// (<c>RolePlayTextEffect</c>) sérialise <c>"payload": []</c> plutôt qu'un objet.
    /// </summary>
    public class MetaResultAtom
    {
        public string Atom { get; set; } = null!;
        public JToken? Payload { get; set; }
    }

    /// <summary>
    /// Effet sur un point (PA/PE/...) ou un statut. Correspond à
    /// <c>MyHordes\Fixtures\DTO\Actions\Atoms\Effect\StatusEffect</c> côté jeu.
    /// </summary>
    public class StatusEffectPayload
    {
        public PointType? PointType { get; set; }
        public RelativeMaxPoint? PointRelativeToMax { get; set; }
        public int? PointValue { get; set; }
        public int? PointCapAt { get; set; }
        public int? PointExceedMax { get; set; }
        public string? StatusTo { get; set; }
        public string? StatusFrom { get; set; }
        public string? Role { get; set; }
        public bool? RoleIsAdded { get; set; }
    }

    /// <summary>Copie de <c>App\Enum\ActionHandler\PointType</c> (valeurs entières identiques).</summary>
    public enum PointType
    {
        Ap = 1,
        Cp = 2,
        Mp = 3,
        Sp = 4,
    }

    /// <summary>Copie de <c>App\Enum\ActionHandler\RelativeMaxPoint</c> (valeurs entières identiques).</summary>
    public enum RelativeMaxPoint
    {
        Absolute = 0,
        RelativeToMax = 1,
        RelativeToExtensionMax = 2,
    }

    /// <summary>
    /// Devenir d'un objet lors d'une transformation catapulte. Correspond à
    /// <c>MyHordes\Fixtures\DTO\Actions\Atoms\Effect\ItemEffect</c> côté jeu — seuls les champs
    /// utiles à la résolution catapulte sont décodés.
    /// </summary>
    public class ItemEffectPayload
    {
        public string? MorphSourceType { get; set; }
        public bool? BreakSource { get; set; }
    }

    /// <summary>
    /// Effet sur une zone (zombies tués ou répulsion) lors d'un impact catapulte. Correspond à
    /// <c>MyHordes\Fixtures\DTO\Actions\Atoms\Effect\ZoneEffect</c> côté jeu.
    /// </summary>
    public class ZoneEffectPayload
    {
        public int? ZombieMin { get; set; }
        public int? ZombieMax { get; set; }
        public int? ZombieKillRange { get; set; }
        public int? Escape { get; set; }
        public int? EscapeRange { get; set; }
    }

    public static class MetaResultAtomExtensions
    {
        public const string StatusEffectAtomType = "MyHordes\\Fixtures\\DTO\\Actions\\Atoms\\Effect\\StatusEffect";
        public const string ItemEffectAtomType = "MyHordes\\Fixtures\\DTO\\Actions\\Atoms\\Effect\\ItemEffect";
        public const string ZoneEffectAtomType = "MyHordes\\Fixtures\\DTO\\Actions\\Atoms\\Effect\\ZoneEffect";

        /// <summary>
        /// Atomes rencontrés dans meta-results.json volontairement non décodés en v1 (relevé le
        /// 2026-08-14 : 9 types au total, dont StatusEffect). Un type absent de cette liste et de
        /// <see cref="StatusEffectAtomType"/> fait échouer <c>MetaResultAtomCompletenessTests</c>
        /// plutôt que d'être ignoré en silence.
        /// </summary>
        public static readonly IReadOnlySet<string> KnownIgnoredAtomTypes = new HashSet<string>
        {
            "MyHordes\\Fixtures\\DTO\\Actions\\Atoms\\Effect\\CustomEffect",
            "MyHordes\\Fixtures\\DTO\\Actions\\Atoms\\Effect\\HomeEffect",
            "MyHordes\\Fixtures\\DTO\\Actions\\Atoms\\Effect\\MessageEffect",
            "MyHordes\\Fixtures\\DTO\\Actions\\Atoms\\Effect\\PictoEffect",
            "MyHordes\\Fixtures\\DTO\\Actions\\Atoms\\Effect\\RolePlayTextEffect",
            "MyHordes\\Fixtures\\DTO\\Actions\\Atoms\\Effect\\TownEffect",
        };

        public static bool IsStatusEffect(this MetaResultAtom atom) => atom.Atom == StatusEffectAtomType;

        public static StatusEffectPayload? AsStatusEffect(this MetaResultAtom atom) =>
            atom.IsStatusEffect() && atom.Payload is JObject payload
                ? payload.ToObject<StatusEffectPayload>()
                : null;

        public static bool IsItemEffect(this MetaResultAtom atom) => atom.Atom == ItemEffectAtomType;

        public static ItemEffectPayload? AsItemEffect(this MetaResultAtom atom) =>
            atom.IsItemEffect() && atom.Payload is JObject payload
                ? payload.ToObject<ItemEffectPayload>()
                : null;

        public static bool IsZoneEffect(this MetaResultAtom atom) => atom.Atom == ZoneEffectAtomType;

        public static ZoneEffectPayload? AsZoneEffect(this MetaResultAtom atom) =>
            atom.IsZoneEffect() && atom.Payload is JObject payload
                ? payload.ToObject<ZoneEffectPayload>()
                : null;
    }
}
