using FluentAssertions;
using MyHordesOptimizerApi.Models.ExternalTools;
using MyHordesOptimizerApi.Services.Impl.ExternalTools;
using System;

namespace MyHordesOptimizerApiIntegrationTests.Services
{
    public class ExternalToolsUpdateJobStoreTests
    {
        private DateTime _now = new(2026, 7, 29, 12, 0, 0, DateTimeKind.Utc);

        private ExternalToolsUpdateJobStore NewStore()
        {
            return new ExternalToolsUpdateJobStore(() => _now);
        }

        [Fact]
        public void TryReserve_SurUnJoueurLibre_RendUnLancement()
        {
            NewStore().TryReserve(42).Should().NotBeNull();
        }

        [Fact]
        public void TryReserve_PendantQuUnLancementTourne_EstRefuse()
        {
            var store = NewStore();
            store.TryReserve(42);

            store.TryReserve(42).Should().BeNull();
        }

        [Fact]
        public void TryReserve_PourUnAutreJoueur_EstAccepte()
        {
            var store = NewStore();
            store.TryReserve(42);

            store.TryReserve(43).Should().NotBeNull();
        }

        [Fact]
        public void TryReserve_ApresLaFinDuPrecedent_EstAccepte()
        {
            var store = NewStore();
            var first = store.TryReserve(42);
            first.Complete(_now);

            store.TryReserve(42).Should().NotBeNull();
        }

        [Fact]
        public void TryReserve_SurUnLancementBloqueDepuisPlusDeCinqMinutes_EstAccepte()
        {
            var store = NewStore();
            store.TryReserve(42);
            _now = _now.Add(ExternalToolsUpdateJobStore.StaleAfter).AddSeconds(1);

            store.TryReserve(42).Should().NotBeNull();
        }

        [Fact]
        public void GetState_SurUnJoueurInconnu_RendUnEtatVideEtNonEnCours()
        {
            var state = NewStore().GetState(42);

            state.JobId.Should().Be(Guid.Empty);
            state.IsRunning.Should().BeFalse();
            state.Tools.Should().BeEmpty();
        }

        [Fact]
        public void GetState_RendLEtatDuLancementEnCours()
        {
            var store = NewStore();
            var progress = store.TryReserve(42);
            progress.Declare(ExternalToolId.FataMorgana, ExternalToolUpdateUnits.Map);

            var state = store.GetState(42);

            state.JobId.Should().Be(progress.JobId);
            state.Tools.Should().ContainSingle();
        }

        [Fact]
        public void GetState_ApresLaDureeDeConservation_OublieLeLancementTermine()
        {
            var store = NewStore();
            var progress = store.TryReserve(42);
            progress.Complete(_now);
            _now = _now.Add(ExternalToolsUpdateJobStore.RetainFinishedFor).AddSeconds(1);

            store.GetState(42).JobId.Should().Be(Guid.Empty);
        }
    }
}
