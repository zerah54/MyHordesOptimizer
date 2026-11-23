using System.Linq;
using FluentAssertions;
using MyHordesOptimizerApi.Models;
using MyHordesOptimizerApi.Services.Impl.Bank;
using Xunit;

namespace MyHordesOptimizerApiUnitTests.Bank
{
    /// <summary>Règles pures de l'historique de la banque : normalisation, empreinte, enregistrement, purge, versions visibles.</summary>
    public class BankHistoryRulesTests
    {
        private static BankLine L(int item, bool broken, int count) => new BankLine(item, broken, count);

        [Fact]
        public void Normalize_DedoublonneEtRemplaceLesNull()
        {
            var items = new[]
            {
                new TownBankItem { IdItem = 5, IsBroken = null, Count = null },
                new TownBankItem { IdItem = 5, IsBroken = false, Count = 9 },
            };

            BankHistoryRules.Normalize(items).Should().Equal(new BankLine(5, false, 0));
        }

        [Fact]
        public void Fingerprint_IndependanteDeLOrdre_EtSensibleAuCompte()
        {
            var a = BankHistoryRules.Fingerprint(new[] { L(2, false, 1), L(1, true, 3) });
            var b = BankHistoryRules.Fingerprint(new[] { L(1, true, 3), L(2, false, 1) });
            var c = BankHistoryRules.Fingerprint(new[] { L(1, true, 4), L(2, false, 1) });

            a.Should().Be(b);
            a.Should().NotBe(c);
            a.Length.Should().Be(64);
        }

        [Fact]
        public void ShouldRecord_SansVersion_Vrai() => BankHistoryRules.ShouldRecord(null, "h", 3).Should().BeTrue();

        [Fact]
        public void ShouldRecord_MemeContenuMemeJour_Faux() => BankHistoryRules.ShouldRecord(new SnapshotRef(10, 3, "h"), "h", 3).Should().BeFalse();

        [Fact]
        public void ShouldRecord_MemeContenuJourSuivant_Vrai() => BankHistoryRules.ShouldRecord(new SnapshotRef(10, 3, "h"), "h", 4).Should().BeTrue();

        [Fact]
        public void ShouldRecord_JourInferieur_Vrai() => BankHistoryRules.ShouldRecord(new SnapshotRef(10, 4, "h"), "h", 3).Should().BeTrue();

        [Fact]
        public void SnapshotsToPurge_GardeLaDerniereDeChaqueJourEcoule()
        {
            var existing = new[] { new SnapshotRef(1, 2, "a"), new SnapshotRef(2, 2, "b"), new SnapshotRef(3, 3, "c"), new SnapshotRef(4, 3, "d"), new SnapshotRef(5, 4, "e") };

            BankHistoryRules.SnapshotsToPurge(existing, 4).Should().BeEquivalentTo(new[] { 1, 3 });
        }

        [Fact]
        public void SnapshotsToPurge_NeToucheJamaisUnJourSuperieurOuEgal()
        {
            var existing = new[] { new SnapshotRef(1, 5, "a"), new SnapshotRef(2, 5, "b") };

            BankHistoryRules.SnapshotsToPurge(existing, 3).Should().BeEmpty();
        }

        [Fact]
        public void VisibleVersions_JoursEcoulesUneSeuleVersion_JourCourantToutes()
        {
            var existing = new[] { new SnapshotRef(1, 2, "a"), new SnapshotRef(2, 2, "b"), new SnapshotRef(3, 3, "c"), new SnapshotRef(4, 3, "d") };

            BankHistoryRules.VisibleVersions(existing, 3).Select(s => s.IdLastUpdateInfo).Should().Equal(2, 3, 4);
        }

        [Fact]
        public void VisibleVersions_JourDeVilleApresLeJourMax_LeJourMaxEstEcoule()
        {
            var existing = new[] { new SnapshotRef(1, 2, "a"), new SnapshotRef(2, 3, "b"), new SnapshotRef(3, 3, "c") };

            BankHistoryRules.VisibleVersions(existing, 4).Select(s => s.IdLastUpdateInfo).Should().Equal(1, 3);
        }
    }
}
