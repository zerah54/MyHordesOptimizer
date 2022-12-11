using MyHordesOptimizerApi.Extensions;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.Bags
{
    public class BagsResponseDto
    {
        public string MhoStatus { get; set; }

        public BagsResponseDto(UpdateRequestDto updateRequestDto)
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
