using System;

namespace MyHordesOptimizerApi.Models.Import
{
    /// <summary>
    /// Identifiants des imports exécutés en tâche de fond. Partagés avec le front, qui les utilise
    /// dans l'url de suivi.
    /// </summary>
    public static class ImportJobKeys
    {
        public const string All = "all";
        public const string Towns = "towns";
    }

    /// <summary>
    /// Avancement d'un import en tâche de fond, transmis au fur et à mesure par le service d'import.
    /// </summary>
    /// <param name="Key">Nature de ce qui est en cours de traitement (étape ou unité comptée).</param>
    /// <param name="Index">Quantité déjà traitée, à partir de 1.</param>
    /// <param name="Total">Quantité totale à traiter.</param>
    /// <param name="Message">
    /// Constat à remonter au client sur un import qui aboutit sans être complet — un quota externe
    /// épuisé, par exemple. Null le reste du temps : ce n'est pas une erreur.
    /// </param>
    public record ImportStepProgress(string Key, int Index, int Total, string Message = null);

    /// <summary>
    /// État d'un import en tâche de fond, interrogeable pendant et après son exécution.
    /// L'import ne tenant pas dans une requête HTTP, c'est le seul moyen pour le client d'en connaître
    /// l'issue.
    /// </summary>
    public class ImportJobState
    {
        public string Job { get; set; }
        public bool IsRunning { get; set; }
        public string CurrentStep { get; set; }
        public int CurrentStepIndex { get; set; }
        public int TotalSteps { get; set; }
        public DateTime? StartedAt { get; set; }
        public DateTime? FinishedAt { get; set; }
        /// <summary>Null tant que cet import n'est pas allé au bout depuis le démarrage de l'application.</summary>
        public bool? LastRunSucceeded { get; set; }
        public string Error { get; set; }
        /// <summary>
        /// Constat sur un import réussi mais incomplet (quota externe épuisé, notamment). Distinct de
        /// <see cref="Error"/> : l'import s'est bien terminé, il reste simplement du travail.
        /// </summary>
        public string Warning { get; set; }

        public ImportJobState Clone()
        {
            return (ImportJobState)MemberwiseClone();
        }
    }
}
