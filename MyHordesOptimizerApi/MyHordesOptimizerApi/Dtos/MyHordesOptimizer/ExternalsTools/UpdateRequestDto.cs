using Newtonsoft.Json;
using System.Collections.Generic;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools
{
    public class UpdateRequestDto
    {
        [JsonProperty("tools")]
        public UpdateRequestToolsDetailsDto Tools { get; set; }
        [JsonProperty("cell")]
        public UpdateCellInfoDto Cell { get; set; }
        [JsonProperty("bags")]
        public List<UpdateBagDto> Bags { get; set; }
        [JsonProperty("townDetails")]
        public UpdateTownDetailsDto TownDetails { get; set; }
    }

    public class UpdateRequestToolsDetailsDto
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
