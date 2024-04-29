using MyHordesOptimizerApi.Extensions;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.Bags
{
    public class DigsUpdateResponseDto
    {
        public string MhoStatus { get; set; }

        public DigsUpdateResponseDto(UpdateRequestDto updateRequestDto)
        {
            if(updateRequestDto.Bags != null && updateRequestDto.Bags.ToolsToUpdate.IsMyHordesOptimizer)
            {
                MhoStatus = ExternalToolsUpdateResponseType.Ok.GetDescription();
            }
            else
            {
                MhoStatus = ExternalToolsUpdateResponseType.NotActivated.GetDescription();
            }

        }
    }
}
