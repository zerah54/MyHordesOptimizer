using System;

namespace MyHordesOptimizerApi.Models.Views.Items.Citizen
{
    public class TownCitizenItemCompletModel
    {
        public int IdItem { get; set; }
        public int IdCategory { get; set; }
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
        public string CatName { get; set; }
        public int CatOrdering { get; set; }
        public string CatLabelFr { get; set; }
        public string CatLabelEn { get; set; }
        public string CatLabelEs { get; set; }
        public string CatLabelDe { get; set; }
        public string ActionName { get; set; }
        public string PropertyName { get; set; }
        public double DropRatePraf { get; set; }
        public double DropRateNotPraf { get; set; }
        public int TownId { get; set; }
        public int CitizenId { get; set; }
        public string CitizenName { get; set; }
        public string CitizenHomeMessage { get; set; }
        public string CitizenJobName { get; set; }
        public string CitizenJobUID { get; set; }
        public int CitizenPositionX { get; set; }
        public int CitizenPositionY { get; set; }
        public bool CitizenIsGhost { get; set; }
        public int LastUpdateInfoId { get; set; }
        public int LastUpdateInfoUserId { get; set; }
        public DateTime LastUpdateDateUpdate { get; set; }
        public string LastUpdateInfoUserName { get; set; }
        public int ItemCount { get; set; }
        public bool IsBroken { get; set; }
    }
}
