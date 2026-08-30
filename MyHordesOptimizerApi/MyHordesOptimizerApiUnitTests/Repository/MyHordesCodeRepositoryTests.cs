using FluentAssertions;
using MyHordesOptimizerApi.Data.Items;
using MyHordesOptimizerApi.Repository.Impl;
using Xunit;

namespace MyHordesOptimizerApiUnitTests.Repository
{
    /// <summary>
    /// Verrou de non-régression : actions.json contient des actions dont "result" est un objet
    /// JSON (artefact PHP), pas un tableau — la désérialisation de l'ensemble du fichier ne doit
    /// jamais échouer à cause d'elles.
    /// </summary>
    public class MyHordesCodeRepositoryTests
    {
        [Fact]
        public void GetActions_SurLeFichierReel_NeLeveAucuneExceptionEtNEstPasVide()
        {
            var repository = new MyHordesCodeRepository();

            var actions = repository.GetActions();

            actions.Should().NotBeEmpty();
        }

        [Fact]
        public void GetCitizenStatuses_SurLeFichierReel_ContientThirst2()
        {
            var repository = new MyHordesCodeRepository();

            var statuses = repository.GetCitizenStatuses();

            statuses.Should().ContainKey("thirst2");
            statuses["thirst2"].NwDef.Should().Be(-10);
            statuses["thirst2"].NwDeath.Should().Be(0.03);
        }

        [Fact]
        public void GetMetaResults_SurLeFichierReel_NeLeveAucuneExceptionEtContientEatAp6()
        {
            var repository = new MyHordesCodeRepository();

            var results = repository.GetMetaResults();

            results.Should().ContainKey("eat_ap6");
            results["eat_ap6"].AtomList.Should().Contain(a => a.IsStatusEffect());
        }
    }
}
