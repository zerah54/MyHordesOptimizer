using MyHordesOptimizerApi.Models;
using System;

namespace MyHordesOptimizerApi.Extensions
{
    /// <summary>
    /// Fourchette certaine du nombre de fouilles restantes d'une case, tirée d'une observation
    /// (état natif de la case, relevé du Fouineur, saisie manuelle).
    /// </summary>
    /// <param name="Min">Borne basse, incluse.</param>
    /// <param name="Max">Borne haute, incluse ; <c>null</c> quand il n'y en a pas.</param>
    public readonly record struct DigBounds(int Min, int? Max)
    {
        /// <summary>Case épuisée : plus rien à trouver, quel qu'ait été l'historique.</summary>
        public static DigBounds Depleted => new(0, 0);

        /// <summary>Case non épuisée : au moins une fouille possible.</summary>
        public static DigBounds NotDepleted => new(1, null);

        /// <summary>
        /// Fourchette d'un niveau d'abondance du Fouineur, telle que MyHordes la calcule
        /// (<c>BeyondController</c>, <c>dig_level</c>) : 0 épuisée, 1 de 1 à 2, 2 de 3 à 6, 3 à partir de 7.
        /// </summary>
        public static DigBounds ForScavLevel(int level)
        {
            return level switch
            {
                <= 0 => Depleted,
                1 => new(1, 2),
                2 => new(3, 6),
                _ => new(7, null)
            };
        }

        /// <summary>
        /// Deux observations simultanées : on garde ce qu'elles ont en commun. Si elles se contredisent
        /// (case vue vide par l'une, non vide par l'autre), la plus récente, <paramref name="other"/>, l'emporte.
        /// </summary>
        public DigBounds Intersect(DigBounds other)
        {
            return Overlaps(other) ? new DigBounds(Math.Max(Min, other.Min), CommonMax(other)) : other;
        }

        /// <summary>Les deux fourchettes ont au moins une valeur en commun : les observations sont compatibles.</summary>
        public bool Overlaps(DigBounds other)
        {
            int? max = CommonMax(other);
            return !max.HasValue || Math.Max(Min, other.Min) <= max.Value;
        }

        private int? CommonMax(DigBounds other)
        {
            return Max.HasValue && other.Max.HasValue ? Math.Min(Max.Value, other.Max.Value) : Max ?? other.Max;
        }
    }

    /// <summary>
    /// Fouilles restantes d'une case. <see cref="MapCell.AveragePotentialRemainingDig"/> (estimation
    /// moyenne) et <see cref="MapCell.MaxPotentialRemainingDig"/> (plafond) portent directement ce
    /// qu'il RESTE à trouver ; ils évoluent au fil des événements :
    /// <list type="bullet">
    /// <item>une observation ramène les deux valeurs dans sa fourchette (case épuisée : 0, quelles
    /// qu'aient été les valeurs précédentes, désormais obsolètes) ;</item>
    /// <item>une régénération ou une excavation les fait remonter ;</item>
    /// <item>une fouille réussie les fait baisser, sans descendre sous 0.</item>
    /// </list>
    /// Les colonnes ont gardé leur nom : jusqu'au 23 septembre 2026, elles portaient un potentiel
    /// dont le site soustrayait toutes les fouilles réussies enregistrées, ce qui empêchait toute
    /// remise à zéro (voir le script SQL du même jour).
    /// </summary>
    public static class MapCellDigsExtensions
    {
        /// <summary>
        /// Applique une observation : les deux valeurs sont ramenées dans la fourchette, et la case
        /// n'est marquée épuisée que si la fourchette l'impose.
        /// </summary>
        public static void ApplyObservation(this MapCell cell, DigBounds bounds)
        {
            cell.IsDryed = bounds.Max == 0;
            cell.ClampRemaining(bounds);
        }

        /// <summary>
        /// Ramène les fouilles restantes dans une fourchette sans toucher au marqueur « épuisée ».
        /// Une valeur inconnue prend la borne basse.
        /// </summary>
        public static void ClampRemaining(this MapCell cell, DigBounds bounds)
        {
            double average = cell.AveragePotentialRemainingDig ?? bounds.Min;
            int maximum = cell.MaxPotentialRemainingDig ?? bounds.Min;

            average = Math.Max(average, bounds.Min);
            maximum = Math.Max(maximum, bounds.Min);
            if (bounds.Max.HasValue)
            {
                average = Math.Min(average, bounds.Max.Value);
                maximum = Math.Min(maximum, bounds.Max.Value);
            }

            cell.AveragePotentialRemainingDig = (float)average;
            cell.MaxPotentialRemainingDig = maximum;
        }

        /// <summary>
        /// Écart sur les fouilles réussies enregistrées (addon ou saisie manuelle) : un écart positif
        /// consomme des fouilles, un écart négatif (estimation revue à la baisse, fouille supprimée)
        /// les rend — sauf sur une case vue épuisée, où l'observation prime.
        /// </summary>
        public static void ApplySuccessfulDigsDelta(this MapCell cell, int delta)
        {
            if (delta > 0)
            {
                cell.AveragePotentialRemainingDig = (float)Math.Max(0, (cell.AveragePotentialRemainingDig ?? 0) - delta);
                cell.MaxPotentialRemainingDig = Math.Max(0, (cell.MaxPotentialRemainingDig ?? 0) - delta);
            }
            else if (delta < 0 && cell.IsDryed != true)
            {
                cell.AddDigs(-delta, -delta, null);
            }
        }

        /// <summary>
        /// Objets ajoutés au sol (régénération, excavation). Le marqueur « épuisée » n'est pas touché :
        /// c'est à l'appelant de le lever quand l'ajout est certain (excavation, vent connu).
        /// </summary>
        /// <param name="averageGain">Gain moyen attendu.</param>
        /// <param name="maximumGain">Gain maximal possible.</param>
        /// <param name="cap">Plafond d'objets par case, <c>null</c> sans plafond.</param>
        public static void AddDigs(this MapCell cell, double averageGain, int maximumGain, int? cap)
        {
            double average = (cell.AveragePotentialRemainingDig ?? 0) + averageGain;
            int maximum = (cell.MaxPotentialRemainingDig ?? 0) + maximumGain;
            if (cap.HasValue)
            {
                average = Math.Min(average, cap.Value);
                maximum = Math.Min(maximum, cap.Value);
            }

            cell.AveragePotentialRemainingDig = (float)Math.Round(average, 3);
            cell.MaxPotentialRemainingDig = maximum;
        }

        /// <summary>
        /// Excavation du Fouineur (capacité héroïque) : régénération forcée de la zone, 8 à 15 objets
        /// sans tirage de chance (<c>RegenerateZoneAction</c> avec <c>force</c>). Le jeu ne l'autorise
        /// que sur une zone vide (<c>zone_must_be_empty</c>) : les fouilles restantes valent exactement
        /// le gain, quelles qu'aient été les estimations d'avant. Certaine : la case n'est plus épuisée.
        /// </summary>
        public static void ApplyExcavation(this MapCell cell, double averageGain, int maximumGain, int? cap)
        {
            cell.AveragePotentialRemainingDig = 0;
            cell.MaxPotentialRemainingDig = 0;
            cell.AddDigs(averageGain, maximumGain, cap);
            cell.IsDryed = false;
        }
    }
}
