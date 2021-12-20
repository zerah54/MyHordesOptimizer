using MyHordesOptimizerApi.Dtos.MyHordes.Items;

namespace MyHordesOptimizerApi.Repository.Interfaces
{
    public interface IMyHordesXmlApiRepository
    {
        MyHordesRootElementDto GetItems();
    }
}
