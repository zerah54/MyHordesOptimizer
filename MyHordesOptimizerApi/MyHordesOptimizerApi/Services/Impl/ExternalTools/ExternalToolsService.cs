using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools;
using MyHordesOptimizerApi.Repository.Interfaces.ExternalTools;
using MyHordesOptimizerApi.Services.Interfaces.ExternalTools;

namespace MyHordesOptimizerApi.Services.Impl.ExternalTools
{
    public class ExternalToolsService : IExternalToolsService
    {
        protected IBigBrothHordesRepository BigBrothHordesRepository { get; private set; }
        protected IFataMorganaRepository FataMorganaRepository { get; private set; }
        protected IGestHordesRepository GestHordesRepository { get; private set; }

        public ExternalToolsService(IBigBrothHordesRepository bigBrothHordesRepository, IFataMorganaRepository fataMorganaRepository, IGestHordesRepository gestHordesRepository)
        {
            BigBrothHordesRepository = bigBrothHordesRepository;
            FataMorganaRepository = fataMorganaRepository;
            GestHordesRepository = gestHordesRepository;
        }

        public void UpdateExternalsTools(UpdateRequestDto updateRequestDto)
        {
            if (updateRequestDto.IsBigBrothHordes)
            {
                BigBrothHordesRepository.Update();
            }
            if (updateRequestDto.IsFataMorgana)
            {
                FataMorganaRepository.Update();
            }
            if (updateRequestDto.IsGestHordes)
            {
                GestHordesRepository.Update();
            }
        }
    }
}
