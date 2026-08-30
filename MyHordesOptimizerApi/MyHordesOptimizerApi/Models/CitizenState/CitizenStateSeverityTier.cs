namespace MyHordesOptimizerApi.Models.CitizenState
{
    /// <summary>
    /// Gravité de l'état atteint en fin de trajet, du meilleur au pire (valeur = rang de tri
    /// ascendant). Hiérarchie fixée en conversation (2026-08-30) : mort > déshydraté > dépendant >
    /// blessé > soif > alcoolisé > drogué > rien. Un seul palier retenu par état : le pire présent.
    /// </summary>
    public enum CitizenStateSeverityTier
    {
        None = 0,
        Drugged = 1,
        Drunk = 2,
        Thirsty = 3,
        Wounded = 4,
        Addicted = 5,
        Dehydrated = 6,
        Dead = 7,
    }
}
