using System;

namespace MyHordesOptimizerApi.Services.Impl.Maps
{
    /// <summary>
    /// Aménagement d'une zone pour le camping (<c>Zone::improvementLevel</c> de MyHordes). MHO ne peut
    /// pas le relever : il est saisi depuis le site, avec son jour, et chaque nuit le fait baisser.
    /// </summary>
    public static class CampImprovement
    {
        /// <summary>Perte de chaque nuit (NightlyHandler : <c>max(0, niveau - 15)</c>).</summary>
        public const int NightlyDecay = 15;

        /// <summary>
        /// Niveau au jour <paramref name="currentDay"/> d'un aménagement saisi à <paramref name="level"/>
        /// le jour <paramref name="day"/>. <c>null</c> si rien n'a été saisi.
        /// </summary>
        public static int? CurrentLevel(int? level, int? day, int currentDay)
        {
            if (!level.HasValue || !day.HasValue)
            {
                return null;
            }

            var nights = Math.Max(0, currentDay - day.Value);
            return Math.Max(0, level.Value - (NightlyDecay * nights));
        }

        /// <summary>
        /// Niveau après une saisie : le niveau donné (<paramref name="exactLevel"/>), sinon le niveau
        /// courant, plus les améliorations et objets de défense ajoutés (négatifs pour annuler).
        /// MHO ne plafonne pas : le jeu n'autorise une amélioration que sous 50, mais c'est au joueur
        /// de saisir ce qu'il a fait.
        /// </summary>
        public static int Apply(int? currentLevel, int? exactLevel, int improvements, int defenseObjects, int improveValue, int objectImproveValue)
        {
            var level = (exactLevel ?? currentLevel ?? 0) + (improvements * improveValue) + (defenseObjects * objectImproveValue);
            return Math.Max(0, level);
        }
    }
}
