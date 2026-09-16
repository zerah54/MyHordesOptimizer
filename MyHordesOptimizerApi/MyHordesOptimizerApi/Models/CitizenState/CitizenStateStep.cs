namespace MyHordesOptimizerApi.Models.CitizenState
{
    public abstract class CitizenStateStep
    {
    }

    public class ItemActionStep : CitizenStateStep
    {
        public int ItemId { get; set; }
    }

    public class MoveStep : CitizenStateStep
    {
        /// <summary>true = zone à distance &lt; 3 du centre (coûte de l'AP), false = zone lointaine (coûte du SP).</summary>
        public bool IsNearZone { get; set; }
    }

    public class EquipShoesStep : CitizenStateStep
    {
    }

    public class MountBikeStep : CitizenStateStep
    {
    }

    public class DismountBikeStep : CitizenStateStep
    {
    }

    /// <summary>Ramasse le seul objet du jeu taggé `defence_cp` (car_door_#00) — voir CitizenPdcRules.</summary>
    public class PickupDefenceCpItemStep : CitizenStateStep
    {
    }

    /// <summary>
    /// Ghoulification déterministe (contourne le tirage aléatoire du jeu — voir "ghoul_25_100" etc.
    /// dans actions.json, toujours ignoré par ce moteur comme tout mécanisme de dé).
    /// </summary>
    public class BecomeGhoulStep : CitizenStateStep
    {
    }

    /// <summary>
    /// Second Souffle (action héroïque "hero_sw") — 4 niveaux de l'arbre Endurant, valeurs absolues
    /// (pas cumulatives) : 0=(3 PA,1 PE) / 1=(3 PA,3 PE) / 2=(4 PA,4 PE) / 3=(4 PA,6 PE). Variante
    /// historique (6 PA, 0 PE, débloquée à 151 pts sans arbre) hors périmètre — voir CitizenPointRules.
    /// </summary>
    public class SecondWindStep : CitizenStateStep
    {
        public int Level { get; set; }
    }
}
