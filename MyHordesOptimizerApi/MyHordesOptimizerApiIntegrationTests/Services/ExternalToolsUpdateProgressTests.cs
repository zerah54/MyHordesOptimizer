using FluentAssertions;
using MyHordesOptimizerApi.Models.ExternalTools;
using MyHordesOptimizerApi.Services.Impl.ExternalTools;
using System;
using System.Linq;

namespace MyHordesOptimizerApiIntegrationTests.Services
{
    public class ExternalToolsUpdateProgressTests
    {
        private static ExternalToolsUpdateProgress NewProgress()
        {
            return new ExternalToolsUpdateProgress(new DateTime(2026, 7, 29, 12, 0, 0, DateTimeKind.Utc));
        }

        private static ExternalToolUpdateState ToolOf(ExternalToolsUpdateJobState state, ExternalToolId tool)
        {
            return state.Tools.SingleOrDefault(candidate => candidate.Tool == tool.ToContractId());
        }

        [Fact]
        public void Declare_MetLOutilEnPending()
        {
            var progress = NewProgress();

            progress.Declare(ExternalToolId.MyHordesOptimizer, ExternalToolUpdateUnits.Map);

            ToolOf(progress.Snapshot(), ExternalToolId.MyHordesOptimizer).Status.Should().Be("pending");
        }

        [Fact]
        public void UnOutilNonDeclare_EstAbsentDeLEtat()
        {
            var progress = NewProgress();

            progress.Declare(ExternalToolId.MyHordesOptimizer, ExternalToolUpdateUnits.Map);

            ToolOf(progress.Snapshot(), ExternalToolId.GestHordes).Should().BeNull();
        }

        [Fact]
        public void UneSeuleUniteTerminee_LaisseLOutilEnPending()
        {
            var progress = NewProgress();
            progress.Declare(ExternalToolId.GestHordes, ExternalToolUpdateUnits.Map);
            progress.Declare(ExternalToolId.GestHordes, ExternalToolUpdateUnits.Citizen);

            progress.Succeeded(ExternalToolId.GestHordes, ExternalToolUpdateUnits.Map);

            ToolOf(progress.Snapshot(), ExternalToolId.GestHordes).Status.Should().Be("pending");
        }

        [Fact]
        public void ToutesLesUnitesTerminees_PassentLOutilEnSuccess()
        {
            var progress = NewProgress();
            progress.Declare(ExternalToolId.GestHordes, ExternalToolUpdateUnits.Map);
            progress.Declare(ExternalToolId.GestHordes, ExternalToolUpdateUnits.Citizen);

            progress.Succeeded(ExternalToolId.GestHordes, ExternalToolUpdateUnits.Map);
            progress.Succeeded(ExternalToolId.GestHordes, ExternalToolUpdateUnits.Citizen);

            ToolOf(progress.Snapshot(), ExternalToolId.GestHordes).Status.Should().Be("success");
        }

        [Fact]
        public void UneErreur_PasseLOutilEnErrorSansAttendreLesAutresUnites()
        {
            var progress = NewProgress();
            progress.Declare(ExternalToolId.MyHordesOptimizer, ExternalToolUpdateUnits.Map);
            progress.Declare(ExternalToolId.MyHordesOptimizer, ExternalToolUpdateUnits.Bags);

            progress.Failed(ExternalToolId.MyHordesOptimizer, ExternalToolUpdateUnits.Bags, "sacs KO");

            var tool = ToolOf(progress.Snapshot(), ExternalToolId.MyHordesOptimizer);
            tool.Status.Should().Be("error");
            tool.Errors.Should().ContainSingle().Which.Message.Should().Be("sacs KO");
        }

        [Fact]
        public void UneUniteReussieApresUneErreur_NeRepassePasLOutilEnSuccess()
        {
            var progress = NewProgress();
            progress.Declare(ExternalToolId.MyHordesOptimizer, ExternalToolUpdateUnits.Map);
            progress.Declare(ExternalToolId.MyHordesOptimizer, ExternalToolUpdateUnits.Bags);

            progress.Failed(ExternalToolId.MyHordesOptimizer, ExternalToolUpdateUnits.Bags, "sacs KO");
            progress.Succeeded(ExternalToolId.MyHordesOptimizer, ExternalToolUpdateUnits.Map);

            ToolOf(progress.Snapshot(), ExternalToolId.MyHordesOptimizer).Status.Should().Be("error");
        }

        [Fact]
        public void PlusieursErreurs_SontToutesConservees()
        {
            var progress = NewProgress();
            progress.Declare(ExternalToolId.MyHordesOptimizer, ExternalToolUpdateUnits.Map);
            progress.Declare(ExternalToolId.MyHordesOptimizer, ExternalToolUpdateUnits.Digs);

            progress.Failed(ExternalToolId.MyHordesOptimizer, ExternalToolUpdateUnits.Map, "carte KO");
            progress.Failed(ExternalToolId.MyHordesOptimizer, ExternalToolUpdateUnits.Digs, "fouilles KO");

            ToolOf(progress.Snapshot(), ExternalToolId.MyHordesOptimizer).Errors.Should().HaveCount(2);
        }

        [Fact]
        public void FailAllPending_CibleUnSeulOutil_NAffectePasLesAutres()
        {
            var progress = NewProgress();
            progress.Declare(ExternalToolId.MyHordesOptimizer, ExternalToolUpdateUnits.Map);
            progress.Declare(ExternalToolId.GestHordes, ExternalToolUpdateUnits.Map);

            progress.FailAllPending(ExternalToolUpdateUnits.Map, "base injoignable", ExternalToolId.MyHordesOptimizer);

            var state = progress.Snapshot();
            ToolOf(state, ExternalToolId.MyHordesOptimizer).Status.Should().Be("error");
            ToolOf(state, ExternalToolId.GestHordes).Status.Should().Be("pending");
        }

        [Fact]
        public void FailAllPending_NEcrasePasUnOutilDejaTermine()
        {
            var progress = NewProgress();
            progress.Declare(ExternalToolId.GestHordes, ExternalToolUpdateUnits.Map);
            progress.Succeeded(ExternalToolId.GestHordes, ExternalToolUpdateUnits.Map);

            progress.FailAllPending(ExternalToolUpdateUnits.Job, "explosion", null);

            ToolOf(progress.Snapshot(), ExternalToolId.GestHordes).Status.Should().Be("success");
        }

        [Fact]
        public void Snapshot_EstUneCopieProfonde()
        {
            var progress = NewProgress();
            progress.Declare(ExternalToolId.MyHordesOptimizer, ExternalToolUpdateUnits.Map);
            var snapshot = progress.Snapshot();

            progress.Failed(ExternalToolId.MyHordesOptimizer, ExternalToolUpdateUnits.Map, "trop tard");

            ToolOf(snapshot, ExternalToolId.MyHordesOptimizer).Status.Should().Be("pending");
            ToolOf(snapshot, ExternalToolId.MyHordesOptimizer).Errors.Should().BeEmpty();
        }

        [Fact]
        public void Complete_ArreteLeJobEtHorodateLaFin()
        {
            var progress = NewProgress();
            var finishedAt = new DateTime(2026, 7, 29, 12, 0, 30, DateTimeKind.Utc);

            progress.Complete(finishedAt);

            var state = progress.Snapshot();
            state.IsRunning.Should().BeFalse();
            state.FinishedAt.Should().Be(finishedAt);
        }

        [Fact]
        public void UnJobNeuf_EstEnCoursEtPorteUnIdentifiant()
        {
            var state = NewProgress().Snapshot();

            state.IsRunning.Should().BeTrue();
            state.JobId.Should().NotBe(Guid.Empty);
        }
    }
}
