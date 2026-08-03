using System;
using System.Collections.Generic;

namespace MyHordesOptimizerApi.Models.ExternalTools
{
    public enum ExternalToolId
    {
        MyHordesOptimizer,
        GestHordes,
        FataMorgana,
        BigBrothHordes
    }

    public enum ExternalToolUpdateStatus
    {
        Pending,
        Success,
        Error
    }

    /// <summary>
    /// Unités de travail d'une mise à jour. Elles servent au libellé de survol et aux journaux ;
    /// elles ne pilotent pas l'affichage, qui se fait par outil.
    /// </summary>
    public static class ExternalToolUpdateUnits
    {
        public const string Map = "map";
        public const string Bags = "bags";
        public const string Citizen = "citizen";
        public const string Digs = "digs";
        /// <summary>Échec qui ne relève d'aucune unité en particulier.</summary>
        public const string Job = "job";
    }

    /// <summary>
    /// Identifiants du contrat client, écrits explicitement : Program.cs enregistre un
    /// JsonStringEnumConverter sans politique de nommage, qui sérialiserait les valeurs
    /// d'énumération en PascalCase.
    /// </summary>
    public static class ExternalToolContractIds
    {
        public static string ToContractId(this ExternalToolId tool)
        {
            return tool switch
            {
                ExternalToolId.MyHordesOptimizer => "myHordesOptimizer",
                ExternalToolId.GestHordes => "gestHordes",
                ExternalToolId.FataMorgana => "fataMorgana",
                ExternalToolId.BigBrothHordes => "bigBrothHordes",
                _ => throw new ArgumentOutOfRangeException(nameof(tool))
            };
        }

        public static string ToContractId(this ExternalToolUpdateStatus status)
        {
            return status switch
            {
                ExternalToolUpdateStatus.Pending => "pending",
                ExternalToolUpdateStatus.Success => "success",
                ExternalToolUpdateStatus.Error => "error",
                _ => throw new ArgumentOutOfRangeException(nameof(status))
            };
        }
    }

    public class ExternalToolUpdateError
    {
        public string Unit { get; set; }
        public string Message { get; set; }
    }

    public class ExternalToolUpdateState
    {
        public string Tool { get; set; }
        public string Status { get; set; }
        public List<ExternalToolUpdateError> Errors { get; set; } = new();
    }

    /// <summary>
    /// État d'une mise à jour des outils externes, interrogeable pendant et après son exécution.
    /// Un outil non sollicité est absent de <see cref="Tools"/> : le client n'affiche alors aucune
    /// icône pour lui.
    /// </summary>
    public class ExternalToolsUpdateJobState
    {
        /// <summary>
        /// Guid.Empty quand aucun lancement n'est connu pour ce joueur. Le client s'en sert pour
        /// distinguer « ce n'est pas mon lancement » d'une fin de traitement.
        /// </summary>
        public Guid JobId { get; set; }
        public bool IsRunning { get; set; }
        public DateTime? StartedAt { get; set; }
        public DateTime? FinishedAt { get; set; }
        public List<ExternalToolUpdateState> Tools { get; set; } = new();
    }
}
