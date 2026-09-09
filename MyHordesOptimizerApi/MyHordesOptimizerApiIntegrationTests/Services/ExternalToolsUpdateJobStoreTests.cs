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
        public void Reserve_SurUnJoueurLibre_RendUnLancement()
        {
            NewStore().Reserve(42).Should().NotBeNull();
        }

        [Fact]
        public void Reserve_PendantQuUnLancementTourne_EnDemarreUnSecondAvecUnJobIdDistinct()
        {
            var store = NewStore();
            var first = store.Reserve(42);

            var second = store.Reserve(42);

            second.Should().NotBeNull();
            second.JobId.Should().NotBe(first.JobId);
        }

        [Fact]
        public void Reserve_PourUnAutreJoueur_EstAccepte()
        {
            var store = NewStore();
            store.Reserve(42);

            store.Reserve(43).Should().NotBeNull();
        }

        [Fact]
        public void GetState_SurUnJobIdInconnu_RendUnEtatVideEtNonEnCours()
        {
            var state = NewStore().GetState(Guid.NewGuid(), 42);

            state.JobId.Should().Be(Guid.Empty);
            state.IsRunning.Should().BeFalse();
            state.Tools.Should().BeEmpty();
        }

        [Fact]
        public void GetState_SurLeJobIdDunAutreJoueur_RendUnEtatVide()
        {
            var store = NewStore();
            var progress = store.Reserve(42);

            store.GetState(progress.JobId, 43).JobId.Should().Be(Guid.Empty);
        }

        [Fact]
        public void GetState_RendLEtatDuLancementEnCours()
        {
            var store = NewStore();
            var progress = store.Reserve(42);
            progress.Declare(ExternalToolId.FataMorgana, ExternalToolUpdateUnits.Map);

            var state = store.GetState(progress.JobId, 42);

            state.JobId.Should().Be(progress.JobId);
            state.Tools.Should().ContainSingle();
        }

        [Fact]
        public void GetState_SurDeuxLancementsDuMemeJoueur_SuitChacunIndependamment()
        {
            var store = NewStore();
            var first = store.Reserve(42);
            var second = store.Reserve(42);
            first.Declare(ExternalToolId.MyHordesOptimizer, ExternalToolUpdateUnits.Digs);
            second.Declare(ExternalToolId.GestHordes, ExternalToolUpdateUnits.Map);

            store.GetState(first.JobId, 42).Tools.Should().ContainSingle(tool => tool.Tool == ExternalToolId.MyHordesOptimizer.ToContractId());
            store.GetState(second.JobId, 42).Tools.Should().ContainSingle(tool => tool.Tool == ExternalToolId.GestHordes.ToContractId());
        }

        [Fact]
        public void GetState_ApresLaDureeDeConservation_OublieLeLancementTermine()
        {
            var store = NewStore();
            var progress = store.Reserve(42);
            progress.Complete(_now);
            _now = _now.Add(ExternalToolsUpdateJobStore.RetainFinishedFor).AddSeconds(1);

            store.GetState(progress.JobId, 42).JobId.Should().Be(Guid.Empty);
        }

        /// <summary>
        /// GestHordes/FataMorgana peuvent rester en vol plusieurs minutes (constaté en prod le
        /// 2026-09-09) : la tâche de fond continue et finit par appeler Complete(), mais si le
        /// registre a déjà oublié le job, ce succès devient invisible pour toujours côté client.
        /// </summary>
        [Fact]
        public void GetState_SurUnLancementEncoreEnCoursApresCinqMinutes_RestConsultable()
        {
            var store = NewStore();
            var progress = store.Reserve(42);
            _now = _now.AddMinutes(6);

            store.GetState(progress.JobId, 42).JobId.Should().Be(progress.JobId);
        }
    }
}
