using System;
using System.Collections.Generic;
using System.Linq;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;

namespace MyHordesOptimizerApi.Services.Impl.Estimations
{
    /// <summary>
    /// Facteur d'âmes rouges du jeu : min(1 + p·âmes, plafond) ; plafond 1,2 (RNE/RE/CUSTOM/inconnu) ou 666 (PANDE).
    /// p dépend du niveau du bâtiment votable <c>item_soul_blue_static</c> (« SPA ») : 0,04 sous le niveau 2,
    /// 0,02 à partir du niveau 2 (<c>BuildingQueryListener.php</c>, <c>NightlyRedSoulPenalty</c>).
    /// </summary>
    public static class RedSoulFactor
    {
        public const double PenaltyPerSoul = 0.04;
        public const double PenaltyPerSoulPurified = 0.02;
        public const int PurifiedSpaLevel = 2;

        public static double PenaltyPerSoulForLevel(int spaLevel) => spaLevel >= PurifiedSpaLevel ? PenaltyPerSoulPurified : PenaltyPerSoul;

        public static double Compute(int souls, int? townTypeId, int spaLevel = 0)
        {
            double cap = townTypeId == (int)TownType.PANDE ? 666.0 : 1.2;
            return Math.Min(1.0 + PenaltyPerSoulForLevel(spaLevel) * souls, cap);
        }
    }

    /// <summary>
    /// Âmes rouges supposées pour un calcul d'attaque : présentes à la lecture de chaque palier (tour du jour D
    /// et planif D-1, clé = % du palier) et présentes à l'attaque. Palier absent = 0 âme. Chaque famille (tour,
    /// planif, attaque) porte aussi son niveau SPA (0-3, défaut 0) : le vote peut passer entre la lecture des
    /// estimations et l'attaque de la nuit, changeant le facteur par âme appliqué.
    /// </summary>
    public sealed class SoulsScenario
    {
        public const int MaxSouls = 1000;
        public const int MaxSpaLevel = 3;

        public int AtAttack { get; }
        public int AttackSpaLevel { get; }
        public int EstimSpaLevel { get; }
        public int PlanifSpaLevel { get; }
        public IReadOnlyDictionary<int, int> Estim { get; }
        public IReadOnlyDictionary<int, int> Planif { get; }

        public SoulsScenario(int atAttack, IReadOnlyDictionary<int, int> estim, IReadOnlyDictionary<int, int> planif,
            int attackSpaLevel = 0, int estimSpaLevel = 0, int planifSpaLevel = 0)
        {
            AtAttack = atAttack;
            Estim = estim;
            Planif = planif;
            AttackSpaLevel = attackSpaLevel;
            EstimSpaLevel = estimSpaLevel;
            PlanifSpaLevel = planifSpaLevel;
        }

        /// <summary>Vrai quand aucune âme n'est supposée : le calcul reste alors celui d'avant le mode âmes.</summary>
        public bool IsNeutral => AtAttack == 0 && Estim.Values.All(souls => souls == 0) && Planif.Values.All(souls => souls == 0);
    }
}
