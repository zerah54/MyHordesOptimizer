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
}
