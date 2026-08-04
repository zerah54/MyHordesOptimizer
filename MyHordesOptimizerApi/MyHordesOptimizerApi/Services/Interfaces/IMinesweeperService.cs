using System.Collections.Generic;
using System.Threading.Tasks;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Minesweeper;

namespace MyHordesOptimizerApi.Services.Interfaces;

public interface IMinesweeperService
{
    Task<MinesweeperGameStartedDto> CreateGameAsync(CreateMinesweeperGameRequestDto request);
    Task<StartMinesweeperGameResponseDto> StartGameAsync(int gameId);
    Task<CompleteMinesweeperGameResponseDto> CompleteGameAsync(int gameId, CompleteMinesweeperGameRequestDto request);
    Task<MinesweeperLeaderboardPageDto> GetLeaderboardAsync(string sizeId, string mode, string view, int page, int pageSize);
    Task<MinesweeperLeaderboardEntryDto?> GetMyRankAsync(string sizeId, string mode);
    Task<List<MinesweeperChallengeStatusDto>> GetChallengesTodayAsync();
    Task<MinesweeperGameHistoryPageDto> GetMyHistoryAsync(string? sizeId, string? mode, int page, int pageSize);
}
