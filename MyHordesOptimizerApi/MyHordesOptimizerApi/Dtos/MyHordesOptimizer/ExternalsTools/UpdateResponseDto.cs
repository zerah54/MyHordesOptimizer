namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools
{
    public class UpdateResponseDto
    {
        private string _okStatus = "Ok";
        private string _notActivatedStatus = "Not activated";

        public string FataMorganaStatus { get; set; }
        public string BigBrothHordesStatus { get; set; }
        public string GestHordesStatus { get; set; }
        public string BagsStatus { get; set; }

        public UpdateResponseDto(UpdateRequestDto updateRequestDto)
        {
            FataMorganaStatus = !UpdateRequestToolsDetailsDto.IsNone(updateRequestDto.Tools.IsFataMorgana) ? _okStatus : _notActivatedStatus;
            BigBrothHordesStatus = !UpdateRequestToolsDetailsDto.IsNone(updateRequestDto.Tools.IsBigBrothHordes) ? _okStatus : _notActivatedStatus;
            GestHordesStatus = !UpdateRequestToolsDetailsDto.IsNone(updateRequestDto.Tools.IsGestHordes) ? _okStatus : _notActivatedStatus;
            BagsStatus = _okStatus;
        }
    }
}
