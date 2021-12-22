using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools;

namespace MyHordesOptimizerApi.Services.Interfaces.ExternalTools
{
    public interface IExternalToolsService
    {
        public void UpdateExternalsTools(UpdateRequestDto updateRequestDto);
    }
}
