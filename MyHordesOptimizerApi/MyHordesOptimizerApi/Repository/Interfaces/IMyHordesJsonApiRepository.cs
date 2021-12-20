using MyHordesOptimizerApi.Dtos.MyHordes.Items;
using System.Collections.Generic;

namespace MyHordesOptimizerApi.Repository.Interfaces
{
    public interface IMyHordesJsonApiRepository
    {
        public Dictionary<string, MyHordesJsonItem> GetItems();
    }
}
