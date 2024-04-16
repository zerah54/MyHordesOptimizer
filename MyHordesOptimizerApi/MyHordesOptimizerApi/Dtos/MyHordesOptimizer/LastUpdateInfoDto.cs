using System;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer
{
    public class LastUpdateInfoDto
    {
        public int UserId { get; set; }
        public string UserName { get; set; }
        public DateTime UpdateTime { get; set; }
    }
}