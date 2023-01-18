using Microsoft.Extensions.Configuration;
using MyHordesOptimizerApi.Configuration.Interfaces;

namespace MyHordesOptimizerApi.Configuration.Impl
{
    public class MyHordesScrutateurConfiguration : IMyHordesScrutateurConfiguration
    {
        private IConfigurationSection _configuration;

        public MyHordesScrutateurConfiguration(IConfiguration configuration)
        {
            _configuration = configuration.GetSection("MyHordes").GetSection("Scrutateur");
        }

        public int Id => _configuration.GetValue<int>("Id");

        public int Level0 => _configuration.GetValue<int>("Level0");

        public int Level1 => _configuration.GetValue<int>("Level1");

        public int Level2 => _configuration.GetValue<int>("Level2");

        public int Level3 => _configuration.GetValue<int>("Level3");

        public int Level4 => _configuration.GetValue<int>("Level4");

        public int Level5 => _configuration.GetValue<int>("Level5");

        public int StartItemMin => _configuration.GetValue<int>("StartItemMin");

        public int StartItemMax => _configuration.GetValue<int>("StartItemMax");

        public int MinItemAdd => _configuration.GetValue<int>("MinItemAdd");

        public int MaxItemAdd => _configuration.GetValue<int>("MaxItemAdd");

        public int MaxItemPerCell => _configuration.GetValue<int>("MaxItemPerCell");

        public int DigThrottle => _configuration.GetValue<int>("DigThrottle");
    }
}
