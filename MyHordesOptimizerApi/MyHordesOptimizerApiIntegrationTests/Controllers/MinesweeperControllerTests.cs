using System.Linq;
using System.Net;
using System.Net.Http.Json;
using System.Threading.Tasks;
using FluentAssertions;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Minesweeper;
using MyHordesOptimizerApiIntegrationTests.ApplicationFactory;
using Xunit;

namespace MyHordesOptimizerApiIntegrationTests.Controllers
{
    public class MinesweeperControllerTests : ControllerTestBase
    {
        public MinesweeperControllerTests(MyHordesOptimizerApplicationFactory factory) : base(factory)
        {
        }

        public override Task InitializeAsync() => Task.CompletedTask;
        public override Task DisposeAsync() => Task.CompletedTask;

        [Fact]
        public async Task CreateGame_Normal_ReturnsBoardWithCorrectMineCount()
        {
            var request = new CreateMinesweeperGameRequestDto { SizeId = "small", Mode = "normal", FirstClickX = 4, FirstClickY = 4 };

            HttpResponseMessage response = await Client.PostAsJsonAsync("Minesweeper", request);
            response.StatusCode.Should().Be(HttpStatusCode.OK);

            var started = await response.Content.ReadFromJsonAsync<MinesweeperGameStartedDto>();
            started.Should().NotBeNull();
            started!.Width.Should().Be(9);
            started.Height.Should().Be(9);
            started.MineCount.Should().Be(10);
            started.Mines.Should().HaveCount(81);
            started.Mines.Count(m => m == 1).Should().Be(10);
            started.TimerStarted.Should().BeTrue();
        }

        [Fact]
        public async Task CreateGame_Normal_MissingFirstClick_ReturnsBadRequest()
        {
            var request = new CreateMinesweeperGameRequestDto { SizeId = "small", Mode = "normal" };

            HttpResponseMessage response = await Client.PostAsJsonAsync("Minesweeper", request);

            response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        }

        [Fact]
        public async Task CreateGame_Daily_CenterAlreadyRevealed_TimerNotStartedUntilStartCalled()
        {
            var request = new CreateMinesweeperGameRequestDto { SizeId = "small", Mode = "daily" };

            HttpResponseMessage createResponse = await Client.PostAsJsonAsync("Minesweeper", request);
            createResponse.StatusCode.Should().Be(HttpStatusCode.OK);
            var started = await createResponse.Content.ReadFromJsonAsync<MinesweeperGameStartedDto>();
            started!.TimerStarted.Should().BeFalse();

            HttpResponseMessage startResponse = await Client.PostAsync($"Minesweeper/{started.GameId}/Start", null);
            startResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        }

        [Fact]
        public async Task CompleteGame_Won_ComputesElapsedMsFromServerClock()
        {
            var createRequest = new CreateMinesweeperGameRequestDto { SizeId = "small", Mode = "normal", FirstClickX = 4, FirstClickY = 4 };
            HttpResponseMessage createResponse = await Client.PostAsJsonAsync("Minesweeper", createRequest);
            var started = await createResponse.Content.ReadFromJsonAsync<MinesweeperGameStartedDto>();

            await Task.Delay(50);

            HttpResponseMessage completeResponse = await Client.PostAsJsonAsync(
                $"Minesweeper/{started!.GameId}/Complete", new CompleteMinesweeperGameRequestDto { Outcome = "won" });
            completeResponse.StatusCode.Should().Be(HttpStatusCode.OK);

            var completed = await completeResponse.Content.ReadFromJsonAsync<CompleteMinesweeperGameResponseDto>();
            completed!.Outcome.Should().Be("won");
            completed.ElapsedMs.Should().BeGreaterOrEqualTo(50);
        }

        [Fact]
        public async Task CompleteGame_AlreadyCompleted_ReturnsConflict()
        {
            var createRequest = new CreateMinesweeperGameRequestDto { SizeId = "small", Mode = "normal", FirstClickX = 4, FirstClickY = 4 };
            HttpResponseMessage createResponse = await Client.PostAsJsonAsync("Minesweeper", createRequest);
            var started = await createResponse.Content.ReadFromJsonAsync<MinesweeperGameStartedDto>();

            await Client.PostAsJsonAsync($"Minesweeper/{started!.GameId}/Complete", new CompleteMinesweeperGameRequestDto { Outcome = "won" });
            HttpResponseMessage secondComplete = await Client.PostAsJsonAsync($"Minesweeper/{started.GameId}/Complete", new CompleteMinesweeperGameRequestDto { Outcome = "won" });

            secondComplete.StatusCode.Should().Be(HttpStatusCode.Conflict);
        }

        [Fact]
        public async Task CreateGame_UnknownGameIdOnComplete_ReturnsNotFound()
        {
            HttpResponseMessage response = await Client.PostAsJsonAsync("Minesweeper/999999999/Complete", new CompleteMinesweeperGameRequestDto { Outcome = "won" });

            response.StatusCode.Should().Be(HttpStatusCode.NotFound);
        }
    }
}
