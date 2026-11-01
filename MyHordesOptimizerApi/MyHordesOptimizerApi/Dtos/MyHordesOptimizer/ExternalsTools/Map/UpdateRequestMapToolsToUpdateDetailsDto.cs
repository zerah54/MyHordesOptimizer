using Newtonsoft.Json;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.Map
{
    public class UpdateRequestMapToolsToUpdateDetailsDto
    {
        private const string API = "api";
        private const string None = "none";
        private const string Cell = "cell";

        [JsonProperty("IsFataMorgana")]
        public string IsFataMorgana { get; set; } = null!;
        [JsonProperty("IsBigBrothHordes")]
        public string IsBigBrothHordes { get; set; } = null!;
        [JsonProperty("IsGestHordes")]
        public string IsGestHordes { get; set; } = null!;
        [JsonProperty("IsMyHordesOptimizer")]
        public string IsMyHordesOptimizer { get; set; } = null!;
        /// <summary>Absent chez les addons antérieurs à ZenHordes (donc nullable, sinon la validation les refuse). « cell » ou « none » : ZenHordes ne reçoit que ce que l'addon lui destine dans <c>ZenHordesCell</c>.</summary>
        [JsonProperty("IsZenHordes")]
        public string? IsZenHordes { get; set; }


        public static bool IsApi(string param)
        {
            return API == param;
        }

        public static bool IsNone(string param)
        {
            return None == param;
        }

        public static bool IsCell(string param)
        {
            return Cell == param;
        }
    }
}
