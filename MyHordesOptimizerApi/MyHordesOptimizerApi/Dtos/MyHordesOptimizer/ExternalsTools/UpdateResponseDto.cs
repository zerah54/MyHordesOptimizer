namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools
{
    public class UpdateResponseDto
    {
        private string _okStatus = "Ok";
        private string _notActivatedStatus = "Not activated";

        public string FataMorganaStatus { get; set; }
        public string BigBrothHordesStatus { get; set; }
        public string GestHordesStatus { get; set; }

        public UpdateResponseDto(UpdateRequestDto updateRequestDto)
        {
            FataMorganaStatus = updateRequestDto.IsFataMorgana ? _okStatus : _notActivatedStatus;
            BigBrothHordesStatus = updateRequestDto.IsBigBrothHordes ? _okStatus : _notActivatedStatus;
            GestHordesStatus = updateRequestDto.IsGestHordes ? _okStatus : _notActivatedStatus;
        }
    }
}
