using System.ComponentModel;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Map
{
    public enum DirectionEnum
    {
        [Description("Norden")]
        North,
        [Description("Süden")]
        South,
        [Description("Osten")]
        Est,
        [Description("Westen")]
        West,
        [Description("Nordosten")]
        NorthEst,
        [Description("Nordwesten")]
        NorthWest,
        [Description("Südosten")]
        SouthEst,
        [Description("Südwesten")]
        SouthWest,
        All
    }
}
