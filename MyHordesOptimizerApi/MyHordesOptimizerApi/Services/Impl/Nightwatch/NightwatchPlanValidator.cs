using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Nightwatch;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Nightwatch.Request;
using MyHordesOptimizerApi.Exceptions;
using MyHordesOptimizerApi.Extensions;
using System.Linq;
using System.Text;

namespace MyHordesOptimizerApi.Services.Impl.Nightwatch
{
    /// <summary>Validation des entrées d'une proposition de plan de veille (les identifiants ne sont pas vérifiés en base).</summary>
    public static class NightwatchPlanValidator
    {
        public const int MaxContentBytes = 262144;
        private const int MaxWatchers = 500;
        private const int MaxItems = 500;
        private const int MaxQuantity = 10000;
        private const int MaxDefenseValue = 100000;
        private const int MaxPastWatches = 1000;
        private const int MaxNote = 200;
        private const int MaxInstructions = 2000;
        private static readonly string[] Statuses = { "drugged", "drunk", "thirsty", "immune", "dog", "dogSteak", "ghoul", "notGhoul" };

        public static string NormalizeName(string? name)
        {
            var trimmed = name?.Trim();
            if (string.IsNullOrEmpty(trimmed) || trimmed.Length > 64)
            {
                throw new MhoTechnicalException("Le nom de la proposition doit faire entre 1 et 64 caractères.");
            }
            return trimmed;
        }

        public static void ValidateDay(int day)
        {
            Check(day >= 1, $"Jour {day} invalide : le premier jour est le 1.");
        }

        public static string SerializeContent(NightwatchPlanContentDto? content)
        {
            if (content is null)
            {
                throw new MhoTechnicalException("Contenu de proposition absent.");
            }
            Check(content.AttackOverride is null || (content.AttackOverride >= 0 && content.AttackOverride <= 100000), "Attaque invalide.");
            Check(content.Instructions is null || content.Instructions.Length <= MaxInstructions, "Consignes trop longues.");
            Check(content.BuildingPlanId is null || content.BuildingPlanId > 0, "Proposition de Chantiers invalide.");
            Check(content.Watchers.Count <= MaxWatchers, "Trop de veilleurs.");
            Check(content.Watchers.Select(watcher => watcher.UserId).Distinct().Count() == content.Watchers.Count, "Veilleur en double.");
            Check(content.ManualStock.Count <= MaxItems, "Trop d'objets en stock manuel.");
            Check(content.ManualStock.Values.All(quantity => quantity >= 0 && quantity <= MaxQuantity), "Stock manuel invalide.");

            Check(content.GlobalItems is null || content.GlobalItems.Count <= MaxItems, "Trop d'objets globaux.");
            Check(content.GlobalItems is null || content.GlobalItems.Values.All(quantity => quantity >= 0 && quantity <= MaxQuantity), "Objets globaux invalides.");
            Check(InRange(content.AllowedOverflow), "Débordement autorisé invalide.");
            Check(content.AttackReductionPercent is null || (content.AttackReductionPercent >= 0 && content.AttackReductionPercent <= 100), "Réduction d'attaque invalide.");
            Check(InRange(content.ReactorDamage), "Dégâts du réacteur invalides.");
            if (content.CityDefense is { } defense)
            {
                Check(defense.AdLevel is null || (defense.AdLevel >= -1 && defense.AdLevel <= 3), "Niveau d'AD invalide.");
                Check(defense.FddCoefficient is null || (double.IsFinite(defense.FddCoefficient.Value) && defense.FddCoefficient >= 0 && defense.FddCoefficient <= 10), "Coefficient FDD invalide.");
                Check(new[] { defense.Buildings, defense.Upgrades, defense.Wall, defense.BankDefenseItems, defense.Homes, defense.Guardians, defense.GuardTowerPa, defense.Souls, defense.Cemetery, defense.EveningVote, defense.DumpContribution }.All(InRange), "Défense de la ville invalide.");
            }

            foreach (var watcher in content.Watchers)
            {
                Check(watcher.Statuses.All(Statuses.Contains), "Statut de veilleur inconnu.");
                Check(watcher.Statuses.Distinct().Count() == watcher.Statuses.Count, "Statut de veilleur en double.");
                Check(watcher.Items.Count <= MaxItems, "Trop d'objets pour un veilleur.");
                Check(watcher.Items.Values.All(quantity => quantity > 0 && quantity <= MaxQuantity), "Quantité d'objet invalide.");
                Check(watcher.PastWatches is null || (watcher.PastWatches >= 0 && watcher.PastWatches <= MaxPastWatches), "Nombre de veilles passées invalide.");
                Check(watcher.Note is null || watcher.Note.Length <= MaxNote, "Note de veilleur trop longue.");
            }

            var json = content.ToJson();
            Check(Encoding.UTF8.GetByteCount(json) <= MaxContentBytes, "La proposition dépasse la taille maximale (256 Ko).");
            return json;
        }

        /// <summary>Valide une simulation (nom, dernier jour au moins égal au jour courant, stock borné) ; renvoie le nom normalisé.</summary>
        public static string ValidateSimulation(NightwatchSimulationRequestDto request, int currentDay)
        {
            var name = NormalizeName(request.Name);
            Check(request.LastDay >= currentDay, "Le dernier jour de la simulation ne peut pas précéder le jour courant.");
            Check(request.Stock.Count <= MaxItems, "Trop d'objets dans le stock.");
            Check(request.Stock.Values.All(quantity => quantity >= 0 && quantity <= MaxQuantity), "Stock invalide.");
            return name;
        }

        private static bool InRange(int? value) => value is null || (value >= 0 && value <= MaxDefenseValue);

        private static void Check(bool condition, string message)
        {
            if (!condition)
            {
                throw new MhoTechnicalException(message);
            }
        }
    }
}
