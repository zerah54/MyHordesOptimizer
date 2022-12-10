namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.Map
{
    public class UpdateMapResponseDto
    {
        public string FataMorganaStatus { get; set; }
        public string BigBrothHordesStatus { get; set; }
        public string GestHordesApiStatus { get; set; }
        public string GestHordesCellsStatus { get; set; }


        private string _okStatus = "Ok";
        private string _notActivatedStatus = "Not activated";


        public UpdateMapResponseDto(UpdateRequestDto updateRequestDto)
        {
            FataMorganaStatus = !UpdateRequestMapToolsToUpdateDetailsDto.IsNone(updateRequestDto.Map.ToolsToUpdate.IsFataMorgana) ? _okStatus : _notActivatedStatus;
            BigBrothHordesStatus = !UpdateRequestMapToolsToUpdateDetailsDto.IsNone(updateRequestDto.Map.ToolsToUpdate.IsBigBrothHordes) ? _okStatus : _notActivatedStatus;

            if(UpdateRequestMapToolsToUpdateDetailsDto.IsNone(updateRequestDto.Map.ToolsToUpdate.IsGestHordes))
            {
                GestHordesApiStatus = _notActivatedStatus;
                GestHordesCellsStatus = _notActivatedStatus;
            }
            else if(UpdateRequestMapToolsToUpdateDetailsDto.IsApi(updateRequestDto.Map.ToolsToUpdate.IsGestHordes))
            {
                GestHordesApiStatus = _okStatus;
                GestHordesCellsStatus = _notActivatedStatus;
            }
            else
            {
                GestHordesApiStatus = _okStatus;
                GestHordesCellsStatus = _okStatus;
            } 
        }
    }
}
