using System.Collections.Generic;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer
{
    public class CategoryDto
    {
        public int IdCategory { get; set; }
        public string Name { get; set; } = null!;
        public int Ordering { get; set; }
        public IDictionary<string, string> Label { get; set; } = null!;
    }
}
