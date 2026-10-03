using System;
using FluentAssertions;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Estimations;
using MyHordesOptimizerApi.Services.Impl.Estimations;
using Xunit;

namespace MyHordesOptimizerApiUnitTests.Estimations
{
    /// <summary>Le solveur ne doit jamais exclure l'attaque réelle simulée (une exclusion = échec).</summary>
    public class AttackSoundnessTests
    {
        /// <summary>Tirages par régime ; variable d'environnement MHO_SOUNDNESS_DRAWS pour une confirmation longue (ex. 10000).</summary>
        internal static readonly int Draws = int.TryParse(Environment.GetEnvironmentVariable("MHO_SOUNDNESS_DRAWS"), out int draws) ? draws : 120;
        internal static readonly int Re = (int)TownType.RE;

        [Theory]
        [InlineData(12)]
        [InlineData(16)]
        [InlineData(22)]
        [InlineData(33)]
        public void Solver_contains_the_real_attack_without_souls(int day)
        {
            for (int seed = 0; seed < Draws; seed++)
            {
                var sim = AttackSimulator.Simulate(seed * 7919 + day, day, Re, _ => 0, _ => 0, 0);

                var result = MyHordesOptimizerEstimationService.ComputeAttack(sim.Tdg, sim.Planif, day, AttackDifficulty.Normal, Re);

                result.Result.Min.Should().BeLessOrEqualTo(sim.RealAttack, $"jour {day}, tirage {seed}");
                result.Result.Max.Should().BeGreaterOrEqualTo(sim.RealAttack, $"jour {day}, tirage {seed}");
            }
        }
    }
}
