using System.Collections.Generic;

namespace MyHordesOptimizerApi.Configuration.Interfaces
{
    public interface IMyHordesTranslationsConfiguration
    {
        List<string> Paths { get; }
        string GitLabProjectId { get; }
    }
}
