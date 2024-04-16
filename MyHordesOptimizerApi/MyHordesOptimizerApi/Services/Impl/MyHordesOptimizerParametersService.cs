using AutoMapper;
using Microsoft.AspNetCore.Mvc.ApplicationModels;
using Microsoft.Extensions.DependencyInjection;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Extensions;
using MyHordesOptimizerApi.Models;
using MyHordesOptimizerApi.Services.Interfaces;
using System.Collections.Generic;
using System.Linq;

namespace MyHordesOptimizerApi.Services.Impl
{
    public class MyHordesOptimizerParametersService : IMyHordesOptimizerParametersService
    {
        protected IServiceScopeFactory ServiceScopeFactory { get; private set; }
        protected IMapper Mapper { get; private set; }
        protected MhoContext DbContext { get; init; }

        public MyHordesOptimizerParametersService(IServiceScopeFactory serviceScopeFactory,
            IMapper mapper,
            MhoContext dbContext)
        {
            ServiceScopeFactory = serviceScopeFactory;
            Mapper = mapper;
            DbContext = dbContext;
        }

        public IEnumerable<ParametersDto> GetParameters()
        {
            var models = DbContext.Parameters.ToList();
            var dtos = Mapper.Map<IEnumerable<ParametersDto>>(models);
            return dtos;
        }

        public void UpdateParameter(ParametersDto parameter)
        {
            var model = DbContext.Parameters.SingleOrDefault(p => p.Name == parameter.Name);
            var updatedModel = Mapper.Map<Parameter>(parameter);
            if (model == null)
            {
                DbContext.Parameters.Add(updatedModel);
            }
            else
            {
                model.UpdateNoNullProperties(updatedModel);
                DbContext.Update(model);
            }
            DbContext.SaveChanges();
        }
    }
}
