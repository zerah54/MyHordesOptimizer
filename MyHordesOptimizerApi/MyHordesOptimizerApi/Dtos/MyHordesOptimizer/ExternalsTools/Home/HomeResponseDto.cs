using MyHordesOptimizerApi.Extensions;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.Home
{
    public class HomeResponseDto
    {
        public string MhoStatus { get; set; }
        public string GestHordesStatus { get; set; }

        public HomeResponseDto(UpdateRequestDto updateRequestDto)
        {
            if (updateRequestDto.Amelios != null)
            {
                if (updateRequestDto.Amelios.ToolsToUpdate.IsMyHordesOptimizer)
                {
                    MhoStatus = ExternalToolsUpdateResponseType.Ok.GetDescription();
                }
                else
                {
                    MhoStatus = ExternalToolsUpdateResponseType.NotActivated.GetDescription();
                }
                if (updateRequestDto.Amelios.ToolsToUpdate.IsGestHordes)
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
