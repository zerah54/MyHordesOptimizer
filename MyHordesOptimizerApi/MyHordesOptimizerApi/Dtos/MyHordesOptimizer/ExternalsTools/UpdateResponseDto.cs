using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.Bags;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.HeroicAction;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.Home;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.Map;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.Status;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools
{
    public class UpdateResponseDto
    {
        public UpdateMapResponseDto MapResponseDto { get; set; }
        public BagsResponseDto BagsResponseDto { get; set; }
        public HeroicActionsResponseDto HeroicActionsResponseDto { get; set; }
        public HomeResponseDto HomeResponseDto { get; set; }
        public StatusResponseDto StatusResponseDto { get; set; }

        public UpdateResponseDto(UpdateRequestDto updateRequestDto)
        {
            MapResponseDto = new UpdateMapResponseDto(updateRequestDto);
            BagsResponseDto = new BagsResponseDto(updateRequestDto);
            HeroicActionsResponseDto = new HeroicActionsResponseDto(updateRequestDto);
            HomeResponseDto = new HomeResponseDto(updateRequestDto);
            StatusResponseDto = new StatusResponseDto(updateRequestDto);
        }
    }
}
