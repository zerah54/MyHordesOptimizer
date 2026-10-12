namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Citizens
{
    /// <summary>
    /// Niveau du citoyen dans chaque groupe de capacités héroïques : 0 aucun, 1 à 4 (Débutant à Élite).
    /// <c>null</c> : inconnu. MyHordes ne l'expose pas : saisi à la main.
    /// </summary>
    public class CitizenHeroSkillLevelsDto
    {
        public const int MaxLevel = 4;

        /// <summary>Stratégie.</summary>
        public int? S { get; set; }

        /// <summary>Prudence (« Umsicht »).</summary>
        public int? U { get; set; }

        /// <summary>Préparation.</summary>
        public int? P { get; set; }

        /// <summary>Endurance (« Eifer »).</summary>
        public int? E { get; set; }

        /// <summary>Repos : Campeur pro, et plafond de camping à 99 % au niveau 4.</summary>
        public int? R { get; set; }

        public bool IsValid()
        {
            return IsValidLevel(S) && IsValidLevel(U) && IsValidLevel(P) && IsValidLevel(E) && IsValidLevel(R);
        }

        public static bool IsValidLevel(int? level)
        {
            return level is null or (>= 0 and <= MaxLevel);
        }
    }
}
