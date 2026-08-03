using MyHordesOptimizerApi.Models.ExternalTools;

namespace MyHordesOptimizerApi.Services.Interfaces.ExternalTools
{
    /// <summary>
    /// Reçoit l'avancement des unités de travail d'une mise à jour des outils externes.
    /// Toutes les unités sont déclarées avant que la moindre ne démarre : sans cette phase
    /// préalable, un outil dont une unité démarre en retard passerait au vert trop tôt.
    /// </summary>
    public interface IExternalToolsProgressSink
    {
        void Declare(ExternalToolId tool, string unit);
        void Succeeded(ExternalToolId tool, string unit);
        void Failed(ExternalToolId tool, string unit, string message);

        /// <summary>
        /// Ajoute une erreur à un outil déjà déclaré, sans toucher au compteur <c>PendingUnits</c>
        /// (contrairement à <see cref="Failed"/>). Sert quand une même unité peut échouer pour
        /// plusieurs raisons : le premier échec doit décompter l'unité, les suivants ne doivent
        /// qu'ajouter leur message sans décompter une deuxième fois.
        /// </summary>
        void AddError(ExternalToolId tool, string unit, string message);

        /// <summary>
        /// Fait échouer d'un coup toutes les unités encore en cours, d'un outil donné ou de tous.
        /// Sert aux échecs qui ne relèvent pas d'une unité : préalable MHO en erreur, exception
        /// remontée jusqu'au runner.
        /// </summary>
        void FailAllPending(string unit, string message, ExternalToolId? onlyTool = null);
    }

    /// <summary>
    /// Objet nul utilisé par l'ancienne route, qui ne suit aucun avancement. Évite un test de
    /// nullité à chaque unité.
    /// </summary>
    public sealed class NullExternalToolsProgressSink : IExternalToolsProgressSink
    {
        public static readonly NullExternalToolsProgressSink Instance = new();

        private NullExternalToolsProgressSink()
        {
        }

        public void Declare(ExternalToolId tool, string unit)
        {
        }

        public void Succeeded(ExternalToolId tool, string unit)
        {
        }

        public void Failed(ExternalToolId tool, string unit, string message)
        {
        }

        public void AddError(ExternalToolId tool, string unit, string message)
        {
        }

        public void FailAllPending(string unit, string message, ExternalToolId? onlyTool = null)
        {
        }
    }
}
