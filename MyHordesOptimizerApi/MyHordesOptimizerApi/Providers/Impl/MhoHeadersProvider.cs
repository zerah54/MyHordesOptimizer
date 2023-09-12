using MyHordesOptimizerApi.Providers.Interfaces;

namespace MyHordesOptimizerApi.Providers.Impl
{
    public class MhoHeadersProvider : IMhoHeadersProvider
    {
        public string MhoOrigin { get; set; }
        public string MhoScriptVersion { get; set; }
    }
}
