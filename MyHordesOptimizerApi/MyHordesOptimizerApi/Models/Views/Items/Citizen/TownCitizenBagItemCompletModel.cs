using System;

namespace MyHordesOptimizerApi.Models.Views.Items.Citizen
{
    public class TownCitizenBagItemCompletModel
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
        public string Avatar { get; set; }
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
        public DateTime? BagLastUpdateDateUpdate { get; set; }
        public string BagLastUpdateUserName { get; set; }
        public int ItemCount { get; set; }
        public bool IsBroken { get; set; }
        public int? BagId { get; set; }

        public bool HasRescue { get; set; }
        public int ApagCharges { get; set; }
        public bool HasUppercut { get; set; }
        public bool HasSecondWind { get; set; }
        public bool HasLuckyFind { get; set; }
        public bool HasCheatDeath { get; set; }
        public bool HasHeroicReturn { get; set; }
        public DateTime? HeroicActionLastUpdateDateUpdate { get; set; }
        public string? HeroicActionLastUpdateInfoUserName { get; set; }

        public int HouseLevel { get; set; }
        public bool HasAlarm { get; set; }
        public int ChestLevel { get; set; }
        public bool HasCurtain { get; set; }
        public int RenfortLevel { get; set; }
        public bool HasFence { get; set; }
        public int KitchenLevel { get; set; }
        public int LaboLevel { get; set; }
        public int RestLevel { get; set; }
        public bool HasLock { get; set; }
        public DateTime? HomeLastUpdateDateUpdate { get; set; }
        public string? HomeLastUpdateInfoUserName { get; set; }

        public bool IsCleanBody { get; set; }
        public bool IsCamper { get; set; }
        public bool IsAddict { get; set; }
        public bool IsDrugged { get; set; }
        public bool IsDrunk { get; set; }
        public bool IsGhoul { get; set; }
        public bool IsQuenched { get; set; }
        public bool IsConvalescent { get; set; }
        public bool IsSated { get; set; }
        public bool IsCheatingDeathActive { get; set; }
        public bool IsHangOver { get; set; }
        public bool IsImmune { get; set; }
        public bool IsInfected { get; set; }
        public bool IsTerrorised { get; set; }
        public bool IsThirsty { get; set; }
        public bool IsDesy { get; set; }
        public bool IsTired { get; set; }
        public bool IsHeadWounded { get; set; }
        public bool IsHandWounded { get; set; }
        public bool IsArmWounded { get; set; }
        public bool IsLegWounded { get; set; }
        public bool IsEyeWounded { get; set; }
        public bool IsFootWounded { get; set; }
        public DateTime? StatusLastUpdateDateUpdate { get; set; }
        public string? StatusLastUpdateInfoUserName { get; set; }
    }
}
