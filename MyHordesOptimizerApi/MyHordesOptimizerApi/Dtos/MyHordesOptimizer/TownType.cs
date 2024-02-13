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
        [Description("RNE")]
        [EnumMember(Value = "RNE")]
        Rne,
        [Description("PANDE")]
        [EnumMember(Value = "PANDE")]
        Pande,
        [Description("RE")]
        [EnumMember(Value = "RE")]
        Re
    }
}
