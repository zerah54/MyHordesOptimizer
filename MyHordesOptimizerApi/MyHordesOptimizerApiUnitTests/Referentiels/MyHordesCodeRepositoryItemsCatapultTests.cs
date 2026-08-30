using FluentAssertions;
using MyHordesOptimizerApi.Repository.Impl;
using Xunit;

namespace MyHordesOptimizerApiUnitTests.Referentiels
{
    public class MyHordesCodeRepositoryItemsCatapultTests
    {
        [Fact]
        public void GetItemsCatapult_LitLeFichierEtRenvoieLeNomDActionParObjet()
        {
            var repository = new MyHordesCodeRepository();

            var result = repository.GetItemsCatapult();

            result.Should().ContainKey("wood2_#00").WhoseValue.Should().Be("cata_rsc_fine");
        }
    }
}
