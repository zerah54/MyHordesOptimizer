using System.ComponentModel.DataAnnotations.Schema;

namespace MyHordesOptimizerApi.Models.Citizen
{
    [Table("TownCitizen")]
    public class TownCitizenDetailModel
    {


        public TownCitizenDetailModel(int townId, int userId)
        {
            IdTown = townId;
            IdUser = userId;
        }

        public TownCitizenDetailModel()
        {
        }

        public int IdTown { get; set; }
        public int IdUser { get; set; }

        public bool? HasRescue { get; set; }
        public int ApagCharges { get; set; }
        public bool? HasUppercut { get; set; }
        public bool? HasSecondWind { get; set; }
        public bool? HasLuckyFind { get; set; }
        public bool? HasCheatDeath { get; set; }
        public bool? HasHeroicReturn { get; set; }
        public int? IdLastUpdateInfoHeroicAction { get; set; }

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
        public int? IdLastUpdateInfoHome { get; set; }


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
        public bool IsHungOver { get; set; }
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
        public int? IdLastUpdateInfoStatus { get; set; }

        internal void ImportHomeDetail(TownCitizenDetailModel homeDetail)
        {
            HouseLevel = homeDetail.HouseLevel;
            HasAlarm = homeDetail.HasAlarm;
            ChestLevel = homeDetail.ChestLevel;
            HasCurtain = homeDetail.HasCurtain;
            RenfortLevel = homeDetail.RenfortLevel;
            KitchenLevel = homeDetail.KitchenLevel;
            LaboLevel = homeDetail.LaboLevel;
            RestLevel = homeDetail.RestLevel;
            HasLock = homeDetail.HasLock;
        }

        internal void ImportHeroicActionDetail(TownCitizenDetailModel heroicDetailDetail)
        {

            HasRescue = heroicDetailDetail.HasRescue;
            ApagCharges = heroicDetailDetail.ApagCharges;
            HasUppercut = heroicDetailDetail.HasUppercut;
            HasSecondWind = heroicDetailDetail.HasSecondWind;
            HasLuckyFind = heroicDetailDetail.HasLuckyFind;
            HasCheatDeath = heroicDetailDetail.HasCheatDeath;
            HasHeroicReturn = heroicDetailDetail.HasHeroicReturn;
        }

        internal void ImportStatusDetail(TownCitizenDetailModel statusDetail)
        {
            IsCleanBody = statusDetail.IsCleanBody;
            IsCamper = statusDetail.IsCamper;
            IsAddict = statusDetail.IsAddict;
            IsDrugged = statusDetail.IsDrugged;
            IsDrunk = statusDetail.IsDrunk;
            IsGhoul = statusDetail.IsGhoul;
            IsQuenched = statusDetail.IsQuenched;
            IsConvalescent = statusDetail.IsConvalescent;
            IsSated = statusDetail.IsSated;
            IsCheatingDeathActive = statusDetail.IsCheatingDeathActive;
            IsHungOver = statusDetail.IsHungOver;
            IsImmune = statusDetail.IsImmune;
            IsInfected = statusDetail.IsInfected;
            IsTerrorised = statusDetail.IsTerrorised;
            IsThirsty = statusDetail.IsThirsty;
            IsDesy = statusDetail.IsDesy;
            IsTired = statusDetail.IsTired;
            IsHeadWounded = statusDetail.IsHeadWounded;
            IsHandWounded = statusDetail.IsHandWounded;
            IsArmWounded = statusDetail.IsArmWounded;
            IsLegWounded = statusDetail.IsLegWounded;
            IsEyeWounded = statusDetail.IsEyeWounded;
            IsFootWounded = statusDetail.IsFootWounded;
        }
    }
}
