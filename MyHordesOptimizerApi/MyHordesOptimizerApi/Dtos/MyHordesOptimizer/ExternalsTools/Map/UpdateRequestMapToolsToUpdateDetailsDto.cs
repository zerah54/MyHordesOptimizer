using Newtonsoft.Json;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.Map
{
    public class UpdateRequestMapToolsToUpdateDetailsDto
    {
        private const string API = "api";
        private const string None = "none";
        private const string Cell = "cell";

        [JsonProperty("IsFataMorgana")]
        public string IsFataMorgana { get; set; }
        [JsonProperty("IsBigBrothHordes")]
        public string IsBigBrothHordes { get; set; }
        [JsonProperty("IsGestHordes")]
        public string IsGestHordes { get; set; }


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
