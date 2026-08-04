using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Minesweeper;
using MyHordesOptimizerApi.Exceptions;
using MyHordesOptimizerApi.Models;
using MyHordesOptimizerApi.Providers.Interfaces;
using MyHordesOptimizerApi.Services.Interfaces;

namespace MyHordesOptimizerApi.Services.Impl;

public class MinesweeperService : IMinesweeperService
{
    // Dimensions canoniques des tailles prédéfinies : le serveur ne fait jamais confiance au client
    // pour Facile→Impossible (seul "custom" fournit ses propres dimensions, bornées ci-dessous).
    internal static readonly Dictionary<string, (int Width, int Height, int Mines)> PresetSizes = new()
    {
        ["small"] = (9, 9, 10),
        ["medium"] = (16, 16, 40),
        ["large"] = (30, 16, 99), // Difficile côté front : width:30, height:16 (le seul preset non carré)
        ["expert"] = (50, 50, 500),
        ["impossible"] = (100, 100, 2000),
    };

    private const int CustomMaxWidth = 100;
    private const int CustomMaxHeight = 100;
    private const int CustomMaxCells = 10000;
    private const int CustomMinMines = 1;

    protected ILogger<MinesweeperService> Logger { get; }
    protected IUserInfoProvider UserInfoProvider { get; }
    protected IMinesweeperBoardGenerator BoardGenerator { get; }
    protected MhoContext DbContext { get; }

    public MinesweeperService(ILogger<MinesweeperService> logger,
        IUserInfoProvider userInfoProvider,
        IMinesweeperBoardGenerator boardGenerator,
        MhoContext context)
    {
        Logger = logger;
        UserInfoProvider = userInfoProvider;
        BoardGenerator = boardGenerator;
        DbContext = context;
    }

    public async Task<MinesweeperGameStartedDto> CreateGameAsync(CreateMinesweeperGameRequestDto request)
    {
        (int width, int height, int mineCount) = ResolveDimensions(request);
        int? userId = UserInfoProvider.UserId > 0 ? UserInfoProvider.UserId : null;

        if (request.Mode == "daily")
        {
            return await CreateOrResumeDailyGameAsync(request.SizeId, width, height, mineCount, userId);
        }

        if (request.Mode != "normal")
        {
            throw new MyHordesApiException($"Mode inconnu : {request.Mode}", HttpStatusCode.BadRequest);
        }

        if (!request.FirstClickX.HasValue || !request.FirstClickY.HasValue)
        {
            throw new MyHordesApiException("firstClickX/firstClickY sont requis en mode normal", HttpStatusCode.BadRequest);
        }

        uint seed = (uint)Random.Shared.NextInt64(0, (long)uint.MaxValue + 1L);

        var game = new MinesweeperGame
        {
            IdUser = userId,
            SizeId = request.SizeId,
            Width = width,
            Height = height,
            MineCount = mineCount,
            Mode = "normal",
            ChallengeDate = null,
            Seed = seed,
            FirstClickX = request.FirstClickX.Value,
            FirstClickY = request.FirstClickY.Value,
            CreatedAt = DateTime.UtcNow,
            StartedAt = DateTime.UtcNow,
            Status = "in_progress"
        };

        DbContext.MinesweeperGames.Add(game);
        await DbContext.SaveChangesAsync();

        var board = BoardGenerator.Generate(width, height, mineCount, request.FirstClickX.Value, request.FirstClickY.Value, seed);
        return ToStartedDto(game, board, timerStarted: true);
    }

    public async Task<StartMinesweeperGameResponseDto> StartGameAsync(int gameId)
    {
        MinesweeperGame game = await GetOwnedGameOrThrowAsync(gameId);

        if (!game.StartedAt.HasValue)
        {
            game.StartedAt = DateTime.UtcNow;
            await DbContext.SaveChangesAsync();
        }

        return new StartMinesweeperGameResponseDto { StartedAt = game.StartedAt.Value };
    }

    public async Task<CompleteMinesweeperGameResponseDto> CompleteGameAsync(int gameId, CompleteMinesweeperGameRequestDto request)
    {
        if (request.Outcome != "won" && request.Outcome != "lost")
        {
            throw new MyHordesApiException($"Issue inconnue : {request.Outcome}", HttpStatusCode.BadRequest);
        }

        MinesweeperGame game = await GetOwnedGameOrThrowAsync(gameId);

        if (game.Status != "in_progress")
        {
            throw new MyHordesApiException("Cette partie est déjà terminée", HttpStatusCode.Conflict);
        }

        game.EndedAt = DateTime.UtcNow;
        game.Status = request.Outcome;

        int? elapsedMs = null;
        if (request.Outcome == "won" && game.StartedAt.HasValue)
        {
            elapsedMs = (int)(game.EndedAt.Value - game.StartedAt.Value).TotalMilliseconds;
            game.ElapsedMs = elapsedMs;
        }

        await DbContext.SaveChangesAsync();

        bool scored = request.Outcome == "won" && game.IdUser.HasValue && game.SizeId != "custom" && elapsedMs.HasValue;

        return new CompleteMinesweeperGameResponseDto
        {
            Outcome = request.Outcome,
            ElapsedMs = elapsedMs,
            Scored = scored
        };
    }

    public async Task<MinesweeperLeaderboardPageDto> GetLeaderboardAsync(string sizeId, string mode, string view, int page, int pageSize)
    {
        if (!PresetSizes.ContainsKey(sizeId))
        {
            throw new MyHordesApiException($"Taille inconnue ou non classée : {sizeId}", HttpStatusCode.BadRequest);
        }
        if (mode != "normal" && mode != "daily")
        {
            throw new MyHordesApiException($"Mode inconnu : {mode}", HttpStatusCode.BadRequest);
        }

        if (mode == "daily")
        {
            return await GetDailyLeaderboardAsync(sizeId, page, pageSize);
        }

        return view == "players"
            ? await GetPlayersLeaderboardAsync(sizeId, page, pageSize)
            : await GetTopLeaderboardAsync(sizeId, page, pageSize);
    }

    private async Task<MinesweeperLeaderboardPageDto> GetTopLeaderboardAsync(string sizeId, int page, int pageSize)
    {
        IQueryable<MinesweeperGame> baseQuery = DbContext.MinesweeperGames
            .Where(g => g.SizeId == sizeId && g.Mode == "normal" && g.Status == "won" && g.IdUser != null);

        int totalCount = await baseQuery.CountAsync();

        List<MinesweeperLeaderboardEntryDto> items = await baseQuery
            .Include(g => g.IdUserNavigation)
            .OrderBy(g => g.ElapsedMs)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(g => new MinesweeperLeaderboardEntryDto
            {
                UserId = g.IdUser!.Value,
                UserName = g.IdUserNavigation!.Name,
                Avatar = g.IdUserNavigation.Avatar,
                ElapsedMs = g.ElapsedMs!.Value,
                AchievedAt = g.EndedAt!.Value
            })
            .ToListAsync();

        AssignRanks(items, page, pageSize);

        return new MinesweeperLeaderboardPageDto { Items = items, TotalCount = totalCount };
    }

    private async Task<MinesweeperLeaderboardPageDto> GetPlayersLeaderboardAsync(string sizeId, int page, int pageSize)
    {
        IQueryable<MinesweeperGame> baseQuery = DbContext.MinesweeperGames
            .Where(g => g.SizeId == sizeId && g.Mode == "normal" && g.Status == "won" && g.IdUser != null);

        int totalCount = await baseQuery.Select(g => g.IdUser).Distinct().CountAsync();

        var bestTimesPage = await baseQuery
            .GroupBy(g => g.IdUser)
            .Select(grp => new { UserId = grp.Key!.Value, ElapsedMs = grp.Min(g => g.ElapsedMs)!.Value })
            .OrderBy(x => x.ElapsedMs)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var items = new List<MinesweeperLeaderboardEntryDto>();
        foreach (var entry in bestTimesPage)
        {
            MinesweeperGame game = await DbContext.MinesweeperGames
                .Include(g => g.IdUserNavigation)
                .Where(g => g.IdUser == entry.UserId && g.SizeId == sizeId && g.Mode == "normal"
                    && g.Status == "won" && g.ElapsedMs == entry.ElapsedMs)
                .OrderBy(g => g.EndedAt)
                .FirstAsync();

            items.Add(new MinesweeperLeaderboardEntryDto
            {
                UserId = entry.UserId,
                UserName = game.IdUserNavigation!.Name,
                Avatar = game.IdUserNavigation.Avatar,
                ElapsedMs = entry.ElapsedMs,
                AchievedAt = game.EndedAt!.Value
            });
        }

        AssignRanks(items, page, pageSize);

        return new MinesweeperLeaderboardPageDto { Items = items, TotalCount = totalCount };
    }

    private async Task<MinesweeperLeaderboardPageDto> GetDailyLeaderboardAsync(string sizeId, int page, int pageSize)
    {
        DateOnly today = DateOnly.FromDateTime(DateTime.UtcNow);

        IQueryable<MinesweeperGame> baseQuery = DbContext.MinesweeperGames
            .Where(g => g.SizeId == sizeId && g.Mode == "daily" && g.ChallengeDate == today && g.Status == "won" && g.IdUser != null);

        int totalCount = await baseQuery.CountAsync();

        List<MinesweeperLeaderboardEntryDto> items = await baseQuery
            .Include(g => g.IdUserNavigation)
            .OrderBy(g => g.ElapsedMs)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(g => new MinesweeperLeaderboardEntryDto
            {
                UserId = g.IdUser!.Value,
                UserName = g.IdUserNavigation!.Name,
                Avatar = g.IdUserNavigation.Avatar,
                ElapsedMs = g.ElapsedMs!.Value,
                AchievedAt = g.EndedAt!.Value
            })
            .ToListAsync();

        AssignRanks(items, page, pageSize);

        return new MinesweeperLeaderboardPageDto { Items = items, TotalCount = totalCount };
    }

    private static void AssignRanks(List<MinesweeperLeaderboardEntryDto> items, int page, int pageSize)
    {
        int rank = (page - 1) * pageSize + 1;
        foreach (MinesweeperLeaderboardEntryDto item in items)
        {
            item.Rank = rank++;
        }
    }

    public async Task<MinesweeperLeaderboardEntryDto?> GetMyRankAsync(string sizeId, string mode)
    {
        if (!PresetSizes.ContainsKey(sizeId))
        {
            throw new MyHordesApiException($"Taille inconnue ou non classée : {sizeId}", HttpStatusCode.BadRequest);
        }
        if (mode != "normal" && mode != "daily")
        {
            throw new MyHordesApiException($"Mode inconnu : {mode}", HttpStatusCode.BadRequest);
        }

        int? userId = UserInfoProvider.UserId > 0 ? UserInfoProvider.UserId : null;
        if (!userId.HasValue)
        {
            return null;
        }

        IQueryable<MinesweeperGame> baseQuery = DbContext.MinesweeperGames
            .Where(g => g.SizeId == sizeId && g.Mode == mode && g.Status == "won" && g.IdUser != null);

        if (mode == "daily")
        {
            DateOnly today = DateOnly.FromDateTime(DateTime.UtcNow);
            baseQuery = baseQuery.Where(g => g.ChallengeDate == today);
        }

        // Projection directe via .Select(), comme GetTopLeaderboardAsync/GetPlayersLeaderboardAsync
        // plus bas : EF Core traduit l'accès à IdUserNavigation.Name/.Avatar en jointure SQL dans la
        // MÊME requête. La version précédente matérialisait l'entité complète via .Include() puis lisait
        // la navigation ensuite : constaté en pratique (réponse JSON) que Name/Avatar arrivaient vides
        // alors que ce même accès fonctionne correctement ci-dessous — on aligne sur le patron qui marche.
        MinesweeperLeaderboardEntryDto? myBest = await baseQuery
            .Where(g => g.IdUser == userId)
            .OrderBy(g => g.ElapsedMs)
            .ThenBy(g => g.EndedAt)
            .Select(g => new MinesweeperLeaderboardEntryDto
            {
                UserId = g.IdUser!.Value,
                UserName = g.IdUserNavigation!.Name,
                Avatar = g.IdUserNavigation.Avatar,
                ElapsedMs = g.ElapsedMs!.Value,
                AchievedAt = g.EndedAt!.Value
            })
            .FirstOrDefaultAsync();

        if (myBest == null)
        {
            return null;
        }

        int better = await baseQuery
            .GroupBy(g => g.IdUser)
            .Select(grp => grp.Min(g => g.ElapsedMs))
            .CountAsync(best => best < myBest.ElapsedMs);

        myBest.Rank = better + 1;
        return myBest;
    }

    public async Task<List<MinesweeperChallengeStatusDto>> GetChallengesTodayAsync()
    {
        int? userId = UserInfoProvider.UserId > 0 ? UserInfoProvider.UserId : null;
        DateOnly today = DateOnly.FromDateTime(DateTime.UtcNow);

        var result = new List<MinesweeperChallengeStatusDto>();
        foreach (string sizeId in PresetSizes.Keys)
        {
            bool alreadyPlayed = false;
            if (userId.HasValue)
            {
                alreadyPlayed = await DbContext.MinesweeperGames.AnyAsync(g =>
                    g.IdUser == userId && g.Mode == "daily" && g.SizeId == sizeId &&
                    g.ChallengeDate == today && g.Status != "in_progress");
            }

            result.Add(new MinesweeperChallengeStatusDto { SizeId = sizeId, AlreadyPlayedToday = alreadyPlayed });
        }

        return result;
    }

    public async Task<MinesweeperGameHistoryPageDto> GetMyHistoryAsync(string? sizeId, string? mode, int page, int pageSize)
    {
        int? userId = UserInfoProvider.UserId > 0 ? UserInfoProvider.UserId : null;
        if (!userId.HasValue)
        {
            return new MinesweeperGameHistoryPageDto();
        }

        IQueryable<MinesweeperGame> query = DbContext.MinesweeperGames.Where(g => g.IdUser == userId);
        if (!string.IsNullOrEmpty(sizeId)) query = query.Where(g => g.SizeId == sizeId);
        if (!string.IsNullOrEmpty(mode)) query = query.Where(g => g.Mode == mode);

        int totalCount = await query.CountAsync();

        List<MinesweeperGameHistoryEntryDto> items = await query
            .OrderByDescending(g => g.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(g => new MinesweeperGameHistoryEntryDto
            {
                GameId = g.IdMinesweeperGame,
                SizeId = g.SizeId,
                Width = g.Width,
                Height = g.Height,
                MineCount = g.MineCount,
                Mode = g.Mode,
                Status = g.Status,
                ElapsedMs = g.ElapsedMs,
                CreatedAt = g.CreatedAt
            })
            .ToListAsync();

        return new MinesweeperGameHistoryPageDto { Items = items, TotalCount = totalCount };
    }

    private async Task<MinesweeperGameStartedDto> CreateOrResumeDailyGameAsync(string sizeId, int width, int height, int mineCount, int? userId)
    {
        if (sizeId == "custom")
        {
            throw new MyHordesApiException("Le défi du jour n'est pas disponible en taille personnalisée", HttpStatusCode.BadRequest);
        }

        DateOnly today = DateOnly.FromDateTime(DateTime.UtcNow);

        if (userId.HasValue)
        {
            MinesweeperGame? existing = await DbContext.MinesweeperGames
                .FirstOrDefaultAsync(g => g.IdUser == userId && g.Mode == "daily" && g.SizeId == sizeId && g.ChallengeDate == today);

            if (existing != null)
            {
                if (existing.Status != "in_progress")
                {
                    throw new MyHordesApiException("Défi du jour déjà tenté aujourd'hui pour cette taille", HttpStatusCode.Conflict);
                }

                var resumedBoard = BoardGenerator.Generate(existing.Width, existing.Height, existing.MineCount, existing.FirstClickX, existing.FirstClickY, (uint)existing.Seed);
                return ToStartedDto(existing, resumedBoard, timerStarted: existing.StartedAt.HasValue);
            }
        }

        int centerX = width / 2;
        int centerY = height / 2;
        long dailySeed = ComputeDailySeed(today, sizeId);

        var game = new MinesweeperGame
        {
            IdUser = userId,
            SizeId = sizeId,
            Width = width,
            Height = height,
            MineCount = mineCount,
            Mode = "daily",
            ChallengeDate = today,
            Seed = dailySeed,
            FirstClickX = centerX,
            FirstClickY = centerY,
            CreatedAt = DateTime.UtcNow,
            StartedAt = null,
            Status = "in_progress"
        };

        DbContext.MinesweeperGames.Add(game);
        await DbContext.SaveChangesAsync();

        var board = BoardGenerator.Generate(width, height, mineCount, centerX, centerY, (uint)dailySeed);
        return ToStartedDto(game, board, timerStarted: false);
    }

    private async Task<MinesweeperGame> GetOwnedGameOrThrowAsync(int gameId)
    {
        MinesweeperGame? game = await DbContext.MinesweeperGames.FirstOrDefaultAsync(g => g.IdMinesweeperGame == gameId);
        if (game == null)
        {
            throw new MyHordesApiException("Partie introuvable", HttpStatusCode.NotFound);
        }

        int? currentUserId = UserInfoProvider.UserId > 0 ? UserInfoProvider.UserId : null;
        if (game.IdUser.HasValue && game.IdUser != currentUserId)
        {
            throw new MyHordesApiException("Cette partie appartient à un autre joueur", HttpStatusCode.Forbidden);
        }

        return game;
    }

    private static MinesweeperGameStartedDto ToStartedDto(MinesweeperGame game, GeneratedMinesweeperBoard board, bool timerStarted)
    {
        return new MinesweeperGameStartedDto
        {
            GameId = game.IdMinesweeperGame,
            Width = board.Width,
            Height = board.Height,
            MineCount = game.MineCount,
            Mines = board.Mines.Select(b => (int)b).ToArray(),
            AdjacentCounts = board.AdjacentCounts.Select(b => (int)b).ToArray(),
            TimerStarted = timerStarted,
            FirstClickX = game.FirstClickX,
            FirstClickY = game.FirstClickY,
            StartedAt = game.StartedAt
        };
    }

    private static (int Width, int Height, int MineCount) ResolveDimensions(CreateMinesweeperGameRequestDto request)
    {
        if (request.SizeId != "custom")
        {
            if (!PresetSizes.TryGetValue(request.SizeId, out var preset))
            {
                throw new MyHordesApiException($"Taille inconnue : {request.SizeId}", HttpStatusCode.BadRequest);
            }
            return preset;
        }

        int width = request.Width ?? throw new MyHordesApiException("width requis pour la taille personnalisée", HttpStatusCode.BadRequest);
        int height = request.Height ?? throw new MyHordesApiException("height requis pour la taille personnalisée", HttpStatusCode.BadRequest);
        int mineCount = request.MineCount ?? throw new MyHordesApiException("mineCount requis pour la taille personnalisée", HttpStatusCode.BadRequest);

        if (width < 1 || width > CustomMaxWidth || height < 1 || height > CustomMaxHeight || width * height > CustomMaxCells)
        {
            throw new MyHordesApiException($"Dimensions personnalisées invalides (max {CustomMaxWidth}x{CustomMaxHeight}, {CustomMaxCells} cases)", HttpStatusCode.BadRequest);
        }
        if (mineCount < CustomMinMines || mineCount > width * height - 9)
        {
            throw new MyHordesApiException("Nombre de mines personnalisé invalide (doit laisser au moins la zone 3x3 de départ sûre)", HttpStatusCode.BadRequest);
        }

        return (width, height, mineCount);
    }

    private static long ComputeDailySeed(DateOnly date, string sizeId)
    {
        unchecked
        {
            uint h = 2166136261;
            foreach (char c in $"{date:yyyy-MM-dd}:{sizeId}")
            {
                h ^= c;
                h *= 16777619;
            }
            return h;
        }
    }
}
