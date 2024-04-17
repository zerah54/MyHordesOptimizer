using MyHordesOptimizerApi.Models;

namespace MyHordesOptimizerApi.Extensions.Models
{
    public static class TownCitizenExtensions
    {
        public static void ImportHomeDetail(this TownCitizen src, TownCitizen homeDetail)
        {
            src.HouseLevel = homeDetail.HouseLevel;
            src.HasAlarm = homeDetail.HasAlarm;
            src.ChestLevel = homeDetail.ChestLevel;
            src.HasCurtain = homeDetail.HasCurtain;
            src.RenfortLevel = homeDetail.RenfortLevel;
            src.KitchenLevel = homeDetail.KitchenLevel;
            src.LaboLevel = homeDetail.LaboLevel;
            src.RestLevel = homeDetail.RestLevel;
            src.HasLock = homeDetail.HasLock;
            src.IdLastUpdateInfoHome = homeDetail.IdLastUpdateInfoHome;
        }

        public static void ImportHeroicActionDetail(this TownCitizen src, TownCitizen heroicDetailDetail)
        {

            src.HasRescue = heroicDetailDetail.HasRescue;
            src.Apagcharges = heroicDetailDetail.Apagcharges;
            src.HasUppercut = heroicDetailDetail.HasUppercut;
            src.HasSecondWind = heroicDetailDetail.HasSecondWind;
            src.HasLuckyFind = heroicDetailDetail.HasLuckyFind;
            src.HasCheatDeath = heroicDetailDetail.HasCheatDeath;
            src.HasHeroicReturn = heroicDetailDetail.HasHeroicReturn;
            src.HasBreakThrough = heroicDetailDetail.HasBreakThrough;
            src.HasBrotherInArms = heroicDetailDetail.HasBrotherInArms;
            src.IdLastUpdateInfoHeroicAction = heroicDetailDetail.IdLastUpdateInfoHeroicAction;
        }

        public static void ImportStatusDetail(this TownCitizen src, TownCitizen statusDetail)
        {
            src.IsCleanBody = statusDetail.IsCleanBody;
            src.IsCamper = statusDetail.IsCamper;
            src.IsAddict = statusDetail.IsAddict;
            src.IsDrugged = statusDetail.IsDrugged;
            src.IsDrunk = statusDetail.IsDrunk;
            src.IsQuenched = statusDetail.IsQuenched;
            src.IsConvalescent = statusDetail.IsConvalescent;
            src.IsSated = statusDetail.IsSated;
            src.IsCheatingDeathActive = statusDetail.IsCheatingDeathActive;
            src.IsHungOver = statusDetail.IsHungOver;
            src.IsImmune = statusDetail.IsImmune;
            src.IsInfected = statusDetail.IsInfected;
            src.IsTerrorised = statusDetail.IsTerrorised;
            src.IsThirsty = statusDetail.IsThirsty;
            src.IsDesy = statusDetail.IsDesy;
            src.IsTired = statusDetail.IsTired;
            src.IsHeadWounded = statusDetail.IsHeadWounded;
            src.IsHandWounded = statusDetail.IsHandWounded;
            src.IsArmWounded = statusDetail.IsArmWounded;
            src.IsLegWounded = statusDetail.IsLegWounded;
            src.IsEyeWounded = statusDetail.IsEyeWounded;
            src.IsFootWounded = statusDetail.IsFootWounded;
            src.IdLastUpdateInfoStatus = statusDetail.IdLastUpdateInfoStatus;
        }
    }
}
