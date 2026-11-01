using Newtonsoft.Json;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.Map
{
    public class UpdateRequestMapDto
    {
        [JsonProperty("cell")]
        public UpdateCellInfoDto? Cell { get; set; }
        /// <summary>Case relevée pour ZenHordes seul : séparée de <c>Cell</c>, que Fata, GH et MHO lisent quel que soit leur mode.</summary>
        [JsonProperty("zenHordesCell")]
        public UpdateCellInfoDto? ZenHordesCell { get; set; }
        /// <summary>Marqueurs de métiers relevés pour Gest'Hordes seul, envoyés avec sa mise à jour /majScript.</summary>
        [JsonProperty("gestHordesCell")]
        public UpdateCellInfoDto? GestHordesCell { get; set; }
        [JsonProperty("toolsToUpdate")]
        public UpdateRequestMapToolsToUpdateDetailsDto ToolsToUpdate { get; set; } = null!;
    }
}
