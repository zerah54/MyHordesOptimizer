using System.Collections.Generic;

namespace MyHordesOptimizerApi.Dtos.MyHordes.MyHordesOptimizer
{
    public class Item
    {
        public string IdName { get; set; }
        public string Img { get; set; }
        public IDictionary<string, string> Labels { get; set; }
    }
}
