using MyHordesOptimizerApi.Extensions;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.Status
{
    public class StatusResponseDto
    {
        public string MhoStatus { get; set; }
        public string GestHordesStatus { get; set; }

        public StatusResponseDto(UpdateRequestDto updateRequestDto)
        {
            if (updateRequestDto.Status != null)
            {
                if (updateRequestDto.Status.ToolsToUpdate.IsMyHordesOptimizer)
                {
                    MhoStatus = ExternalToolsUpdateResponseType.Ok.GetDescription();
                }
                else
                {
                    MhoStatus = ExternalToolsUpdateResponseType.NotActivated.GetDescription();
                }
                if (updateRequestDto.Status.ToolsToUpdate.IsGestHordes)
                {
                    GestHordesStatus = ExternalToolsUpdateResponseType.Ok.GetDescription();
                }
                else
                {
                    GestHordesStatus = ExternalToolsUpdateResponseType.NotActivated.GetDescription();
                }
            }
            else
            {
                MhoStatus = ExternalToolsUpdateResponseType.NotActivated.GetDescription();
                GestHordesStatus = ExternalToolsUpdateResponseType.NotActivated.GetDescription();
            }
        }
    }
}
