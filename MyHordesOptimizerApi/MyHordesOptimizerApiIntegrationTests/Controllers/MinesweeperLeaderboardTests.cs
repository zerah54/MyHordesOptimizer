using System.Collections.Generic;
using System.Net;
using System.Net.Http.Json;
using System.Threading.Tasks;
using FluentAssertions;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Minesweeper;
using MyHordesOptimizerApiIntegrationTests.ApplicationFactory;
using Xunit;

namespace MyHordesOptimizerApiIntegrationTests.Controllers
{
    public class MinesweeperLeaderboardTests : ControllerTestBase
    {
        public MinesweeperLeaderboardTests(MyHordesOptimizerApplicationFactory factory) : base(factory)
        {
        }

        public override Task InitializeAsync() => Task.CompletedTask;
        public override Task DisposeAsync() => Task.CompletedTask;

        [Fact]
        public async Task GetLeaderboard_UnknownSize_ReturnsBadRequest()
        {
            HttpResponseMessage response = await Client.GetAsync("Minesweeper/Leaderboard?sizeId=custom&mode=normal&view=top");

            response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        }

        [Fact]
        public async Task GetLeaderboard_NoScoresYet_ReturnsEmptyPage()
        {
            HttpResponseMessage response = await Client.GetAsync("Minesweeper/Leaderboard?sizeId=expert&mode=normal&view=players&page=1&pageSize=10");

            response.StatusCode.Should().Be(HttpStatusCode.OK);
            var page = await response.Content.ReadFromJsonAsync<MinesweeperLeaderboardPageDto>();
            page.Should().NotBeNull();
            page!.Items.Should().NotBeNull();
        }

        [Fact]
        public async Task GetMyRank_AnonymousCaller_ReturnsNullRank()
        {
            HttpResponseMessage response = await Client.GetAsync("Minesweeper/Leaderboard/Me?sizeId=small");

            response.StatusCode.Should().Be(HttpStatusCode.OK);
            var content = await response.Content.ReadAsStringAsync();
            content.Should().Be("null");
        }

        [Fact]
        public async Task GetChallengesToday_ReturnsAllFivePresetSizes()
        {
            HttpResponseMessage response = await Client.GetAsync("Minesweeper/Challenges/Today");

            response.StatusCode.Should().Be(HttpStatusCode.OK);
            var challenges = await response.Content.ReadFromJsonAsync<List<MinesweeperChallengeStatusDto>>();
            challenges.Should().HaveCount(5);
        }

        [Fact]
        public async Task GetMyHistory_AnonymousCaller_ReturnsEmptyList()
        {
            HttpResponseMessage response = await Client.GetAsync("Minesweeper/Me");

            response.StatusCode.Should().Be(HttpStatusCode.OK);
            var history = await response.Content.ReadFromJsonAsync<MinesweeperGameHistoryPageDto>();
            history!.Items.Should().BeEmpty();
            history.TotalCount.Should().Be(0);
        }
    }
}
