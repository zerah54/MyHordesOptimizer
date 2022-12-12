using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Citizens;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer
{
    public class Citizen
    {
        #region MyHordes

        public int Id { get; set; }

        public string Name { get; set; }

        public bool IsGhost { get; set; }

        public string HomeMessage { get; set; }

        public string Avatar { get; set; }

        public string JobName { get; set; }

        public int X { get; set; }

        public int Y { get; set; }

        #endregion

        public int NombreJourHero { get; set; }

        public CitizenBag Bag { get; set; }

        #region Home
        public int HouseLevel { get; set; }
        public bool HasAlarm { get; set; }
        public int ChestLevel { get; set; }
        public bool HasCurtain { get; set; }
        public int HouseDefense { get; set; }
        public int KitchenLevel { get; set; }
        public int LabelLevel { get; set; }
        public int RestLevel { get; set; }
        public bool HasLock { get; set; }
        #endregion

        #region Status
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
        #endregion

        #region HeroicAction
        public bool HasRescue { get; set; }
        public int ApagCharges { get; set; }
        public bool HasUppercut { get; set; }
        public bool HasSecondWind { get; set; }
        public bool HasLuckyFind { get; set; }
        public bool HasCheatDeath { get; set; }
        public bool HasHeroicReturn { get; set; }
        #endregion

        public Citizen()
        {
            Bag = new CitizenBag();
        }
    }
}
