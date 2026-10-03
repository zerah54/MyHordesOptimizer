namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Estimations
{
    /// <summary>Réglages de l'attaque d'un jour (null = valeur par défaut).</summary>
    public class AttackSettingsDto
    {
        public int? Souls { get; set; }
        public int? SpaLevel { get; set; }
        public bool Fireworks { get; set; }

        /// <summary>En lecture : âmes appliquées quand <see cref="Souls"/> est null (ignoré en écriture).</summary>
        public int DefaultSouls { get; set; }

        /// <summary>En lecture : niveau SPA appliqué quand <see cref="SpaLevel"/> est null (ignoré en écriture).</summary>
        public int DefaultSpaLevel { get; set; }

        /// <summary>En lecture : true si les défauts viennent de la tour du jour, false du planificateur de la veille.</summary>
        public bool DefaultFromTdg { get; set; }
    }
}
