using AutoMapper;
using MyHordesOptimizerApi.Data.Jobs;
using MyHordesOptimizerApi.Models;
using System.Collections.Generic;

namespace MyHordesOptimizerApi.MappingProfiles.Jobs
{
    public class JobsMappingProfile : Profile
    {
        public JobsMappingProfile()
        {
            CreateMap<KeyValuePair<string, JobCodeModel>, Job>()
             .ForMember(model => model.BaseWatchSurvival, opt => opt.MapFrom(code => code.Value.BaseWatchSurvival))
             .ForMember(model => model.BuildingWatchSurvivalBonusJobs, opt => opt.Ignore())
             .ForMember(model => model.JobUid, opt => opt.MapFrom(code => code.Key));
        }
    }
}
