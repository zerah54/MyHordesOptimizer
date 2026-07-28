using FluentAssertions;
using MyHordesOptimizerApi.Extensions;
using MyHordesOptimizerApi.Models;

namespace MyHordesOptimizerApiUnitTests.Referentiels
{
    /// <summary>
    /// `UpdateAllButKeysProperties` est le point de passage de tous les imports de référentiel.
    /// Ce qu'il recopie — ou pas — décide de ce qui atterrit en base.
    /// </summary>
    public class RecopiePropreteTests
    {
        [Fact]
        public void RecopieBienLaCleEtrangereDuParent()
        {
            // Le cas qui a fait perdre la hiérarchie des chantiers : si cette clé n'est pas
            // recopiée, la traduction qui suit ne trouve rien à traduire et le parent est perdu.
            var existant = new Building { IdBuilding = 42, Uid = "small_gather_#00", IdBuildingParent = 999 };
            var modele = new Building { IdBuilding = 0, Uid = "small_gather_#00", IdBuildingParent = 2 };

            existant.UpdateAllButKeysProperties(modele);

            existant.IdBuildingParent.Should().Be(2);
        }

        [Fact]
        public void NeRecopiePasLaClePrimaire()
        {
            // La clé appartient à MHO : le modèle transitoire n'en porte pas, et l'écraser
            // ferait basculer la ligne sur 0.
            var existant = new Building { IdBuilding = 42, Uid = "small_gather_#00" };
            var modele = new Building { IdBuilding = 0, Uid = "small_gather_#00" };

            existant.UpdateAllButKeysProperties(modele);

            existant.IdBuilding.Should().Be(42);
        }

        [Fact]
        public void RecopieLaNavigationDuParentANull_CeQuiEstLeProblemeDeFond()
        {
            // Constat, pas souhait : la méthode recopie AUSSI les propriétés de navigation. Le
            // modèle issu du mapping les a toutes à null, donc l'entité suivie se retrouve avec une
            // navigation nulle et une clé étrangère renseignée — état incohérent qu'EF résout en
            // effaçant la clé. C'est ce test qui documente pourquoi l'appelant doit reposer la
            // navigation AVANT tout enregistrement.
            var parent = new Building { IdBuilding = 7, Uid = "small_wallimprove_#01" };
            var existant = new Building { IdBuilding = 42, IdBuildingParent = 7, IdBuildingParentNavigation = parent };
            var modele = new Building { IdBuildingParent = 2 };

            existant.UpdateAllButKeysProperties(modele);

            existant.IdBuildingParentNavigation.Should().BeNull();
        }
    }
}
