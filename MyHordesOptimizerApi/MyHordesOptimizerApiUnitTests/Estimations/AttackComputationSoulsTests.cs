using System;
using System.Collections.Generic;
using FluentAssertions;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Estimations;
using MyHordesOptimizerApi.Services.Impl.Estimations;
using Xunit;

namespace MyHordesOptimizerApiUnitTests.Estimations
{
    public class AttackComputationSoulsTests
    {
        private static readonly int Re = (int)TownType.RE;
        private static readonly Dictionary<int, int> None = new();

        private static EstimationsDto Row100(int min, int max) =>
            new() { _100 = new EstimationValueDto { Min = min, Max = max } };

        // Jour 16 (facteur 0,75, shiftSpan 0,075), attaque V=3500, cibles [3395, 3658], offsets nuls, 1 âme ⇒ pf 1,04.
        // Tour 100 % affichée : round(3395·1,04)=3531, round(3658·1,04)=3804. Base : [3395, 3526] (largeur : ((273+1)/1,04+1)/0,075 = 3526).

        [Fact]
        public void One_soul_at_reading_and_at_attack_scales_the_base_window_by_the_soul_factor()
        {
            var scenario = new SoulsScenario(1, new Dictionary<int, int> { [100] = 1 }, None);

            var result = MyHordesOptimizerEstimationService.ComputeAttack(Row100(3531, 3804), null, 16, AttackDifficulty.Normal, Re, scenario);

            // Le filtre de paires peut resserrer la fenêtre de base [3395, 3526] ; l'attaque réelle round(3500·1,04) = 3640 reste dedans.
            result.Result.Min.Should().BeGreaterOrEqualTo(3531);
            result.Result.Max.Should().BeLessOrEqualTo(3667);
            result.Result.Min.Should().BeLessOrEqualTo(3640);
            result.Result.Max.Should().BeGreaterOrEqualTo(3640);
        }

        [Fact]
        public void A_planned_purification_lowers_the_window_to_the_base_values()
        {
            var scenario = new SoulsScenario(0, new Dictionary<int, int> { [100] = 1 }, None);

            var result = MyHordesOptimizerEstimationService.ComputeAttack(Row100(3531, 3804), null, 16, AttackDifficulty.Normal, Re, scenario);

            result.Result.Min.Should().BeGreaterOrEqualTo(3395);
            result.Result.Max.Should().BeLessOrEqualTo(3526);
            result.Result.Min.Should().BeLessOrEqualTo(3500);
            result.Result.Max.Should().BeGreaterOrEqualTo(3500);
        }

        [Fact]
        public void A_planif_read_without_soul_is_raised_when_the_soul_stays_until_the_attack()
        {
            // Planif J15 (attaque J16, blocs de 20) relevé à 0 âme : min floor(3395/20)·20=3380, max ceil(3658/20)·20=3660.
            var scenario = new SoulsScenario(1, None, None);
            var planif = Row100(3380, 3660);

            var result = MyHordesOptimizerEstimationService.ComputeAttack(null, planif, 16, AttackDifficulty.Normal, Re, scenario);

            result.Result.Min.Should().BeGreaterOrEqualTo(3515);
            result.Result.Max.Should().BeLessOrEqualTo(3806);
            // Attaque réelle V=3500 avec 1 âme : round(3500·1,04) = 3640, dans la fenêtre.
            result.Result.Min.Should().BeLessOrEqualTo(3640);
            result.Result.Max.Should().BeGreaterOrEqualTo(3640);
        }

        [Fact]
        public void Without_rows_the_theoretical_bounds_are_scaled_by_the_attack_soul_factor()
        {
            var scenario = new SoulsScenario(1, None, None);

            var result = MyHordesOptimizerEstimationService.ComputeAttack(null, null, 16, AttackDifficulty.Normal, Re, scenario);

            result.Result.Min.Should().Be((int)Math.Round(2860 * 1.04, MidpointRounding.AwayFromZero));
            result.Result.Max.Should().Be((int)Math.Round(4096 * 1.04, MidpointRounding.AwayFromZero));
        }

        [Fact]
        public void A_neutral_scenario_gives_exactly_the_result_without_scenario()
        {
            var sim = AttackSimulator.Simulate(42, 22, Re, _ => 0, _ => 0, 0);
            var neutral = new SoulsScenario(0, new Dictionary<int, int> { [100] = 0 }, None);

            var plain = MyHordesOptimizerEstimationService.ComputeAttack(sim.Tdg, sim.Planif, 22, AttackDifficulty.Normal, Re);
            var withNeutral = MyHordesOptimizerEstimationService.ComputeAttack(sim.Tdg, sim.Planif, 22, AttackDifficulty.Normal, Re, neutral);

            withNeutral.Should().BeEquivalentTo(plain);
        }

        // Cas classique : le vote SPA passe la nuit de l'attaque. Estimations lues à 1 âme, niveau < 2 (4 %,
        // comme les tests ci-dessus) ; l'attaque réelle applique le niveau ≥ 2 (2 %) déjà en vigueur le lendemain.
        [Fact]
        public void Attack_spa_level_reduces_the_real_attack_when_the_vote_passed_overnight()
        {
            var readAtCurrentLevel = new SoulsScenario(1, new Dictionary<int, int> { [100] = 1 }, None, attackSpaLevel: 0);
            var readWithVotePassed = new SoulsScenario(1, new Dictionary<int, int> { [100] = 1 }, None, attackSpaLevel: 2);
            var row = Row100(3531, 3804);

            var beforeVote = MyHordesOptimizerEstimationService.ComputeAttack(row, null, 16, AttackDifficulty.Normal, Re, readAtCurrentLevel);
            var afterVote = MyHordesOptimizerEstimationService.ComputeAttack(row, null, 16, AttackDifficulty.Normal, Re, readWithVotePassed);

            // round(3500·1,02) = 3570 doit rester dans la fenêtre recalculée au niveau réduit.
            afterVote.Result.Min.Should().BeLessOrEqualTo(3570);
            afterVote.Result.Max.Should().BeGreaterOrEqualTo(3570);
            // La fenêtre au niveau réduit est strictement plus basse (2 % < 4 %).
            afterVote.Result.Max.Should().BeLessThan(beforeVote.Result.Max);
        }

        // Même facteur effectif via souls×level différents (1 âme @ niveau<2 = 1,04 ; 2 âmes @ niveau≥2 = 1,04) :
        // prouve que le niveau de lecture de la tour est bien consommé par ExtractRows, pas seulement stocké.
        [Fact]
        public void Estim_spa_level_feeds_the_row_reading_penalty()
        {
            var row = Row100(3531, 3804);
            var oneSoulDefaultLevel = new SoulsScenario(0, new Dictionary<int, int> { [100] = 1 }, None, estimSpaLevel: 0);
            var twoSoulsPurifiedLevel = new SoulsScenario(0, new Dictionary<int, int> { [100] = 2 }, None, estimSpaLevel: 2);

            var a = MyHordesOptimizerEstimationService.ComputeAttack(row, null, 16, AttackDifficulty.Normal, Re, oneSoulDefaultLevel);
            var b = MyHordesOptimizerEstimationService.ComputeAttack(row, null, 16, AttackDifficulty.Normal, Re, twoSoulsPurifiedLevel);

            b.Should().BeEquivalentTo(a);
        }

        // Même principe côté planif (day 16, blocs de 20, cf. le test planif ci-dessous pour les valeurs).
        [Fact]
        public void Planif_spa_level_feeds_the_row_reading_penalty()
        {
            var planif = Row100(3380, 3660);
            var oneSoulDefaultLevel = new SoulsScenario(0, None, new Dictionary<int, int> { [100] = 1 }, planifSpaLevel: 0);
            var twoSoulsPurifiedLevel = new SoulsScenario(0, None, new Dictionary<int, int> { [100] = 2 }, planifSpaLevel: 2);

            var a = MyHordesOptimizerEstimationService.ComputeAttack(null, planif, 16, AttackDifficulty.Normal, Re, oneSoulDefaultLevel);
            var b = MyHordesOptimizerEstimationService.ComputeAttack(null, planif, 16, AttackDifficulty.Normal, Re, twoSoulsPurifiedLevel);

            b.Should().BeEquivalentTo(a);
        }

        private static int Real(int baseValue) => (int)Math.Round(baseValue * 1.04, MidpointRounding.AwayFromZero);

        /// <summary>Forme du cas réel J16 : tour relevée à 1 âme, planif relevé à 0 âme, l'âme reste (attaque à 1) ou est purifiée (attaque à 0).</summary>
        [Theory]
        [InlineData(16, 1)]
        [InlineData(16, 0)]
        [InlineData(20, 1)]
        [InlineData(22, 1)]
        [InlineData(22, 0)]
        [InlineData(28, 1)]
        public void Solver_contains_the_real_attack_when_the_tower_has_one_soul_and_the_planif_none(int day, int attackSouls)
        {
            for (int seed = 0; seed < AttackSoundnessTests.Draws; seed++)
            {
                var sim = AttackSimulator.Simulate(seed * 7919 + day, day, Re, _ => 1, _ => 0, attackSouls);
                var scenario = new SoulsScenario(attackSouls, sim.TdgSouls, sim.PlanifSouls);

                var result = MyHordesOptimizerEstimationService.ComputeAttack(sim.Tdg, sim.Planif, day, AttackDifficulty.Normal, Re, scenario);

                result.Result.Min.Should().BeLessOrEqualTo(sim.RealAttack, $"jour {day}, attaque à {attackSouls} âme(s), tirage {seed}");
                result.Result.Max.Should().BeGreaterOrEqualTo(sim.RealAttack, $"jour {day}, attaque à {attackSouls} âme(s), tirage {seed}");
            }
        }

        [Theory]
        [InlineData(20)]
        [InlineData(22)]
        [InlineData(28)]
        public void The_pair_filter_still_tightens_the_window_when_every_row_has_one_soul(int day)
        {
            double legacyWidth = 0, soulWidth = 0;
            for (int seed = 0; seed < 200; seed++)
            {
                var plain = AttackSimulator.Simulate(seed * 104729 + day, day, Re, _ => 0, _ => 0, 0);
                var souled = AttackSimulator.Simulate(seed * 104729 + day, day, Re, _ => 1, _ => 1, 1);
                var scenario = new SoulsScenario(1, souled.TdgSouls, souled.PlanifSouls);

                var legacy = MyHordesOptimizerEstimationService.ComputeAttack(plain.Tdg, plain.Planif, day, AttackDifficulty.Normal, Re);
                var soul = MyHordesOptimizerEstimationService.ComputeAttack(souled.Tdg, souled.Planif, day, AttackDifficulty.Normal, Re, scenario);

                soul.Result.Min.Should().BeLessOrEqualTo(souled.RealAttack, $"jour {day}, tirage {seed}");
                soul.Result.Max.Should().BeGreaterOrEqualTo(souled.RealAttack, $"jour {day}, tirage {seed}");
                legacyWidth += Real(legacy.Result.Max) - Real(legacy.Result.Min);
                soulWidth += soul.Result.Max - soul.Result.Min;
            }

            // Même estimation sous-jacente : l'ancrage discret des paires rend la largeur d'un tirage chanceuse ou non, mais
            // cumulée sur 200 tirages la fenêtre à 1 âme doit être aussi serrée que la fenêtre sans âme ×1,04
            // (mesuré : ratio 0,95-0,99 avec le filtre exact, 1,07-1,15 sans filtre).
            soulWidth.Should().BeLessOrEqualTo(legacyWidth * 1.03, $"jour {day}");
        }

        [Theory]
        [InlineData(12, (int)TownType.RE, 3)]
        [InlineData(16, (int)TownType.RE, 3)]
        [InlineData(22, (int)TownType.RE, 6)]
        [InlineData(33, (int)TownType.PANDE, 8)]
        public void Solver_contains_the_real_attack_with_random_souls_per_row_and_at_attack(int day, int townType, int maxSouls)
        {
            for (int seed = 0; seed < AttackSoundnessTests.Draws; seed++)
            {
                var picker = new Random(seed * 31 + day);
                var tdgSouls = new int[25];
                var planifSouls = new int[25];
                for (int q = 0; q < 25; q++)
                {
                    tdgSouls[q] = picker.Next(0, maxSouls + 1);
                    planifSouls[q] = picker.Next(0, maxSouls + 1);
                }
                int attackSouls = picker.Next(0, maxSouls + 1);
                var sim = AttackSimulator.Simulate(seed * 7919 + day, day, townType, q => tdgSouls[q], q => planifSouls[q], attackSouls);
                var scenario = new SoulsScenario(attackSouls, sim.TdgSouls, sim.PlanifSouls);

                var result = MyHordesOptimizerEstimationService.ComputeAttack(sim.Tdg, sim.Planif, day, AttackDifficulty.Normal, townType, scenario);

                result.Result.Min.Should().BeLessOrEqualTo(sim.RealAttack, $"jour {day}, tirage {seed}");
                result.Result.Max.Should().BeGreaterOrEqualTo(sim.RealAttack, $"jour {day}, tirage {seed}");
            }
        }
    }
}
