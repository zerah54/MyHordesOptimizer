using System;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Authentication
{
    public class TokenDto
    {
        public string AccessToken { get; set; }
        public DateTime ValidFrom { get; set; }
        public DateTime ValidTo { get; set; }
    }
}
