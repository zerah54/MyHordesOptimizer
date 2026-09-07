using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.Controllers.Abstract;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Minesweeper;
using MyHordesOptimizerApi.Providers.Interfaces;
using MyHordesOptimizerApi.Services.Interfaces;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace MyHordesOptimizerApi.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class MinesweeperController : AbstractMyHordesOptimizerControllerBase
    {
        private readonly IMinesweeperService _minesweeperService;

        public MinesweeperController(ILogger<AbstractMyHordesOptimizerControllerBase> logger,
            IUserInfoProvider userKeyProvider,
            IMinesweeperService minesweeperService) : base(logger, userKeyProvider)
        {
            _minesweeperService = minesweeperService;
        }

        [HttpPost]
        public async Task<ActionResult<MinesweeperGameStartedDto>> CreateGame(CreateMinesweeperGameRequestDto request)
        {
            return await _minesweeperService.CreateGameAsync(request);
        }

        [HttpPost]
        [Route("{gameId}/Start")]
        public async Task<ActionResult<StartMinesweeperGameResponseDto>> StartGame(int gameId)
        {
            return await _minesweeperService.StartGameAsync(gameId);
        }

        [HttpPost]
        [Route("{gameId}/Complete")]
        public async Task<ActionResult<CompleteMinesweeperGameResponseDto>> CompleteGame(int gameId, CompleteMinesweeperGameRequestDto request)
        {
            return await _minesweeperService.CompleteGameAsync(gameId, request);
        }

        [HttpGet]
        [Route("Leaderboard")]
        public async Task<ActionResult<MinesweeperLeaderboardPageDto>> GetLeaderboard(string sizeId, string mode, string view = "top", int page = 1, int pageSize = 50)
        {
            return await _minesweeperService.GetLeaderboardAsync(sizeId, mode, view, page, pageSize);
        }

        [HttpGet]
        [Route("Leaderboard/Me")]
        public async Task<ActionResult<MinesweeperLeaderboardEntryDto?>> GetMyRank(string sizeId, string mode = "normal")
        {
            var rank = await _minesweeperService.GetMyRankAsync(sizeId, mode);
            if (rank == null)
            {
                // ActionResult<T> avec une valeur null passe par HttpNoContentOutputFormatter, qui la
                // transforme en 204 quel que soit le status code voulu (Ok(null) y compris — ce
                // formatter écrase le status code dans WriteResponseBodyAsync). ContentResult écrit le
                // corps littéral avec un 200 explicite et contourne la négociation de formatters pour
                // ce seul cas ; le cas non-null reste sur Ok(...), donc sur le même chemin de
                // sérialisation JSON (casse, convertisseurs JsonOptions) qu'avant ce fix.
                return Content("null", "application/json");
            }
            return Ok(rank);
        }

        [HttpGet]
        [Route("Challenges/Today")]
        public async Task<ActionResult<List<MinesweeperChallengeStatusDto>>> GetChallengesToday()
        {
            return await _minesweeperService.GetChallengesTodayAsync();
        }

        [HttpGet]
        [Route("Me")]
        public async Task<ActionResult<MinesweeperGameHistoryPageDto>> GetMyHistory(string? sizeId, string? mode, int page = 1, int pageSize = 50)
        {
            return await _minesweeperService.GetMyHistoryAsync(sizeId, mode, page, pageSize);
        }
    }
}
