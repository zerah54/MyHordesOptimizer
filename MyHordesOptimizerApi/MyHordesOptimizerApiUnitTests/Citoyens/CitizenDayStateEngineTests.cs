using System;
using System.Collections.Generic;
using System.Linq;
using FluentAssertions;
using MyHordesOptimizerApi.Models.CitizenState;
using MyHordesOptimizerApi.Repository.Impl;
using MyHordesOptimizerApi.Services.Impl;
using MyHordesOptimizerApi.Services.Interfaces;
using Xunit;

namespace MyHordesOptimizerApiUnitTests.Citoyens
{
    /// <summary>
    /// Moteur de simulation bout en bout — s'appuie sur les vraies actions.json/meta-results.json
    /// (via MyHordesCodeRepository, aucune dépendance DB) et un faux ICitizenItemActionsProvider.
    /// Voir section 9 du spec sous-projet B.
    /// </summary>
    public class CitizenDayStateEngineTests
    {
        private const int EatItemId = 1;
        private const int BandageItemId = 2;
        private const int UnknownItemId = 999;
        private const int DrugItemId = 3;
        private const int FoodItemId1 = 4;
        private const int FoodItemId2 = 5;
        private const int WaterItemId = 6;
        private const int GhoulSerumItemId = 7;

        private static ICitizenDayStateEngine CreateEngine(Dictionary<int, string[]> itemActions)
        {
            return new CitizenDayStateEngine(new MyHordesCodeRepository(), new FakeItemActionsProvider(itemActions));
        }

        [Fact]
        public void Simulate_ManderEatSix_RemonteApAuMaxEtAjouteHasEaten()
        {
            var engine = CreateEngine(new Dictionary<int, string[]> { [EatItemId] = new[] { "eat_6ap" } });
            var start = new CitizenState { Ap = 2, Sp = 0, Wounded = false };

            var trace = engine.Simulate(start, new List<CitizenStateStep> { new ItemActionStep { ItemId = EatItemId } });

            trace.Steps.Should().HaveCount(1);
            trace.Steps[0].StateAfter.Ap.Should().Be(6); // max non blessé (CitizenPointRules.GetMaxAp)
            trace.Steps[0].StateAfter.Statuses.Should().Contain("haseaten");
        }

        [Fact]
        public void Simulate_DeplacementZoneLointaine_DebiteLeSp()
        {
            var engine = CreateEngine(new Dictionary<int, string[]>());
            var start = new CitizenState { Ap = 6, Sp = 2, IsEclaireur = true };

            var trace = engine.Simulate(start, new List<CitizenStateStep> { new MoveStep { IsNearZone = false } });

            trace.Steps[0].StateAfter.Sp.Should().Be(1);
            trace.Steps[0].StateAfter.Ap.Should().Be(6);
        }

        [Fact]
        public void Simulate_DeplacementsLointainsRepetes_EpuiseLeSpPuisPreleveSurAp()
        {
            var engine = CreateEngine(new Dictionary<int, string[]>());
            var start = new CitizenState { Ap = 6, Sp = 2, IsEclaireur = true };
            var steps = Enumerable.Range(0, 3).Select(_ => (CitizenStateStep)new MoveStep { IsNearZone = false }).ToList();

            var trace = engine.Simulate(start, steps);

            trace.Steps[0].StateAfter.Sp.Should().Be(1);
            trace.Steps[1].StateAfter.Sp.Should().Be(0);
            trace.Steps[2].StateAfter.Sp.Should().Be(0);
            trace.Steps[2].StateAfter.Ap.Should().Be(5); // 3e déplacement : SP insuffisant, 1 point prélevé sur AP
        }

        [Fact]
        public void Simulate_ApTombeAZero_InfligeTired()
        {
            var engine = CreateEngine(new Dictionary<int, string[]>());
            var start = new CitizenState { Ap = 1, Sp = 0 };

            var trace = engine.Simulate(start, new List<CitizenStateStep> { new MoveStep { IsNearZone = true } });

            trace.Steps[0].StateAfter.Ap.Should().Be(0);
            trace.Steps[0].StateAfter.Statuses.Should().Contain("tired");
        }

        [Fact]
        public void Simulate_OnzeDeplacements_DeclencheThirst1EtRemetLeCompteurAZero()
        {
            var engine = CreateEngine(new Dictionary<int, string[]>());
            var start = new CitizenState { Ap = 20, Sp = 0 };
            var steps = Enumerable.Range(0, 11).Select(_ => (CitizenStateStep)new MoveStep { IsNearZone = true }).ToList();

            var trace = engine.Simulate(start, steps);

            trace.Steps.Should().HaveCount(11);
            trace.Steps[10].StateAfter.Statuses.Should().Contain("thirst1");
            trace.Steps[10].StateAfter.WalkingDistance.Should().Be(0);
            trace.Steps[10].StateAfter.IsDead.Should().BeFalse();
        }

        [Fact]
        public void Simulate_MortParDeshydratation_ArreteLaTraceMaisIncluLeDernierPas()
        {
            var engine = CreateEngine(new Dictionary<int, string[]>());
            var start = new CitizenState { Ap = 20, Sp = 0, WalkingDistance = 10, Statuses = new HashSet<string> { "thirst2" } };
            var steps = new List<CitizenStateStep>
            {
                new MoveStep { IsNearZone = true },
                new MoveStep { IsNearZone = true }, // ne doit jamais être jouée
            };

            var trace = engine.Simulate(start, steps);

            trace.Steps.Should().HaveCount(1);
            trace.Steps[0].StateAfter.IsDead.Should().BeTrue();
        }

        [Fact]
        public void Simulate_ItemAvecPlusieursActions_AppliqueChacune()
        {
            var engine = CreateEngine(new Dictionary<int, string[]> { [BandageItemId] = new[] { "bandage" } });
            var start = new CitizenState { Wounded = true, Statuses = new HashSet<string> { "tg_meta_wound", "wound3" } };

            var trace = engine.Simulate(start, new List<CitizenStateStep> { new ItemActionStep { ItemId = BandageItemId } });

            trace.Steps[0].StateAfter.Statuses.Should().NotContain("wound3");
            trace.Steps[0].StateAfter.Statuses.Should().NotContain("tg_meta_wound");
            trace.Steps[0].StateAfter.Statuses.Should().Contain("healed");
            trace.Steps[0].StateAfter.Wounded.Should().BeFalse(); // isWounded est dérivé des statuts, pas un flag indépendant
        }

        [Fact]
        public void Simulate_EquipeDesBaskets_ActiveHasShoesEtAugmenteLeSp()
        {
            var engine = CreateEngine(new Dictionary<int, string[]>());
            var start = new CitizenState { Ap = 6, Sp = 0, HasShoes = false };

            var trace = engine.Simulate(start, new List<CitizenStateStep> { new EquipShoesStep() });

            trace.Steps[0].StateAfter.HasShoes.Should().BeTrue();
            trace.Steps[0].StateAfter.Sp.Should().Be(1); // plus_1sp_e (actions.json: equip_shoe_first)
        }

        [Fact]
        public void Simulate_MonteAVelo_ActiveHasBikeEtAugmenteLeSp()
        {
            var engine = CreateEngine(new Dictionary<int, string[]>());
            var start = new CitizenState { Ap = 6, Sp = 0, HasBike = false };

            var trace = engine.Simulate(start, new List<CitizenStateStep> { new MountBikeStep() });

            trace.Steps[0].StateAfter.HasBike.Should().BeTrue();
            trace.Steps[0].StateAfter.Sp.Should().Be(2); // plus_2sp_e (actions.json: equip_bike_first)
        }

        [Fact]
        public void Simulate_RamasseObjetDefenseZone_ActiveHasDefenceCpItem()
        {
            var engine = CreateEngine(new Dictionary<int, string[]>());
            var start = new CitizenState { Ap = 6, Sp = 0, HasDefenceCpItem = false };

            var trace = engine.Simulate(start, new List<CitizenStateStep> { new PickupDefenceCpItemStep() });

            trace.Steps[0].StateAfter.HasDefenceCpItem.Should().BeTrue();
        }

        [Fact]
        public void Simulate_DescendDuVelo_DesactiveHasBikeEtRetireLeSp()
        {
            var engine = CreateEngine(new Dictionary<int, string[]>());
            var start = new CitizenState { Ap = 6, Sp = 2, HasBike = true };

            var trace = engine.Simulate(start, new List<CitizenStateStep> { new DismountBikeStep() });

            trace.Steps[0].StateAfter.HasBike.Should().BeFalse();
            trace.Steps[0].StateAfter.Sp.Should().Be(0); // minus_2sp (actions.json: unequip_bike_first)
        }

        [Fact]
        public void Simulate_UneSeuleDrogueDansLaJournee_NeRendJamaisAddict()
        {
            // Une drogue est rattachée aux 2 variantes meta "drug_1"/"drug_2" (1re/2e prise du jour) :
            // seule la 1re doit s'appliquer, jamais "drug_addict" dès le premier usage.
            var engine = CreateEngine(new Dictionary<int, string[]> { [DrugItemId] = new[] { "drug_6ap_1", "drug_6ap_2" } });
            var start = new CitizenState { Ap = 0, Sp = 0 };

            var trace = engine.Simulate(start, new List<CitizenStateStep> { new ItemActionStep { ItemId = DrugItemId } });

            trace.Steps[0].StateAfter.Statuses.Should().Contain("drugged");
            trace.Steps[0].StateAfter.Statuses.Should().NotContain("addict");
        }

        [Fact]
        public void Simulate_DeuxDroguesLaMemeJournee_RendAddictALaSeconde()
        {
            var engine = CreateEngine(new Dictionary<int, string[]> { [DrugItemId] = new[] { "drug_6ap_1", "drug_6ap_2" } });
            var start = new CitizenState { Ap = 0, Sp = 0 };
            var steps = new List<CitizenStateStep>
            {
                new ItemActionStep { ItemId = DrugItemId },
                new ItemActionStep { ItemId = DrugItemId },
            };

            var trace = engine.Simulate(start, steps);

            trace.Steps[0].StateAfter.Statuses.Should().NotContain("addict");
            trace.Steps[1].StateAfter.Statuses.Should().Contain("addict");
        }

        [Fact]
        public void Simulate_DeuxRepasLaMemeJournee_LeSecondNaAucunEffet()
        {
            // can_eat (BeyondController.php:264) exige de ne pas avoir déjà "haseaten" : un 2e repas
            // le même jour doit être un no-op complet, pas juste plafonné à l'AP max.
            var engine = CreateEngine(new Dictionary<int, string[]>
            {
                [FoodItemId1] = new[] { "eat_4ap" },
                [FoodItemId2] = new[] { "eat_6ap" },
            });
            var start = new CitizenState { Ap = 0, Sp = 0 };
            var steps = new List<CitizenStateStep>
            {
                new ItemActionStep { ItemId = FoodItemId1 },
                new ItemActionStep { ItemId = FoodItemId2 },
            };

            var trace = engine.Simulate(start, steps);

            trace.Steps[0].StateAfter.Ap.Should().Be(4);
            trace.Steps[1].StateAfter.Ap.Should().Be(4); // eat_6ap aurait remonté à 6 si non bloqué
        }

        [Fact]
        public void Simulate_CitoyenNormalBoitDeLEau_SeDesaltereSansBlessure()
        {
            var engine = CreateEngine(new Dictionary<int, string[]> { [WaterItemId] = new[] { "water_tl0", "water_g" } });
            var start = new CitizenState { IsRoleGhoul = false };

            var trace = engine.Simulate(start, new List<CitizenStateStep> { new ItemActionStep { ItemId = WaterItemId } });

            trace.Steps[0].StateAfter.Wounded.Should().BeFalse();
            trace.Steps[0].StateAfter.Statuses.Should().NotContain("tg_meta_wound");
        }

        [Fact]
        public void Simulate_BoitDeLEauSansSoif_NInfligeAucuneSoif()
        {
            // Bug : sans filtre de palier, water_tl2 (drink_no_ap, statusFrom=thirst2/statusTo=thirst1)
            // s'appliquait quel que soit l'état de départ — un citoyen pas assoiffé se retrouvait
            // avec "thirst1" juste en buvant.
            var engine = CreateEngine(new Dictionary<int, string[]>
                { [WaterItemId] = new[] { "water_tl0", "water_tl1a", "water_tl1b", "water_tl2", "water_g" } });
            var start = new CitizenState();

            var trace = engine.Simulate(start, new List<CitizenStateStep> { new ItemActionStep { ItemId = WaterItemId } });

            trace.Steps[0].StateAfter.Statuses.Should().NotContain("thirst1");
            trace.Steps[0].StateAfter.Statuses.Should().NotContain("thirst2");
        }

        [Fact]
        public void Simulate_BoitDeLEauAvecThirst1_EtancheCompletement()
        {
            var engine = CreateEngine(new Dictionary<int, string[]>
                { [WaterItemId] = new[] { "water_tl0", "water_tl1a", "water_tl1b", "water_tl2", "water_g" } });
            var start = new CitizenState { Statuses = new HashSet<string> { "thirst1" } };

            var trace = engine.Simulate(start, new List<CitizenStateStep> { new ItemActionStep { ItemId = WaterItemId } });

            trace.Steps[0].StateAfter.Statuses.Should().NotContain("thirst1");
            trace.Steps[0].StateAfter.Statuses.Should().NotContain("thirst2");
        }

        [Fact]
        public void Simulate_BoitDeLEauAvecThirst2_DescendUnSeulPalier()
        {
            // drink_no_ap (water_tl2) ne désaltère que d'un palier quand on part de "très assoiffé" —
            // comportement voulu (can_drink limite à une boisson/jour), pas un bug.
            var engine = CreateEngine(new Dictionary<int, string[]>
                { [WaterItemId] = new[] { "water_tl0", "water_tl1a", "water_tl1b", "water_tl2", "water_g" } });
            var start = new CitizenState { Statuses = new HashSet<string> { "thirst2" } };

            var trace = engine.Simulate(start, new List<CitizenStateStep> { new ItemActionStep { ItemId = WaterItemId } });

            trace.Steps[0].StateAfter.Statuses.Should().NotContain("thirst2");
            trace.Steps[0].StateAfter.Statuses.Should().Contain("thirst1");
        }

        [Fact]
        public void Simulate_DeuxRationsDeauLaMemeJournee_LaSecondeNeRendAucunPa()
        {
            // can_drink (BeyondController.php) limite le bonus PA de l'eau à une fois par jour — comme
            // "haseaten" pour la nourriture, "hasdrunk" doit bloquer drink_ap_1 (mais pas drink_ap_2,
            // qui doit continuer à désaltérer) sur les usages suivants.
            var engine = CreateEngine(new Dictionary<int, string[]>
                { [WaterItemId] = new[] { "water_tl0", "water_tl1a", "water_tl1b", "water_tl2", "water_g" } });
            var start = new CitizenState { Ap = 3, Sp = 0 };
            var steps = new List<CitizenStateStep>
            {
                new ItemActionStep { ItemId = WaterItemId },
                new MoveStep { IsNearZone = true },
                new ItemActionStep { ItemId = WaterItemId },
            };

            var trace = engine.Simulate(start, steps);

            trace.Steps[0].StateAfter.Ap.Should().Be(6); // 1re ration : plancher à MaxAp
            trace.Steps[1].StateAfter.Ap.Should().Be(5); // déplacement : -1 PA
            trace.Steps[2].StateAfter.Ap.Should().Be(5); // 2e ration la même journée : aucun PA rendu
        }

        [Fact]
        public void Simulate_DeuxiemeRationDeauMemeJournee_EtancheQuandMemeLaSoif()
        {
            var engine = CreateEngine(new Dictionary<int, string[]>
                { [WaterItemId] = new[] { "water_tl0", "water_tl1a", "water_tl1b", "water_tl2", "water_g" } });
            var start = new CitizenState { Ap = 3, Sp = 0, Statuses = new HashSet<string> { "hasdrunk", "thirst1" } };

            var trace = engine.Simulate(start, new List<CitizenStateStep> { new ItemActionStep { ItemId = WaterItemId } });

            trace.Steps[0].StateAfter.Ap.Should().Be(3); // gate PA actif
            trace.Steps[0].StateAfter.Statuses.Should().NotContain("thirst1"); // désaltération toujours active
        }

        [Fact]
        public void Simulate_GouleBoitDeLEau_SeBlesseSansSeDesalterer()
        {
            // water_g (role_ghoul) inflige une blessure au lieu de désaltérer — CitizenHandler ne
            // laisse jamais une goule tirer un bénéfice de soif de l'eau.
            var engine = CreateEngine(new Dictionary<int, string[]> { [WaterItemId] = new[] { "water_tl0", "water_g" } });
            var start = new CitizenState { IsRoleGhoul = true };

            var trace = engine.Simulate(start, new List<CitizenStateStep> { new ItemActionStep { ItemId = WaterItemId } });

            trace.Steps[0].StateAfter.Wounded.Should().BeTrue();
            trace.Steps[0].StateAfter.Statuses.Should().Contain("tg_meta_wound");
        }

        [Fact]
        public void Simulate_DevientGoule_ActiveIsRoleGhoul()
        {
            var engine = CreateEngine(new Dictionary<int, string[]>());
            var start = new CitizenState { IsRoleGhoul = false };

            var trace = engine.Simulate(start, new List<CitizenStateStep> { new BecomeGhoulStep() });

            trace.Steps[0].StateAfter.IsRoleGhoul.Should().BeTrue();
        }

        [Fact]
        public void Simulate_GouleUtiliseLeVaccin_RedevientNonGoule()
        {
            var engine = CreateEngine(new Dictionary<int, string[]> { [GhoulSerumItemId] = new[] { "ghoul_serum" } });
            var start = new CitizenState { IsRoleGhoul = true };

            var trace = engine.Simulate(start, new List<CitizenStateStep> { new ItemActionStep { ItemId = GhoulSerumItemId } });

            trace.Steps[0].StateAfter.IsRoleGhoul.Should().BeFalse();
        }

        [Fact]
        public void Simulate_ItemInconnu_NeFaitRienEtNePlantePas()
        {
            var engine = CreateEngine(new Dictionary<int, string[]>());
            var start = new CitizenState { Ap = 4, Sp = 1 };

            var trace = engine.Simulate(start, new List<CitizenStateStep> { new ItemActionStep { ItemId = UnknownItemId } });

            trace.Steps.Should().HaveCount(1);
            trace.Steps[0].StateAfter.Ap.Should().Be(4);
            trace.Steps[0].StateAfter.Sp.Should().Be(1);
        }

        private class FakeItemActionsProvider : ICitizenItemActionsProvider
        {
            private readonly Dictionary<int, string[]> _actionsByItemId;

            public FakeItemActionsProvider(Dictionary<int, string[]> actionsByItemId) => _actionsByItemId = actionsByItemId;

            public IReadOnlyList<string> GetActionNames(int itemId) =>
                _actionsByItemId.TryGetValue(itemId, out var names) ? names : Array.Empty<string>();
        }
    }
}
