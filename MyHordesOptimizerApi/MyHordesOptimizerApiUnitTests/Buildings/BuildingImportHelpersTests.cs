using FluentAssertions;
using MyHordesOptimizerApi.Data.Buildings;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Buildings;
using MyHordesOptimizerApi.Models;
using MyHordesOptimizerApi.Services.Impl.Import;
using System.Collections.Generic;
using System.Linq;

namespace MyHordesOptimizerApiUnitTests.Buildings
{
    public class BuildingImportHelpersTests
    {
        [Fact]
        public void ConstruitLesRessourcesDesTiers0Et1AvecLeBonResourceTier()
        {
            var hardResources = new BuildingHardResourcesCodeModel
            {
                Tier0 = new BuildingResourceTierCodeModel { Ap = 25, Resources = new Dictionary<string, int> { ["wood2_#00"] = 10 } },
                Tier1 = new BuildingResourceTierCodeModel { Ap = 20, Resources = new Dictionary<string, int> { ["wood2_#00"] = 8 } },
                Tier2 = new BuildingApOnlyTierCodeModel { Ap = 13 },
            };
            var clesItemParUid = new Dictionary<string, int> { ["wood2_#00"] = 42 };

            var resultat = BuildingImportHelpers.ConstruireRessourcesPandemonium(idBuilding: 1, hardResources, clesItemParUid);

            resultat.Should().HaveCount(2);
            resultat.Single(r => r.ResourceTier == 1).Should().Match<BuildingRessource>(r => r.IdItem == 42 && r.Count == 10 && r.IdBuilding == 1);
            resultat.Single(r => r.ResourceTier == 2).Should().Match<BuildingRessource>(r => r.IdItem == 42 && r.Count == 8 && r.IdBuilding == 1);
        }

        [Fact]
        public void EcarteUneRessourceDontLObjetEstInconnu()
        {
            var hardResources = new BuildingHardResourcesCodeModel
            {
                Tier0 = new BuildingResourceTierCodeModel { Ap = 25, Resources = new Dictionary<string, int> { ["objet_inconnu_#00"] = 1 } },
                Tier1 = new BuildingResourceTierCodeModel { Ap = 20, Resources = new Dictionary<string, int>() },
                Tier2 = new BuildingApOnlyTierCodeModel { Ap = 13 },
            };

            var resultat = BuildingImportHelpers.ConstruireRessourcesPandemonium(idBuilding: 1, hardResources, new Dictionary<string, int>());

            resultat.Should().BeEmpty();
        }

        [Fact]
        public void ConstruitLaDisponibiliteAvecLeBonTownTypeEtStatut()
        {
            var buildingAvailability = new Dictionary<string, Dictionary<string, string>>
            {
                ["small_vaudoudoll_#00"] = new() { ["PANDE"] = "disabled" },
            };
            var clesParUid = new Dictionary<string, int> { ["small_vaudoudoll_#00"] = 7 };

            var resultat = BuildingImportHelpers.ConstruireDisponibilite(buildingAvailability, clesParUid);

            resultat.Should().ContainSingle(a =>
                a.IdBuilding == 7 &&
                a.TownType == (int)MyHordesOptimizerApi.Dtos.MyHordesOptimizer.TownType.PANDE &&
                a.Status == (int)BuildingAvailabilityStatus.Disabled);
        }

        [Fact]
        public void EcarteUneDisponibiliteDontLeChantierEstInconnu()
        {
            var buildingAvailability = new Dictionary<string, Dictionary<string, string>>
            {
                ["chantier_inconnu_#00"] = new() { ["PANDE"] = "disabled" },
            };

            var resultat = BuildingImportHelpers.ConstruireDisponibilite(buildingAvailability, new Dictionary<string, int>());

            resultat.Should().BeEmpty();
        }
    }
}
