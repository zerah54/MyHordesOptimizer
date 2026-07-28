using MyHordesOptimizerApi.Models;

namespace MyHordesOptimizerApi.Extensions.Models
{
    public static class TownCitizenExtensions
    {
        /// <summary>
        /// Applique le détail « maison » remonté par le script depuis la page des travaux.
        /// </summary>
        /// <remarks>
        /// <para>
        /// <b>Le niveau de la maison n'est volontairement PAS écrit ici.</b> MyHordes le donne déjà,
        /// pour tous les citoyens et sans saisie : <c>baseDef</c> vaut la défense du prototype de la
        /// maison, fonction du seul niveau (0, 1, 4, 9, 16, 25, 36, 49, 64 — soit n²), et il est
        /// persisté dans <c>HouseDefense</c>. Une valeur lue dans le DOM ne peut être qu'au mieux
        /// redondante, au pire périmée : elle ne doit pas prendre le pas sur celle du jeu.
        /// </para>
        /// <para>
        /// Le script continue de l'envoyer pour l'instant, et le mapping continue de la décoder —
        /// c'est délibéré, le temps de vérifier si un autre consommateur s'en sert. Seule
        /// l'écriture en base est retirée.
        /// </para>
        /// </remarks>
        public static void ImportHomeDetail(this TownCitizen src, TownCitizen homeDetail)
        {
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

        public static void ImportChamanicDetail(this TownCitizen src, TownCitizen chamanicDetail)
        {
            src.IsImmuneToSoul = chamanicDetail.IsImmuneToSoul;
            src.NbPotionChamanique = chamanicDetail.NbPotionChamanique;
            src.IdLastUpdateChamanic = chamanicDetail.IdLastUpdateChamanic;
        }
    }
}
