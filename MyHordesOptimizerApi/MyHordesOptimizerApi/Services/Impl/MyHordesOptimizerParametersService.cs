using AutoMapper;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Models;
using MyHordesOptimizerApi.Repository.Interfaces;
using MyHordesOptimizerApi.Services.Interfaces;
using System.Collections.Generic;

namespace MyHordesOptimizerApi.Services.Impl
{
    public class MyHordesOptimizerParametersService : IMyHordesOptimizerParametersService
    {
        protected IMyHordesOptimizerRepository MyHordesOptimizerRepository { get; private set; }
        protected IMapper Mapper { get; private set; }

        public MyHordesOptimizerParametersService(IMyHordesOptimizerRepository myHordesOptimizerRepository, IMapper mapper)
        {
            MyHordesOptimizerRepository = myHordesOptimizerRepository;
            Mapper = mapper;
        }

        public IEnumerable<ParametersDto> GetParameters()
        {
            var models = MyHordesOptimizerRepository.GetParameters();
            var dtos = Mapper.Map<IEnumerable<ParametersDto>>(models);
            return dtos;
        }

        public void UpdateParameter(ParametersDto parameter)
        {
            var model = Mapper.Map<ParametersModel>(parameter);
            MyHordesOptimizerRepository.PatchParameter(model);
        }
    }
}
