using Microsoft.EntityFrameworkCore;
using MyHordesOptimizerApi.Configuration.Interfaces;
using MyHordesOptimizerApi.Extensions;
using MyHordesOptimizerApi.Models;
using System;
using System.Collections.Generic;
using System.Linq;

namespace MyHordesOptimizerApi.Services.Impl.Maps
{
    /// <summary>
    /// Ce que prouve une case vue vide puis retrouvée non vide : elle a été régénérée au moins une fois
    /// depuis (rien d'autre ne remplit une zone, en dehors de l'excavation, relevée à part).
    /// </summary>
    /// <param name="Minimum">Borne basse : le plus petit gain d'une régénération, moins les fouilles réussies enregistrées depuis.</param>
    /// <param name="Average">Espérance du gain sachant qu'il y a eu au moins une régénération, moins ces fouilles.</param>
    /// <param name="Maximum">Borne haute : le plus grand gain de chaque nuit possible, moins ces fouilles.</param>
    public readonly record struct RegenerationInference(int Minimum, double Average, int Maximum)
    {
        /// <summary>
        /// Déduction à partir des nuits qui ont pu régénérer la case (probabilité &gt; 0 chacune).
        /// Pour des probabilités p₁…pₙ, le nombre moyen de régénérations sachant qu'il y en a eu au moins
        /// une vaut Σp / (1 − Π(1 − p)). Approximation : la chance réduite d'une zone déjà remplie
        /// (au-delà de 10 objets) n'est pas appliquée aux nuits qui suivent une première régénération.
        /// </summary>
        /// <returns><c>null</c> si aucune nuit ne pouvait régénérer la case : l'observation est incohérente
        /// avec l'historique (relevé périmé, vent mal enregistré) et n'en dit pas plus que « pas vide ».</returns>
        public static RegenerationInference? From(IReadOnlyCollection<double> probabilities,
            int successfulDigsSince,
            double averageAmount,
            int minimumAmount,
            int maximumAmount,
            int? maxItemPerCell)
        {
            double expectedRegenerations = 0;
            double noRegeneration = 1;
            foreach (double probability in probabilities)
            {
                expectedRegenerations += probability;
                noRegeneration *= 1 - probability;
            }
            double atLeastOne = 1 - noRegeneration;
            if (probabilities.Count == 0 || atLeastOne <= 0)
            {
                return null;
            }

            int maximum = probabilities.Count * maximumAmount - successfulDigsSince;
            if (maxItemPerCell.HasValue)
            {
                maximum = Math.Min(maximum, maxItemPerCell.Value);
            }
            // « Pas vide » est certain : au moins 1, même si plus de fouilles ont été enregistrées que
            // les régénérations n'en permettent (fouilles comptées en trop par l'addon).
            maximum = Math.Max(1, maximum);
            int minimum = Math.Clamp(minimumAmount - successfulDigsSince, 1, maximum);
            double average = Math.Clamp(expectedRegenerations / atLeastOne * averageAmount - successfulDigsSince, minimum, maximum);
            return new RegenerationInference(minimum, average, maximum);
        }
    }

    /// <summary>
    /// Observations de l'état de fouille des zones au cours d'une mise à jour (état natif, note « zone
    /// épuisée », relevés du Fouineur, saisie manuelle). En plus de ramener les fouilles restantes dans
    /// la fourchette observée (<see cref="MapCellDigsExtensions.ApplyObservation"/>), elle exploite
    /// l'historique des nuits :
    /// <list type="bullet">
    /// <item>une case vue vide puis retrouvée non vide a été régénérée : minimum, moyenne et plafond sont
    /// recalculés sur les nuits qui ont pu la toucher (<see cref="RegenerationInference"/>) ;</item>
    /// <item>si une seule de ces nuits était possible et que son vent était inconnu, la case révèle ce
    /// vent : la nuit est corrigée, et les autres cases avec elle.</item>
    /// </list>
    /// Une instance par mise à jour, sous le verrou de la ville, APRÈS la régénération des nuits en
    /// attente (<see cref="DigRegeneration.ApplyPendingNights"/>).
    /// <para>
    /// L'état natif (API MyHordes) est lu par le serveur au moment de la mise à jour : il est plus récent
    /// que la page lue par l'addon, qui a pu être affichée avant qu'un autre citoyen vide la zone. Il est
    /// retenu (<see cref="ObserveAuthoritative"/>) et appliqué en dernier (<see cref="ApplyAuthoritative"/>) ;
    /// une observation de la page qui le contredit est ignorée, sans ses effets (déduction, vent révélé).
    /// </para>
    /// </summary>
    public sealed class DigObservations
    {
        private readonly int? _day;
        private readonly int _windDistance;
        private readonly double _averageAmount;
        private readonly int _minimumAmount;
        private readonly int _maximumAmount;
        private readonly int _crowdThreshold;
        private readonly int? _maxItemPerCell;
        private readonly Func<IReadOnlyCollection<MapCellDigUpdate>> _loadNights;
        private readonly Func<MapCell, int, int> _successfulDigsSince;
        private readonly Func<IEnumerable<MapCell>> _loadTownCells;
        private IReadOnlyCollection<MapCellDigUpdate>? _nights;
        private readonly Dictionary<MapCell, DigBounds> _authoritative = new(ReferenceEqualityComparer.Instance);

        /// <param name="day">Jour de la ville au moment des observations ; <c>null</c> : observations
        /// appliquées sans historique (ville inconnue).</param>
        /// <param name="windDistance">Distance du vent de la ville (<see cref="DigRegeneration.WindDistanceFor"/>).</param>
        /// <param name="loadNights">Nuits enregistrées de la ville, y compris celles ajoutées dans la mise à jour en cours.</param>
        /// <param name="successfulDigsSince">Fouilles réussies enregistrées pour la case APRÈS le jour donné.</param>
        /// <param name="loadTownCells">Cases de la ville, suivies par le contexte : corrigées quand un vent est révélé.</param>
        public DigObservations(int? day,
            int windDistance,
            IMyHordesScrutateurConfiguration configuration,
            Func<IReadOnlyCollection<MapCellDigUpdate>> loadNights,
            Func<MapCell, int, int> successfulDigsSince,
            Func<IEnumerable<MapCell>> loadTownCells)
        {
            _day = day;
            _windDistance = windDistance;
            _averageAmount = (configuration.MinItemAdd + configuration.MaxItemAdd) / 2.0;
            _minimumAmount = configuration.MinItemAdd;
            _maximumAmount = configuration.MaxItemAdd;
            _crowdThreshold = configuration.DigThrottle;
            _maxItemPerCell = configuration.MaxItemPerCell;
            _loadNights = loadNights;
            _successfulDigsSince = successfulDigsSince;
            _loadTownCells = loadTownCells;
        }

        /// <summary>Observations d'une ville, avec son historique en base.</summary>
        public static DigObservations ForTown(MhoContext dbContext,
            Town town,
            int day,
            IMyHordesScrutateurConfiguration configuration,
            Func<IEnumerable<MapCell>> loadTownCells)
        {
            int townId = town.IdTown;
            return new DigObservations(day,
                DigRegeneration.WindDistanceFor(town, configuration),
                configuration,
                () =>
                {
                    // Load puis Local : la nuit du jour, tout juste ajoutée par ApplyPendingNights, n'est
                    // pas encore en base.
                    dbContext.MapCellDigUpdates.Where(update => update.IdTown == townId).Load();
                    return dbContext.MapCellDigUpdates.Local.Where(update => update.IdTown == townId).ToList();
                },
                (cell, sinceDay) => cell.IdCell == 0
                    ? 0
                    : dbContext.MapCellDigs
                        .Where(dig => dig.IdCell == cell.IdCell && dig.Day > sinceDay)
                        .Sum(dig => dig.NbSucces) ?? 0,
                loadTownCells);
        }

        /// <summary>Observations appliquées telles quelles, faute de ville connue.</summary>
        public static DigObservations WithoutHistory(IMyHordesScrutateurConfiguration configuration)
        {
            return new DigObservations(null,
                configuration.WindDistance,
                configuration,
                () => Array.Empty<MapCellDigUpdate>(),
                (_, _) => 0,
                () => Enumerable.Empty<MapCell>());
        }

        /// <summary>
        /// Applique une observation de la page (note « zone épuisée », relevés du Fouineur, saisie), sauf
        /// si elle contredit l'état natif retenu pour la même case.
        /// </summary>
        /// <returns><c>false</c> si l'observation a été ignorée.</returns>
        public bool Observe(MapCell cell, DigBounds bounds)
        {
            if (_authoritative.TryGetValue(cell, out var reference) && !reference.Overlaps(bounds))
            {
                return false;
            }
            Apply(cell, bounds);
            return true;
        }

        /// <summary>Retient l'état natif d'une case, appliqué par <see cref="ApplyAuthoritative"/>.</summary>
        public void ObserveAuthoritative(MapCell cell, DigBounds bounds)
        {
            _authoritative[cell] = _authoritative.TryGetValue(cell, out var previous) ? previous.Intersect(bounds) : bounds;
        }

        /// <summary>
        /// Applique les états natifs retenus, après toutes les observations de la page.
        /// </summary>
        /// <returns>Les fourchettes appliquées, par case.</returns>
        public IReadOnlyList<(MapCell Cell, DigBounds Bounds)> ApplyAuthoritative()
        {
            var pending = _authoritative.Select(entry => (Cell: entry.Key, Bounds: entry.Value)).ToList();
            _authoritative.Clear();
            foreach (var (cell, bounds) in pending)
            {
                Apply(cell, bounds);
            }
            return pending;
        }

        /// <summary>
        /// Applique une observation à une case et date l'observation. Une case vue vide puis observée
        /// non vide reçoit d'abord ce que prouve la régénération ; l'observation reste la référence en
        /// cas de désaccord (un Fouineur qui voit moins que la déduction trahit des fouilles non
        /// enregistrées).
        /// </summary>
        private void Apply(MapCell cell, DigBounds bounds)
        {
            DigBounds applied = bounds;
            if (_day.HasValue && bounds.Min >= 1 && cell.IsDryed == true && cell.DigsObservedDay.HasValue)
            {
                var possibleNights = PossibleNightsSince(cell, cell.DigsObservedDay.Value);
                var inference = RegenerationInference.From(possibleNights.Select(entry => entry.Probability).ToList(),
                    _successfulDigsSince(cell, cell.DigsObservedDay.Value),
                    _averageAmount,
                    _minimumAmount,
                    _maximumAmount,
                    _maxItemPerCell);
                if (inference.HasValue)
                {
                    cell.AveragePotentialRemainingDig = (float)Math.Round(inference.Value.Average, 3);
                    cell.MaxPotentialRemainingDig = inference.Value.Maximum;
                    applied = new DigBounds(inference.Value.Minimum, inference.Value.Maximum).Intersect(bounds);

                    // Une seule nuit possible, au vent inconnu : c'est elle, et le vent soufflait vers la case.
                    if (possibleNights.Count == 1 && DigRegeneration.IsWindUnknown(possibleNights[0].Night) && cell.ZoneRegen.HasValue)
                    {
                        RevealWind(possibleNights[0].Night, cell);
                    }
                }
            }

            cell.ApplyObservation(applied);
            if (_day.HasValue)
            {
                cell.DigsObservedDay = _day.Value;
            }
        }

        /// <summary>
        /// Correction d'une case quand le vent d'une nuit, jusque-là inconnu, est révélé. La nuit lui avait
        /// apporté un huitième de l'espérance et le gain maximal : dans le vent, elle reçoit les sept
        /// huitièmes manquants ; hors du vent, elle perd ce huitième et ce gain maximal. La chance réduite
        /// d'une zone déjà remplie est estimée sur les fouilles restantes actuelles.
        /// </summary>
        public static void CorrectForRevealedWind(MapCell cell,
            bool inWind,
            double chance,
            double averageAmount,
            int maximumAmount,
            int crowdThreshold,
            int? maxItemPerCell)
        {
            double crowdFactor = (cell.AveragePotentialRemainingDig ?? 0) >= crowdThreshold ? DigRegeneration.CrowdedZoneChanceFactor : 1;
            double eighth = chance * crowdFactor * averageAmount / DigRegeneration.WindDirectionCount;
            if (inWind)
            {
                cell.AddDigs(eighth * (DigRegeneration.WindDirectionCount - 1), 0, maxItemPerCell);
                return;
            }
            int maximum = Math.Max(0, (cell.MaxPotentialRemainingDig ?? 0) - maximumAmount);
            double average = Math.Min(Math.Max(0, (cell.AveragePotentialRemainingDig ?? 0) - eighth), maximum);
            cell.AveragePotentialRemainingDig = (float)Math.Round(average, 3);
            cell.MaxPotentialRemainingDig = maximum;
        }

        private IReadOnlyCollection<MapCellDigUpdate> Nights => _nights ??= _loadNights();

        /// <summary>Nuits postérieures au jour donné qui ont pu régénérer la case, avec leur probabilité.</summary>
        private List<(MapCellDigUpdate Night, double Probability)> PossibleNightsSince(MapCell cell, int sinceDay)
        {
            return Nights
                .Where(night => night.Day > sinceDay && night.Day <= _day)
                .Select(night => (Night: night, Probability: DigRegeneration.RegenerationProbability(cell, night, _windDistance)))
                .Where(entry => entry.Probability > 0)
                .ToList();
        }

        /// <summary>
        /// Enregistre le vent révélé et corrige les cases que la nuit avait touchées à l'aveugle. Les cases
        /// observées depuis cette nuit sont laissées telles quelles : leur état en tient déjà compte.
        /// </summary>
        private void RevealWind(MapCellDigUpdate night, MapCell revealer)
        {
            int wind = revealer.ZoneRegen!.Value;
            night.DirectionRegen = wind;
            double chance = (night.TauxRegen ?? 0) / 100.0;

            foreach (var cell in _loadTownCells())
            {
                if (ReferenceEquals(cell, revealer)
                    || cell.IsTown == true
                    || !cell.NbKm.HasValue
                    || cell.NbKm.Value <= _windDistance
                    || !cell.ZoneRegen.HasValue
                    || (cell.DigsObservedDay.HasValue && cell.DigsObservedDay.Value >= night.Day))
                {
                    continue;
                }
                CorrectForRevealedWind(cell, cell.ZoneRegen.Value == wind, chance, _averageAmount, _maximumAmount, _crowdThreshold, _maxItemPerCell);
            }
        }
    }
}
