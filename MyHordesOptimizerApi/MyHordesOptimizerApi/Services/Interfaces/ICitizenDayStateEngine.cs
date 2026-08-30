using System.Collections.Generic;
using MyHordesOptimizerApi.Models.CitizenState;

namespace MyHordesOptimizerApi.Services.Interfaces
{
    public interface ICitizenDayStateEngine
    {
        CitizenStateTrace Simulate(CitizenState start, IReadOnlyList<CitizenStateStep> steps);
    }
}
