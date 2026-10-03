using FluentAssertions;
using MyHordesOptimizerApi.Services.Impl.Estimations.Refinement;
using Xunit;

namespace MyHordesOptimizerApiUnitTests.Estimations.Refinement
{
    /// <summary>Entrées reçues d'un client : un tableau ou des paramètres null sont malformés (400), jamais une exception (500).</summary>
    public class RefinementInputTests
    {
        [Fact]
        public void Null_observed_is_not_well_formed() =>
            new RefinementInput { Observed = null! }.IsWellFormed().Should().BeFalse();

        [Fact]
        public void Null_params_are_not_well_formed() =>
            new RefinementInput { Params = null! }.IsWellFormed().Should().BeFalse();

        [Fact]
        public void Null_soul_factors_are_not_well_formed() =>
            new RefinementInput { Params = new RefinementParams { SoulTdg = null! } }.IsWellFormed().Should().BeFalse();

        [Fact]
        public void Default_input_is_well_formed() =>
            new RefinementInput().IsWellFormed().Should().BeTrue();
    }
}
