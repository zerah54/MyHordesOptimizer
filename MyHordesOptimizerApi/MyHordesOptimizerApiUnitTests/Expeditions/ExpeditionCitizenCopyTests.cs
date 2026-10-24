using FluentAssertions;
using MyHordesOptimizerApi.Extensions.Models.Expeditions;
using MyHordesOptimizerApi.Models;
using Xunit;

namespace MyHordesOptimizerApiUnitTests.Expeditions
{
    public class ExpeditionCitizenCopyTests
    {
        [Fact]
        public void Copy_RecopieLesExigences()
        {
            var source = new ExpeditionCitizen
            {
                PreinscritJob = "hunter",
                PreinscritHeroic = "uppercut",
                NombrePeDepart = 3,
                NombrePeDepartOperator = "max",
                IsPreinscritChaussures = true,
                NombrePaDepart = 8,
                IsPreinscritSoif = 1,
                IdExpeditionBagNavigation = new ExpeditionBag()
            };

            var copy = source.Copy();

            copy.PreinscritJob.Should().Be("hunter");
            copy.PreinscritHeroic.Should().Be("uppercut");
            copy.NombrePeDepart.Should().Be(3);
            copy.NombrePeDepartOperator.Should().Be("max");
            copy.IsPreinscritChaussures.Should().BeTrue();
            copy.NombrePaDepart.Should().Be(8);
            copy.IsPreinscritSoif.Should().Be(1);
        }
    }
}
