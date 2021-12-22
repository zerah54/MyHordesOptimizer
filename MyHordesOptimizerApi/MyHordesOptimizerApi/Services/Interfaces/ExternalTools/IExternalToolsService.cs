using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools;

namespace MyHordesOptimizerApi.Services.Interfaces.ExternalTools
{
    public interface IExternalToolsService
    {
        public UpdateResponseDto UpdateExternalsTools(UpdateRequestDto updateRequestDto);
    }
}
