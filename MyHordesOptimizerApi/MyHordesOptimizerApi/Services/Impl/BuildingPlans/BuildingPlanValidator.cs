using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.BuildingPlans;
using MyHordesOptimizerApi.Exceptions;
using MyHordesOptimizerApi.Extensions;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;

namespace MyHordesOptimizerApi.Services.Impl.BuildingPlans
{
    /// <summary>Validation des entrées d'une proposition (les identifiants ne sont pas vérifiés en base).</summary>
    public static class BuildingPlanValidator
    {
        public const int MaxContentBytes = 262144;
        private const int MaxRows = 500;
        private const int MaxLabel = 64;
        private const int MaxText = 200;
        private const int MaxInstructions = 2000;
        private const int MaxPa = 1000;
        private const int MaxItemValue = 10000;
        private const int MaxPlanTier = 2;
        private const int MaxUpgradeLevel = 20;
        /// <summary>Utilisations d'une action dans la journée : 3 fouilles des galeries pour le Fouineur (MyHordes, <c>home_scavenge_pro</c>).</summary>
        private const int MaxActionUses = 3;
        private static readonly string[] Pools = { "banned", "regular" };
        private static readonly string[] BuildingStepKinds = { "build", "repair" };
        private static readonly string[] Modes = { "finish", "leave", "survive" };
        private static readonly string[] LossKinds = { "destroyed", "bonus" };
        private static readonly string[] TaskKinds = { "home", "homeUpgrade", "action", "free" };
        private static readonly Regex TaskIdPattern = new("^[A-Za-z0-9_-]{1,24}$", RegexOptions.Compiled);
        private static readonly Regex ActionKeyPattern = new("^[a-z_]{1,64}$", RegexOptions.Compiled);

        public static string NormalizeName(string? name)
        {
            var trimmed = name?.Trim();
            if (string.IsNullOrEmpty(trimmed) || trimmed.Length > 64)
            {
                throw new MhoTechnicalException("Le nom de la proposition doit faire entre 1 et 64 caractères.");
            }
            return trimmed;
        }

        public static string SerializeContent(BuildingPlanContentDto? content)
        {
            if (content is null)
            {
                throw new MhoTechnicalException("Contenu de proposition absent.");
            }
            Check(content.BasePa >= 0 && content.BasePa <= MaxPa, "PA de base invalides.");
            Check(content.AllowedOverflow >= 0 && content.AllowedOverflow <= 100000, "Débordement autorisé invalide.");
            Check(content.AttackOverride is null || (content.AttackOverride >= 0 && content.AttackOverride <= 100000), "Attaque invalide.");
            Check(content.Citizens.Count <= MaxRows, "Trop de citoyens.");
            Check(content.TownLines.Count <= MaxRows, "Trop de lignes ville.");
            Check(content.DefenseSources.Count <= MaxRows, "Trop de sources de défense.");
            Check(content.Programs.Banned.Count <= MaxRows && content.Programs.Regular.Count <= MaxRows, "Trop d'étapes.");
            Check(content.Instructions is null || content.Instructions.Length <= MaxInstructions, "Consignes du jour trop longues.");
            Check(content.PlanTiers.Count <= MaxRows, "Trop de niveaux de plan.");
            Check(content.PlanTiers.Values.All(tier => tier >= 0 && tier <= MaxPlanTier), "Niveau de plan invalide.");
            Check(content.Losses.Count <= MaxRows, "Trop de pertes prévues.");
            Check(content.Losses.All(loss => LossKinds.Contains(loss.Kind)), "Type de perte inconnu.");
            Check(content.Losses.Select(loss => (loss.BuildingId, loss.Kind)).Distinct().Count() == content.Losses.Count, "Perte prévue en double.");

            foreach (var citizen in content.Citizens)
            {
                Check(citizen.BasePaOverride is null || (citizen.BasePaOverride >= 0 && citizen.BasePaOverride <= MaxPa), "PA de base citoyen invalides.");
                Check(citizen.Tasks.Count <= MaxRows, "Trop de tâches pour un citoyen.");
                foreach (var task in citizen.Tasks)
                {
                    ValidateTask(task);
                }
                var ids = citizen.Tasks.Where(task => task.Id is not null).Select(task => task.Id).ToList();
                Check(ids.Distinct().Count() == ids.Count, "Identifiant de tâche en double.");
            }
            foreach (var line in content.TownLines)
            {
                Check(Pools.Contains(line.Pool), $"Poche inconnue : {line.Pool}.");
                Check(line.Pa >= -MaxPa && line.Pa <= MaxPa, "PA de ligne ville invalides.");
                Check(line.Label.Length <= MaxLabel, "Libellé de ligne trop long.");
            }
            foreach (var step in content.Programs.Banned.Concat(content.Programs.Regular))
            {
                ValidateStep(step);
            }
            foreach (var source in content.DefenseSources)
            {
                Check(source.Pa >= 0 && source.Pa <= MaxPa && source.Def >= 0 && source.Def <= 100000 && source.Qty >= 0 && source.Qty <= 100000, "Source de défense invalide.");
                Check(source.Label.Length <= MaxLabel, "Libellé de source trop long.");
            }

            var json = content.ToJson();
            Check(Encoding.UTF8.GetByteCount(json) <= MaxContentBytes, "La proposition dépasse la taille maximale (256 Ko).");
            return json;
        }

        public static void ValidateItemValues(IReadOnlyDictionary<int, int>? values)
        {
            Check(values is not null, "Valeurs d'objets absentes.");
            Check(values!.Count <= 2000, "Trop de valeurs d'objets.");
            Check(values.Values.All(value => value >= 0 && value <= MaxItemValue), "Valeur d'objet invalide.");
        }

        /// <summary>Une action porte sa clé ; une amélioration structurée (avec clé) porte un niveau visé.</summary>
        private static void ValidateTask(PlanTaskDto task)
        {
            Check(TaskKinds.Contains(task.Kind), $"Type de tâche inconnu : {task.Kind}.");
            Check(task.Id is null || TaskIdPattern.IsMatch(task.Id), "Identifiant de tâche invalide.");
            Check(task.Pa >= 0 && task.Pa <= MaxPa, "PA de tâche invalides.");
            Check(task.Label is null || task.Label.Length <= MaxLabel, "Libellé de tâche trop long.");
            Check(task.Ref is null || task.Ref.Length <= MaxLabel, "Référence de tâche trop longue.");
            Check(task.Kind != "action" || !string.IsNullOrWhiteSpace(task.Ref), "Action sans référence.");
            // La clé d'action finit dans l'URL des actions quotidiennes : seules des clés `a_z` sont admises.
            Check(task.Kind != "action" || ActionKeyPattern.IsMatch(task.Ref!), "Référence d'action invalide.");
            Check(task.Kind != "homeUpgrade" || task.Ref is null || (task.Level >= 1 && task.Level <= MaxUpgradeLevel), "Niveau d'amélioration invalide.");
            Check(task.Count is null || (task.Kind == "action" && task.Count >= 1 && task.Count <= MaxActionUses), "Nombre d'utilisations invalide.");
        }

        /// <summary>Une étape porte un chantier (build/repair) ou un texte (instruction), jamais les deux.</summary>
        private static void ValidateStep(PlanStepDto step)
        {
            if (step.Kind == "instruction")
            {
                Check(step.BuildingId is null, "Une consigne ne porte pas de chantier.");
                Check(step.Mode is null && step.Note is null, "Une consigne n'a ni mode ni note.");
                Check(!string.IsNullOrWhiteSpace(step.Text), "Consigne vide.");
                Check(step.Text!.Length <= MaxText, "Consigne trop longue.");
                return;
            }
            Check(BuildingStepKinds.Contains(step.Kind), $"Type d'étape inconnu : {step.Kind}.");
            Check(step.BuildingId is not null, "Étape sans chantier.");
            Check(step.Text is null, "Une étape de chantier n'a pas de texte de consigne.");
            Check(step.Mode is null || Modes.Contains(step.Mode), $"Mode d'étape inconnu : {step.Mode}.");
            Check(step.Mode != "survive" || step.Kind == "repair", "« Passer la nuit » ne s'applique qu'à une réparation.");
            Check(step.TargetRemaining >= 0 && step.TargetRemaining <= 100000, "Cible d'étape invalide.");
            Check(step.Note is null || step.Note.Length <= MaxText, "Note d'étape trop longue.");
        }

        private static void Check(bool condition, string message)
        {
            if (!condition)
            {
                throw new MhoTechnicalException(message);
            }
        }
    }
}
