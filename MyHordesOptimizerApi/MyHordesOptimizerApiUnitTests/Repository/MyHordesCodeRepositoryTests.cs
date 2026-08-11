using FluentAssertions;
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
    }
}
