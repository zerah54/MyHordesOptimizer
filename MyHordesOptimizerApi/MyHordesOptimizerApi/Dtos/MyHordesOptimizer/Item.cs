using System.Collections.Generic;

namespace MyHordesOptimizerApi.Dtos.MyHordes.MyHordesOptimizer
{
    public class Item
    {
        public string JsonIdName { get; set; }
        public string Img { get; set; }
        public IDictionary<string, string> Labels { get; set; }
        public int XmlId { get; set; }
        public string Category { get; set; }
        public int Deco { get; set; }
        public bool IsHeaver { get; set; }
        public int Guard { get; set; }
        public string XmlName { get; set; }
        public string Description { get; set; }
    }
}
