using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.Bags;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.Map;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools
{
    public class UpdateResponseDto
    {
        public UpdateMapResponseDto MapResponseDto { get; set; }
        public BagsResponseDto BagsResponseDto { get; set; }

        public UpdateResponseDto(UpdateRequestDto updateRequestDto)
        {
            MapResponseDto = new UpdateMapResponseDto(updateRequestDto);
            BagsResponseDto = new BagsResponseDto();
        }
    }
}
