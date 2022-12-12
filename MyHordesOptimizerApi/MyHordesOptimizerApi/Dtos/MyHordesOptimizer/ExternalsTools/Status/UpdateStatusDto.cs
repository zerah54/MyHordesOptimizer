using Newtonsoft.Json;
using System.Collections.Generic;
using System.ComponentModel;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.Status
{
    public class UpdateStatusDto
    {
        [JsonProperty("toolsToUpdate")]
        public UpdateRequestToolsToUpdateDetailsDto ToolsToUpdate { get; set; }
        [JsonProperty("values")]
        public List<string> Values { get; set; }
    }

    public enum StatusValue
    {
        [Description("addict")]
        Addict,
        [Description("camper")]
        Camper,
        [Description("clean")]
        CleanBody,
        [Description("drugged")]
        Drugged,
        [Description("drunk")]
        Drunk,
        [Description("ghoul")]
        Ghoul,
        [Description("hasdrunk")]
        Quenched,
        [Description("haseaten")]
        Sated,
        [Description("healed")]
        Convalescent,
        [Description("hsurvive")]
        CheatingDeathActive,
        [Description("hungover")]
        HangOver,
        [Description("immune")]
        Immune,
        [Description("infection")]
        Infected,
        [Description("terror")]
        Terrorised,
        [Description("thirst1")]
        Thirsty,
        [Description("thisrt2")]
        Desy,
        [Description("tired")]
        Tired,
        [Description("wound1")]
        HeadWounded,
        [Description("wound2")]
        HandWounded,
        [Description("wound3")]
        ArmWounded,
        [Description("wound4")]
        LegWounded,
        [Description("wound5")]
        EyeWounded,
        [Description("wound6")]
        FootWounded
    }
}
