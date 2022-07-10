using System;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer
{
    public class LastUpdateInfo
    {
        public int UserId { get; set; }
        public string UserName { get; set; }
        public string UserKey { get; set; }
        public DateTime UpdateTime { get; set; }
    }
}