using Newtonsoft.Json.Converters;
using System.ComponentModel;
using System.Runtime.Serialization;
using System.Text.Json.Serialization;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer
{
    [Newtonsoft.Json.JsonConverter(typeof(JsonStringEnumConverter))]
    [JsonConverter(typeof(StringEnumConverter))]
    public enum TownType
    {
        // Le nom des membres doit correspondre exactement à la valeur attendue par le front (cf.
        // _types.ts : TownTypeId = 'RNE' | 'PANDE' | 'RE' | 'CUSTOM') : le JsonStringEnumConverter
        // global (Program.cs) sérialise sur le nom du membre, pas sur [EnumMember]/[Description].
        [Description("RNE")]
        [EnumMember(Value = "RNE")]
        RNE,
        [Description("PANDE")]
        [EnumMember(Value = "PANDE")]
        PANDE,
        [Description("RE")]
        [EnumMember(Value = "RE")]
        RE,
        [Description("CUSTOM")]
        [EnumMember(Value = "CUSTOM")]
        CUSTOM
    }
}