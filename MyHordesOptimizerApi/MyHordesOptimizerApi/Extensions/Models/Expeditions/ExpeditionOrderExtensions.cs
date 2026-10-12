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
            newOrder.Position = source.Position;
            newOrder.X = source.X;
            newOrder.Y = source.Y;
            newOrder.Kind = source.Kind;
            newOrder.IdItem = source.IdItem;
            newOrder.Quantity = source.Quantity;
            newOrder.HeroSkill = source.HeroSkill;
            newOrder.IdTargetUser = source.IdTargetUser;

            return newOrder;
        }
    }
}
