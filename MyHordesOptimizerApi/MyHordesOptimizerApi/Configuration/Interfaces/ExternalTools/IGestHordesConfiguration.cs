namespace MyHordesOptimizerApi.Configuration.Interfaces.ExternalTools
{
    public interface IGestHordesConfiguration
    {
        public string Url { get; }
        public string LoginPath { get; }
        public string MajPath { get; }
    }
}
