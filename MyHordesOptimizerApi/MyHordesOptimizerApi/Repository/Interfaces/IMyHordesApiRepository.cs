using MyHordesOptimizerApi.Dtos.MyHordes;
using System.Collections.Generic;

namespace MyHordesOptimizerApi.Repository.Interfaces
{
    public interface IMyHordesApiRepository
    {
        public Dictionary<string, MyHordesItem> GetItems();
    }
}
