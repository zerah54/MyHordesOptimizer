using MyHordesOptimizerApi.Extensions;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.HeroicAction
{
    public class HeroicActionsResponseDto
    {
        public string MhoStatus { get; set; }
        public string GestHordesStatus { get; set; }

        public HeroicActionsResponseDto(UpdateRequestDto updateRequestDto)
        {
            if(updateRequestDto.HeroicActions != null)
            {
                if (updateRequestDto.HeroicActions.ToolsToUpdate.IsMyHordesOptimizer)
                {
                    MhoStatus = ExternalToolsUpdateResponseType.Ok.GetDescription();
                }
                else
                {
                    MhoStatus = ExternalToolsUpdateResponseType.NotActivated.GetDescription();
                }
                if (updateRequestDto.HeroicActions.ToolsToUpdate.IsGestHordes)
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
