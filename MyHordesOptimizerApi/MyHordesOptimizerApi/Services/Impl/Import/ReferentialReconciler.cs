using System;
using System.Collections.Generic;

namespace MyHordesOptimizerApi.Services.Impl.Import
{
    /// <summary>
    /// Décisions produites par un rapprochement de référentiel. Rien n'est écrit : l'appelant
    /// applique, ce qui rend la logique testable sans base de données.
    /// </summary>
    public sealed class ReferentialReconcileResult<T>
    {
        /// <summary>Identités connues : la ligne reste en place, seul son <c>mhId</c> évolue.</summary>
        public List<(T Existant, int NouveauMhId)> AMettreAJour { get; } = new();

        /// <summary>Identités inconnues : à créer avec une clé attribuée par MHO, jamais celle de MyHordes.</summary>
        public List<(string Uid, int MhId)> ACreer { get; } = new();

        /// <summary>Identités disparues du jeu : à marquer obsolètes, JAMAIS à supprimer.</summary>
        public List<T> ARendreObsoletes { get; } = new();

        /// <summary>
        /// Lignes dépourvues d'identité : ni rapprochables, ni marquables sans arbitraire.
        /// Laissées telles quelles et remontées à l'appelant, qui doit les signaler.
        /// </summary>
        public List<T> SansIdentite { get; } = new();

        /// <summary>
        /// Lignes créées par MHO et non par MyHordes : exemptées du rapprochement, donc jamais
        /// rendues obsolètes. Voir le paramètre <c>estPropreAMho</c>.
        /// </summary>
        public List<T> PropresAMho { get; } = new();
    }

    /// <summary>
    /// Rapproche un référentiel local d'une source MyHordes SUR L'IDENTITÉ.
    /// </summary>
    /// <remarks>
    /// <para>
    /// Jamais sur l'identifiant numérique : côté MyHordes, <c>BuildingPrototype</c>,
    /// <c>ItemPrototype</c>, <c>ZonePrototype</c> et <c>PictoPrototype</c> déclarent leur
    /// <c>$id</c> en <c>#[ORM\GeneratedValue]</c> — un auto-incrément de fixtures, qui varie
    /// d'une instance du jeu à l'autre. Mesuré le 2026-07-27 : 128 des 166 bâtiments avaient
    /// déjà divergé entre la base et myhordes.de.
    /// </para>
    /// <para>
    /// Cette classe ne touche à rien et ne dépend de rien : elle renvoie des décisions. C'est
    /// ce qui permet de la couvrir par des tests unitaires sans base de données.
    /// </para>
    /// </remarks>
    public static class ReferentialReconciler
    {
        /// <param name="estPropreAMho">
        /// Reconnaît les lignes que MHO crée lui-même, sans prototype MyHordes derrière elles.
        /// Le référentiel des ruines en contient une : le « bâtiment non déterré »
        /// (<c>IdRuin = -1</c>), miroir du sentinel <c>-1</c> que le jeu renvoie pour une case
        /// enterrée, et dont dépendent l'affichage de la carte et le calculateur de camping.
        /// Sans cette exemption, un tel prototype serait marqué obsolète à chaque import.
        /// </param>
        public static ReferentialReconcileResult<T> Reconcile<T>(
            IReadOnlyCollection<T> existants,
            IReadOnlyCollection<(string Uid, int MhId)> source,
            Func<T, string?> uidDe,
            Func<T, bool>? estPropreAMho = null)
        {
            if (source.Count == 0)
            {
                // Une réponse vide signifie une panne ou une maintenance, pas la disparition du
                // référentiel. Sans ce refus, un incident côté jeu basculerait tout en obsolète.
                throw new InvalidOperationException(
                    "Rapprochement refusé : source vide. Marquer tout un référentiel obsolète " +
                    "sur une réponse MyHordes vide serait destructeur.");
            }

            var result = new ReferentialReconcileResult<T>();
            var parUid = new Dictionary<string, T>(StringComparer.Ordinal);

            foreach (var existant in existants)
            {
                if (estPropreAMho?.Invoke(existant) == true)
                {
                    result.PropresAMho.Add(existant);
                    continue;
                }

                var uid = uidDe(existant);
                if (string.IsNullOrEmpty(uid))
                {
                    result.SansIdentite.Add(existant);
                    continue;
                }
                parUid[uid] = existant;
            }

            var vus = new HashSet<string>(StringComparer.Ordinal);
            foreach (var (uid, mhId) in source)
            {
                vus.Add(uid);
                if (parUid.TryGetValue(uid, out var existant))
                {
                    // Couvre aussi la réapparition : une ligne obsolète dont l'identité revient
                    // reprend du service, plutôt que de créer un doublon.
                    result.AMettreAJour.Add((existant, mhId));
                }
                else
                {
                    result.ACreer.Add((uid, mhId));
                }
            }

            foreach (var paire in parUid)
            {
                if (!vus.Contains(paire.Key))
                {
                    result.ARendreObsoletes.Add(paire.Value);
                }
            }

            return result;
        }
    }
}
