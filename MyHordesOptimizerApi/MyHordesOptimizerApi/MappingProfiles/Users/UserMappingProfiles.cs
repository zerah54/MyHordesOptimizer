using AutoMapper;
using MyHordesOptimizerApi.Dtos.MyHordes;
using MyHordesOptimizerApi.Models;

namespace MyHordesOptimizerApi.MappingProfiles.Users
{
    public class UserMappingProfiles : Profile
    {
        public UserMappingProfiles()
        {
            CreateMap<MyHordesUserDetailsDto, User>()
                .ForMember(user => user.IdUser, opt => opt.MapFrom(dto => dto.Id.Value))
                .ForMember(user => user.Name, opt => opt.MapFrom(dto => dto.Name))
                .ForMember(user => user.Avatar, opt => opt.MapFrom(dto => dto.Avatar));
        }
    }
}
