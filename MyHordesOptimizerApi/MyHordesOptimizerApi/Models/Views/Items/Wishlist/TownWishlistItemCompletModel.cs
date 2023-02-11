using System;

namespace MyHordesOptimizerApi.Models.Views.Items.Wishlist
{
    public class TownWishlistItemCompletModel
    {
        public int TownId { get; set; }
        public int ItemId { get; set; }
        public string ItemUid { get; set; }
        public int ItemDeco { get; set; }
        public string ItemLabelFr { get; set; }
        public string ItemLabelEn { get; set; }
        public string ItemLabelEs { get; set; }
        public string ItemLabelDe { get; set; }
        public string ItemDescriptionFr { get; set; }
        public string ItemDescriptionEn { get; set; }
        public string ItemDescriptionEs { get; set; }
        public string ItemDescriptionDe { get; set; }
        public int ItemGuard { get; set; }
        public string ItemImg { get; set; }
        public bool ItemIsHeaver { get; set; }
        public int CategoryId { get; set; }
        public string CategoryLabelFr { get; set; }
        public string CategoryLabelEn { get; set; }
        public string CategoryLabelEs { get; set; }
        public string CategoryLabelDe { get; set; }
        public string CategoryName { get; set; }
        public int CategoryOrdering { get; set; }
        public string ActionName { get; set; }
        public string PropertyName { get; set; }
        public int WishlistCount { get; set; }
        public int WishlistPriority { get; set; }
        public int WishlistZoneXPa { get; set; }
        public int WishlistDepot { get; set; }
        public int LastUpdateInfoId { get; set; }
        public int LastUpdateInfoUserId { get; set; }
        public DateTime LastUpdateDateUpdate { get; set; }
        public string LastUpdateInfoUserName { get; set; }
    }
}
