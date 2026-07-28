using System.Collections.Generic;

namespace MyHordesOptimizerApi.Models.Import
{
    /// <summary>
    /// Constat produit par la reprise des identifiants d'un référentiel : ce qui a été résolu,
    /// et surtout ce qui ne l'a pas été.
    /// </summary>
    public sealed class ReferentialBackfillEntry
    {
        /// <summary>Nom de la table concernée.</summary>
        public string Referentiel { get; set; } = string.Empty;

        /// <summary>Lignes en base avant la reprise.</summary>
        public int LignesEnBase { get; set; }

        /// <summary>Prototypes renvoyés par MyHordes.</summary>
        public int PrototypesChezMyHordes { get; set; }

        /// <summary>Lignes dont le <c>mhId</c> a pu être résolu par identité.</summary>
        public int Resolus { get; set; }

        /// <summary>
        /// Identités des lignes restées sans <c>mhId</c> : ce sont les prototypes que MyHordes
        /// n'expose plus, donc les vraies obsolètes.
        /// </summary>
        public List<string> SansCorrespondance { get; set; } = new();

        /// <summary>
        /// Identités présentes chez MyHordes mais absentes de la base. Normalement vide après un
        /// import récent ; non vide, cela signale un import en retard.
        /// </summary>
        public List<string> AbsentesDeLaBase { get; set; } = new();

        /// <summary>Lignes dépourvues d'identité, donc non rapprochables. Doit rester vide.</summary>
        public List<int> SansIdentite { get; set; } = new();
    }

    /// <summary>Rapport global de la reprise, un constat par référentiel.</summary>
    public sealed class ReferentialBackfillReport
    {
        public List<ReferentialBackfillEntry> Referentiels { get; set; } = new();
    }
}
