using System.ComponentModel;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools
{
    public enum ExternalToolsUpdateResponseType
    {
        [Description("Ok")]
        Ok,
        [Description("Not activated")]
        NotActivated
    }
}
