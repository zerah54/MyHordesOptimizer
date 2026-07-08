namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Estimations
{
    /// <summary>
    /// Difficulté des attaques d'une ville (MyHordes features.attacks). Détermine le ratio des bornes
    /// et, pour Hard, le re-tirage du nombre de zombies dans la bande cible.
    /// RNE / RE / PANDE sont toujours Normal ; Easy / Hard n'existent que sur les villes CUSTOM et ne
    /// sont exposés par aucune API MyHordes (à renseigner via les futurs paramètres custom de ville).
    /// </summary>
    public enum AttackDifficulty
    {
        Easy,
        Normal,
        Hard
    }
}
