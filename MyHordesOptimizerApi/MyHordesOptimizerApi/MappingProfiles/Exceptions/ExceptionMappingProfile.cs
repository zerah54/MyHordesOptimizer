using AutoMapper;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Exception;
using MyHordesOptimizerApi.Exceptions;

namespace MyHordesOptimizerApi.MappingProfiles.Exceptions
{
    public class ExceptionMappingProfile : Profile
    {
        public ExceptionMappingProfile()
        {
            CreateMap<MhoFunctionalException, ExceptionDto>()
                .ForMember(dto => dto.Message, opt => opt.MapFrom(ex => ex.Message))
                .ForMember(dto => dto.ErrorCode, opt => opt.MapFrom(ex => ex.ErrorCode))
                .ForMember(dto => dto.ErrorType, opt => opt.MapFrom(ex => ex.GetType().Name));
        }
    }
}
