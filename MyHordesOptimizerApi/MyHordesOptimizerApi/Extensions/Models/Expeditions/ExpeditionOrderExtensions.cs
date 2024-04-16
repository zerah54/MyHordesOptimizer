using MyHordesOptimizerApi.Models;

namespace MyHordesOptimizerApi.Extensions.Models.Expeditions
{
    public static class ExpeditionOrderExtensions
    {
        public static ExpeditionOrder Copy(this ExpeditionOrder source)
        {
            var newOrder = new ExpeditionOrder();
            newOrder.IdExpeditionOrder = 0;
            newOrder.IsDone = false;

            newOrder.Text = source.Text;
            newOrder.Type = source.Type;

            return newOrder;
        }
    }
}
