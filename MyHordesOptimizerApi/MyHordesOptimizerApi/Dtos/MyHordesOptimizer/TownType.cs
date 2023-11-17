using System.ComponentModel;
using System.Runtime.Serialization;
using Newtonsoft.Json;
using Newtonsoft.Json.Converters;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer
{
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
