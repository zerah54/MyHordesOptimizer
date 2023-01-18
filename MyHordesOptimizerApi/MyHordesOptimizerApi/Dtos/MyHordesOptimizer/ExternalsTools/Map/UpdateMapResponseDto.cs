using MyHordesOptimizerApi.Extensions;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.Map
{
    public class UpdateMapResponseDto
    {
        public string FataMorganaStatus { get; set; }
        public string BigBrothHordesStatus { get; set; }
        public string MhoApiStatus { get; set; }
        public string GestHordesApiStatus { get; set; }
        public string GestHordesCellsStatus { get; set; }


        public UpdateMapResponseDto(UpdateRequestDto updateRequestDto)
        {
            FataMorganaStatus = !UpdateRequestMapToolsToUpdateDetailsDto.IsNone(updateRequestDto.Map.ToolsToUpdate.IsFataMorgana) ? ExternalToolsUpdateResponseType.Ok.GetDescription() : ExternalToolsUpdateResponseType.NotActivated.GetDescription();
            BigBrothHordesStatus = !UpdateRequestMapToolsToUpdateDetailsDto.IsNone(updateRequestDto.Map.ToolsToUpdate.IsBigBrothHordes) ? ExternalToolsUpdateResponseType.Ok.GetDescription() : ExternalToolsUpdateResponseType.NotActivated.GetDescription();
            MhoApiStatus = !UpdateRequestMapToolsToUpdateDetailsDto.IsNone(updateRequestDto.Map.ToolsToUpdate.IsMyHordesOptimizer) ? ExternalToolsUpdateResponseType.Ok.GetDescription() : ExternalToolsUpdateResponseType.NotActivated.GetDescription();

            if(UpdateRequestMapToolsToUpdateDetailsDto.IsNone(updateRequestDto.Map.ToolsToUpdate.IsGestHordes))
            {
                GestHordesApiStatus = ExternalToolsUpdateResponseType.NotActivated.GetDescription();
                GestHordesCellsStatus = ExternalToolsUpdateResponseType.NotActivated.GetDescription();
            }
            else if(UpdateRequestMapToolsToUpdateDetailsDto.IsApi(updateRequestDto.Map.ToolsToUpdate.IsGestHordes))
            {
                GestHordesApiStatus = ExternalToolsUpdateResponseType.Ok.GetDescription();
                GestHordesCellsStatus = ExternalToolsUpdateResponseType.NotActivated.GetDescription();
            }
            else
            {
                GestHordesApiStatus = ExternalToolsUpdateResponseType.Ok.GetDescription();
                GestHordesCellsStatus = ExternalToolsUpdateResponseType.Ok.GetDescription();
            } 
        }
    }
}
