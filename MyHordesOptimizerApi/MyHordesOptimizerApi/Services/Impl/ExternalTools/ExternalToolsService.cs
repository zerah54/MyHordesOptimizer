using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools;
using MyHordesOptimizerApi.Repository.Interfaces.ExternalTools;
using MyHordesOptimizerApi.Services.Interfaces.ExternalTools;
using System;

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

        public UpdateResponseDto UpdateExternalsTools(UpdateRequestDto updateRequestDto)
        {
            var response = new UpdateResponseDto(updateRequestDto);

            if (updateRequestDto.IsBigBrothHordes)
            {
                try
                {
                    BigBrothHordesRepository.Update();
                }
                catch (Exception e)
                {
                    response.BigBrothHordesStatus = e.Message;
                }
            }

            if (updateRequestDto.IsFataMorgana)
            {
                try
                {
                    FataMorganaRepository.Update();
                }
                catch (Exception e)
                {
                    response.FataMorganaStatus = e.Message;
                }
            }

            if (updateRequestDto.IsGestHordes)
            {
                try
                {
                    GestHordesRepository.Update();

                }
                catch (Exception e)
                {

                    response.GestHordesStatus = e.Message;
                }
            }

            return response;
        }
    }
}
