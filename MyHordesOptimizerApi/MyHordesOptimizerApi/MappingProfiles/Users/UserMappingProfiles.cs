using AutoMapper;
using MyHordesOptimizerApi.Dtos.MyHordes.Me;
using MyHordesOptimizerApi.Models;

namespace MyHordesOptimizerApi.MappingProfiles.Users
{
    public class UserMappingProfiles : Profile
    {
        public UserMappingProfiles()
        {
            CreateMap<MyHordesMeResponseDto, User>()
                .ForMember(user => user.IdUser, opt => opt.MapFrom(dto => dto.Id))
                .ForMember(user => user.Name, opt => opt.MapFrom(dto => dto.Name))
                .ForMember(user => user.UserKey, opt => opt.Ignore());
        }
    }
}
