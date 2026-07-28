using FluentAssertions;
using MyHordesOptimizerApi.Services.Impl.Import;

namespace MyHordesOptimizerApiUnitTests.Referentiels
{
    /// <summary>
    /// Le rapprochement d'un référentiel avec MyHordes se fait sur l'IDENTITÉ, jamais sur
    /// l'identifiant numérique — celui-ci est un auto-incrément de fixtures qui change d'une
    /// instance du jeu à l'autre.
    /// </summary>
    public class ReferentialReconcilerTests
    {
        private sealed class FakeEntry
        {
            public string? Uid { get; set; }
            public int? MhId { get; set; }
            public bool IsObsolete { get; set; }
        }

        private static ReferentialReconcileResult<FakeEntry> Reconcile(
            IReadOnlyCollection<FakeEntry> existants,
            params (string Uid, int MhId)[] source)
            => ReferentialReconciler.Reconcile(existants, source, entry => entry.Uid);

        [Fact]
        public void UidConnuDontLIdMyHordesChange_MetAJourSansMarquerObsolete()
        {
            // Le cas réel : MyHordes a renuméroté, small_pet_#00 est passé de 171 à 165.
            // Ce n'est PAS une disparition suivie d'une création.
            var existant = new FakeEntry { Uid = "small_pet_#00", MhId = 171 };

            var result = Reconcile(new[] { existant }, ("small_pet_#00", 165));

            result.AMettreAJour.Should().ContainSingle();
            result.AMettreAJour[0].Existant.Should().BeSameAs(existant);
            result.AMettreAJour[0].NouveauMhId.Should().Be(165);
            result.ACreer.Should().BeEmpty();
            result.ARendreObsoletes.Should().BeEmpty();
        }

        [Fact]
        public void UidInconnu_EstACreer()
        {
            var result = Reconcile(Array.Empty<FakeEntry>(), ("small_new_#00", 200));

            result.ACreer.Should().ContainSingle();
            result.ACreer[0].Uid.Should().Be("small_new_#00");
            result.ACreer[0].MhId.Should().Be(200);
        }

        [Fact]
        public void UidDisparu_EstMarqueObsolete_JamaisSupprime()
        {
            var disparu = new FakeEntry { Uid = "small_gone_#00", MhId = 42 };

            var result = Reconcile(new[] { disparu }, ("small_other_#00", 43));

            result.ARendreObsoletes.Should().ContainSingle().Which.Should().BeSameAs(disparu);
        }

        [Fact]
        public void UidReapparu_LeveLObsolescence()
        {
            // Un prototype retiré puis remis par le jeu doit reprendre du service SUR SA LIGNE
            // D'ORIGINE — sinon on créerait un doublon d'identité, et tout ce qui référence
            // l'ancienne ligne pointerait sur une entrée morte.
            var revenu = new FakeEntry { Uid = "small_back_#00", MhId = 10, IsObsolete = true };

            var result = Reconcile(new[] { revenu }, ("small_back_#00", 77));

            result.AMettreAJour.Should().ContainSingle();
            result.AMettreAJour[0].Existant.Should().BeSameAs(revenu);
            result.ARendreObsoletes.Should().BeEmpty();
            result.ACreer.Should().BeEmpty();
        }

        [Fact]
        public void EntreeSansUid_EstSignalee_PasMarqueeObsolete()
        {
            // Une ligne sans identité ne peut être rapprochée de rien. La marquer obsolète
            // serait arbitraire : on la laisse telle quelle et on la signale à l'appelant.
            var sansUid = new FakeEntry { Uid = null, MhId = 5 };

            var result = Reconcile(new[] { sansUid }, ("small_other_#00", 6));

            result.ARendreObsoletes.Should().NotContain(sansUid);
            result.SansIdentite.Should().ContainSingle().Which.Should().BeSameAs(sansUid);
        }

        [Fact]
        public void SourceVide_Leve_PlutotQueDeToutRendreObsolete()
        {
            // Garde-fou : une réponse MyHordes vide signifie une panne ou une maintenance,
            // pas la disparition du référentiel. Sans ce refus, un incident côté jeu
            // basculerait tout le catalogue en obsolète.
            var existant = new FakeEntry { Uid = "small_pet_#00", MhId = 171 };

            var action = () => Reconcile(new[] { existant });

            action.Should().Throw<InvalidOperationException>()
                .WithMessage("*source vide*");
        }

        [Fact]
        public void EntreePropreAMho_NEstNiRapprochee_NiRendueObsolete()
        {
            // La ruine « bâtiment non déterré » (IdRuin = -1) n'a AUCUN prototype MyHordes
            // derrière elle : c'est MHO qui la crée, en miroir du sentinel -1 que le jeu renvoie
            // pour une case enterrée. Sans exemption, le rapprochement la marquerait obsolète à
            // chaque import, la sortant des catalogues et cassant le calculateur de camping.
            var propre = new FakeEntry { Uid = "burried", MhId = null };
            var normale = new FakeEntry { Uid = "small_pet_#00", MhId = 165 };

            var result = ReferentialReconciler.Reconcile(
                new[] { propre, normale },
                new[] { ("small_pet_#00", 165) },
                entry => entry.Uid,
                estPropreAMho: entry => entry.Uid == "burried");

            result.PropresAMho.Should().ContainSingle().Which.Should().BeSameAs(propre);
            result.ARendreObsoletes.Should().BeEmpty();
            result.AMettreAJour.Should().ContainSingle()
                .Which.Existant.Should().BeSameAs(normale);
        }

        [Fact]
        public void RapprochementConverge_UnSecondPassageNeChangeRien()
        {
            // Un rapprochement sur l'identité doit être idempotent : s'il ne l'est pas,
            // c'est qu'il n'identifie pas.
            var existant = new FakeEntry { Uid = "small_pet_#00", MhId = 165 };

            var result = Reconcile(new[] { existant }, ("small_pet_#00", 165));

            result.ACreer.Should().BeEmpty();
            result.ARendreObsoletes.Should().BeEmpty();
            result.AMettreAJour.Should().ContainSingle()
                .Which.NouveauMhId.Should().Be(165);
        }
    }
}
