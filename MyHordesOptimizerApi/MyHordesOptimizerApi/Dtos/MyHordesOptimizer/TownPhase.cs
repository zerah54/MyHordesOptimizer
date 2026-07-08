using Newtonsoft.Json.Converters;
using System.ComponentModel;
using System.Runtime.Serialization;
using System.Text.Json.Serialization;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer
{
    [Newtonsoft.Json.JsonConverter(typeof(JsonStringEnumConverter))]
    [JsonConverter(typeof(StringEnumConverter))]
    public enum TownPhase
    {
        // Le nom des membres doit correspondre exactement à la valeur attendue par le front (cf.
        // _types.ts : TownPhase = 'ALPHA' | 'BETA' | 'IMPORT' | 'NATIVE') : le JsonStringEnumConverter
        // global (Program.cs) sérialise sur le nom du membre, pas sur [EnumMember]/[Description].
        [Description("ALPHA")]
        [EnumMember(Value = "ALPHA")]
        ALPHA,
        [Description("BETA")]
        [EnumMember(Value = "BETA")]
        BETA,
        [Description("IMPORT")]
        [EnumMember(Value = "IMPORT")]
        IMPORT,
        [Description("NATIVE")]
        [EnumMember(Value = "NATIVE")]
        NATIVE
    }
}