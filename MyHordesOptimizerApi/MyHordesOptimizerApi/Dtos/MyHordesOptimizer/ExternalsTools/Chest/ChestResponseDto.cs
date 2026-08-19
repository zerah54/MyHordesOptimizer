using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools;
using MyHordesOptimizerApi.Extensions;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.Chest
{
    public class ChestResponseDto
    {
        public string MhoStatus { get; set; }
        public string GestHordesStatus { get; set; }

        public ChestResponseDto(UpdateRequestDto updateRequestDto)
        {
            if (updateRequestDto.Chest != null && updateRequestDto.Chest.ToolsToUpdate.IsMyHordesOptimizer)
            {
                MhoStatus = ExternalToolsUpdateResponseType.Ok.GetDescription();
            }
            else
            {
                MhoStatus = ExternalToolsUpdateResponseType.NotActivated.GetDescription();
            }
            // Coffre = MHO seulement, jamais de miroir GestHordes.
            GestHordesStatus = ExternalToolsUpdateResponseType.NotActivated.GetDescription();
        }
    }
}
