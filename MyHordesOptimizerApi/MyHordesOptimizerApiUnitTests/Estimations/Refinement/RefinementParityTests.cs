using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Text.Json.Serialization;
using FluentAssertions;
using MyHordesOptimizerApi.Services.Impl.Estimations.Refinement;
using Xunit;

namespace MyHordesOptimizerApiUnitTests.Estimations.Refinement
{
    /// <summary>
    /// Équivalence seed par seed du portage C# avec le modèle TS de référence (attack-model.ts) : toute
    /// différence de valeurs dérivées est un faux négatif potentiel. Données régénérées par
    /// MyHordesOptimizerWebsite/scripts/generate-refinement-fixtures.ts.
    /// </summary>
    public class RefinementParityTests
    {
        private sealed class FixtureParams
        {
            [JsonPropertyName("base_lo_rand")] public int BaseLoRand { get; set; }
            [JsonPropertyName("base_hi_rand")] public int BaseHiRand { get; set; }
            [JsonPropertyName("off_sum")] public int OffSum { get; set; }
            [JsonPropertyName("protect")] public int Protect { get; set; }
            [JsonPropertyName("blocks")] public int Blocks { get; set; }
            [JsonPropertyName("soul_tdg")] public double[] SoulTdg { get; set; } = [];
            [JsonPropertyName("soul_planif")] public double[] SoulPlanif { get; set; } = [];
            [JsonPropertyName("shift_span")] public double ShiftSpan { get; set; }
            [JsonPropertyName("shift_steps")] public int ShiftSteps { get; set; }
            [JsonPropertyName("min_global")] public int MinGlobal { get; set; }
            [JsonPropertyName("max_global")] public int MaxGlobal { get; set; }
            [JsonPropertyName("rebound_possible")] public bool ReboundPossible { get; set; }
            [JsonPropertyName("fireworks")] public bool Fireworks { get; set; }
        }

        private sealed class FixtureSeed
        {
            [JsonPropertyName("seed")] public uint Seed { get; set; }
            [JsonPropertyName("values")] public int[] Values { get; set; } = [];
            [JsonPropertyName("reductionMin")] public int? ReductionMin { get; set; }
            [JsonPropertyName("reductionMax")] public int? ReductionMax { get; set; }
            /// <summary>Configurations (somme, base) retenues par le modèle TS pour ce seed.</summary>
            [JsonPropertyName("configs")] public int[][] Configs { get; set; } = [];
        }

        private sealed class FixtureScenario
        {
            [JsonPropertyName("name")] public string Name { get; set; } = "";
            [JsonPropertyName("observed")] public int[] Observed { get; set; } = [];
            [JsonPropertyName("observedPlanif")] public int[]? ObservedPlanif { get; set; }
            [JsonPropertyName("params")] public FixtureParams Params { get; set; } = new();
            [JsonPropertyName("reboundPossible")] public bool ReboundPossible { get; set; }
            [JsonPropertyName("seeds")] public FixtureSeed[] Seeds { get; set; } = [];

            public RefinementInput ToInput() => new()
            {
                Observed = Observed,
                ObservedPlanif = ObservedPlanif,
                Params = new RefinementParams
                {
                    BaseLoRand = Params.BaseLoRand, BaseHiRand = Params.BaseHiRand, OffSum = Params.OffSum, Protect = Params.Protect, Blocks = Params.Blocks,
                    SoulTdg = Params.SoulTdg, SoulPlanif = Params.SoulPlanif, ShiftSpan = Params.ShiftSpan, ShiftSteps = Params.ShiftSteps,
                    MinGlobal = Params.MinGlobal, MaxGlobal = Params.MaxGlobal, ReboundPossible = Params.ReboundPossible, Fireworks = Params.Fireworks
                }
            };
        }

        private static readonly Dictionary<string, FixtureScenario> Scenarios = JsonSerializer
            .Deserialize<FixtureScenario[]>(File.ReadAllText(Path.Combine(AppContext.BaseDirectory, "Estimations", "Refinement", "refinement-fixtures.json")))!
            .ToDictionary(scenario => scenario.Name);

        public static IEnumerable<object[]> Names() => Scenarios.Keys.Select(name => new object[] { name });

        [Theory]
        [MemberData(nameof(Names))]
        public void Derived_values_match_the_TS_model_seed_by_seed(string name)
        {
            var scenario = Scenarios[name];
            foreach (var expected in scenario.Seeds)
            {
                var outcome = RefinementEngine.Process(scenario.ToInput(), new[] { expected.Seed });
                outcome.Values.Should().Equal(expected.Values, $"seed {expected.Seed} ({name})");
                bool reported = scenario.ObservedPlanif is not null && outcome.Reductions.Count > 0;
                (reported ? outcome.Reductions.Min : (int?)null).Should().Be(expected.ReductionMin, $"seed {expected.Seed} ({name})");
                (reported ? outcome.Reductions.Max : (int?)null).Should().Be(expected.ReductionMax, $"seed {expected.Seed} ({name})");
            }
        }

        /// <summary>Les couples stockés pour le refiltrage doivent être exactement ceux que le TS retient.</summary>
        [Theory]
        [MemberData(nameof(Names))]
        public void Retained_configurations_match_the_TS_model_seed_by_seed(string name)
        {
            var scenario = Scenarios[name];
            foreach (var expected in scenario.Seeds)
            {
                var retained = RefinementEngine.Process(scenario.ToInput(), new[] { expected.Seed }).Triples
                    .Select(triple => new[] { triple.Sum, triple.Base });
                retained.Should().BeEquivalentTo(expected.Configs, $"seed {expected.Seed} ({name})");
            }
        }

        [Theory]
        [MemberData(nameof(Names))]
        public void Every_scenario_retains_at_least_one_configuration(string name) =>
            Scenarios[name].Seeds.Should().Contain(seed => seed.Configs.Length > 0);

        [Theory]
        [MemberData(nameof(Names))]
        public void Rebound_gate_matches_the_TS_model(string name) =>
            RefinementModel.IsReboundPossible(Scenarios[name].Observed, Scenarios[name].ToInput().Params).Should().Be(Scenarios[name].ReboundPossible);

        [Theory]
        [MemberData(nameof(Names))]
        public void Every_scenario_has_at_least_one_compatible_seed(string name) =>
            Scenarios[name].Seeds.Should().Contain(seed => seed.Values.Length > 0);
    }
}
