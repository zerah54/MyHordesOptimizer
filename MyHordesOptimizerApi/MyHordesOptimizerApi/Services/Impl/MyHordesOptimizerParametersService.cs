using AutoMapper;
using Microsoft.Extensions.DependencyInjection;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Services.Interfaces;
using System.Collections.Generic;

namespace MyHordesOptimizerApi.Services.Impl
{
    public class MyHordesOptimizerParametersService : IMyHordesOptimizerParametersService
    {
        protected IServiceScopeFactory ServiceScopeFactory { get; private set; }
        protected IMapper Mapper { get; private set; }

        public MyHordesOptimizerParametersService(IServiceScopeFactory serviceScopeFactory, IMapper mapper)
        {
            ServiceScopeFactory = serviceScopeFactory;
            Mapper = mapper;
        }

        public IEnumerable<ParametersDto> GetParameters()
        {
            //var models = MyHordesOptimizerRepository.GetParameters();
            //var dtos = Mapper.Map<IEnumerable<ParametersDto>>(models);
            //return dtos;
            return null;
        }

        public void UpdateParameter(ParametersDto parameter)
        {
            //var model = Mapper.Map<ParametersModel>(parameter);
            //MyHordesOptimizerRepository.PatchParameter(model);
        }
    }
}
