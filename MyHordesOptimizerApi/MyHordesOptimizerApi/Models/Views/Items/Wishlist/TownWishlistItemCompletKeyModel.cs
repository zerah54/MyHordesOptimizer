using System;

namespace MyHordesOptimizerApi.Models.Views.Items.Wishlist
{
    public class TownWishlistItemCompletKeyModel
    {
        public int TownId { get; set; }
        public int ItemId { get; set; }

        public TownWishlistItemCompletKeyModel(TownWishlistItemCompletModel copy)
        {
            TownId = copy.TownId;
            ItemId = copy.ItemId;
        }
        public override bool Equals(object obj)
        {
            return obj is TownWishlistItemCompletKeyModel model &&
                   TownId == model.TownId &&
                   ItemId == model.ItemId;
        }

        public override int GetHashCode()
        {
            return HashCode.Combine(TownId, ItemId);
        }
    }
}
