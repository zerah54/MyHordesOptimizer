using MyHordesOptimizerApi.Data.Buildings;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Buildings;
using MyHordesOptimizerApi.Models;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;

namespace MyHordesOptimizerApi.Services.Impl.Import
{
    /// <summary>
    /// Fonctions pures de traduction des fichiers `Data/Buildings/*.json` (générés par l'extracteur)
    /// vers les entités EF — séparées d'<c>ImportBuildingAsync</c> pour rester testables sans base de
    /// données, sur le même principe que `BuildingMappingProfile`.
    /// </summary>
    public static class BuildingImportHelpers
    {
        /// <summary>
        /// Ressources des paliers 1 (Hard, 0 plan lu) et 2 (Easy, 1 ou 2 plans lus), désignées par
        /// uid d'objet dans le fichier source — contrairement aux ressources du jeu Default,
        /// résolues par MhId. Une ressource dont l'objet est inconnu est écartée.
        /// </summary>
        public static List<BuildingRessource> ConstruireRessourcesPandemonium(
            int idBuilding,
            BuildingHardResourcesCodeModel hardResources,
            IReadOnlyDictionary<string, int> clesItemParUid,
            ILogger logger = null)
        {
            var resultat = new List<BuildingRessource>();

            void AjouterJeu(Dictionary<string, int> resources, int resourceTier)
            {
                foreach (var (uidItem, count) in resources)
                {
                    if (!clesItemParUid.TryGetValue(uidItem, out var idItem))
                    {
                        logger?.LogWarning("ImportBuilding : objet « {UidItem} » inconnu pour le palier Pandémonium du bâtiment {IdBuilding}, ressource écartée.",
                            uidItem, idBuilding);
                        continue;
                    }
                    resultat.Add(new BuildingRessource
                    {
                        IdBuilding = idBuilding,
                        IdItem = idItem,
                        ResourceTier = resourceTier,
                        Count = count,
                    });
                }
            }

            AjouterJeu(hardResources.Tier0.Resources, resourceTier: 1);
            AjouterJeu(hardResources.Tier1.Resources, resourceTier: 2);

            return resultat;
        }

        /// <summary>
        /// Disponibilité par TownType, désignée par uid de chantier et nom de TownType/statut dans
        /// le fichier source. Une entrée dont le chantier ou le nom (TownType/statut) est
        /// inconnu/illisible est écartée.
        /// </summary>
        public static List<BuildingAvailability> ConstruireDisponibilite(
            Dictionary<string, Dictionary<string, string>> buildingAvailability,
            IReadOnlyDictionary<string, int> clesParUid,
            ILogger logger = null)
        {
            var resultat = new List<BuildingAvailability>();

            foreach (var (uid, parTownType) in buildingAvailability)
            {
                if (!clesParUid.TryGetValue(uid, out var cleBatiment))
                {
                    continue;
                }
                foreach (var (townTypeNom, statutNom) in parTownType)
                {
                    if (!Enum.TryParse<TownType>(townTypeNom, ignoreCase: true, out var townType) ||
                        !Enum.TryParse<BuildingAvailabilityStatus>(statutNom, ignoreCase: true, out var statut))
                    {
                        logger?.LogWarning("ImportBuilding : disponibilité illisible pour « {Uid} » ({TownType}/{Statut}), ignorée.",
                            uid, townTypeNom, statutNom);
                        continue;
                    }
                    resultat.Add(new BuildingAvailability
                    {
                        IdBuilding = cleBatiment,
                        TownType = (int)townType,
                        Status = (int)statut,
                    });
                }
            }

            return resultat;
        }
    }
}
