using AutoMapper;
using Microsoft.EntityFrameworkCore;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.MapRoutes;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.MapRoutes.Request;
using MyHordesOptimizerApi.Exceptions;
using MyHordesOptimizerApi.Extensions;
using MyHordesOptimizerApi.Models;
using MyHordesOptimizerApi.Models.Expeditions;
using MyHordesOptimizerApi.Providers.Interfaces;
using MyHordesOptimizerApi.Services.Impl.Locking;
using MyHordesOptimizerApi.Services.Interfaces;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MyHordesOptimizerApi.Services.Impl.MapRoutes
{
    /// <summary>
    /// Règles (cf. claude/traces-expedition-conception.md, §3) :
    /// <list type="bullet">
    /// <item>lecture et écriture réservées aux citoyens de la ville, vivants ou morts (<see cref="ITownAccessService"/>) ;
    /// un observateur ne reçoit rien ;</item>
    /// <item>voir : tracé de toute la ville, ou privé dont on est l'auteur ou un citoyen autorisé ;</item>
    /// <item>modifier ou supprimer : le voir, en être l'auteur ou tracé modifiable par tous, ville non terminée,
    /// et aucune partie d'expédition liée d'un jour passé ;</item>
    /// <item>un tracé lié à une expédition reste visible de toute la ville.</item>
    /// </list>
    /// </summary>
    public class MapRouteService : IMapRouteService
    {
        protected MhoContext DbContext { get; init; }
        protected IUserInfoProvider UserInfoProvider { get; init; }
        protected ITownAccessService TownAccessService { get; init; }
        protected TownSyncLock TownSyncLock { get; init; }
        protected IMapper Mapper { get; init; }

        public MapRouteService(MhoContext dbContext,
            IUserInfoProvider userInfoProvider,
            ITownAccessService townAccessService,
            TownSyncLock townSyncLock,
            IMapper mapper)
        {
            DbContext = dbContext;
            UserInfoProvider = userInfoProvider;
            TownAccessService = townAccessService;
            TownSyncLock = townSyncLock;
            Mapper = mapper;
        }

        /// <param name="IdTown">IdTown résolu (positif, ou -mapId pour une ville provisoire).</param>
        private sealed record TownInfo(int IdTown, int? MapId, int Day, bool IsFinished, int Width, int Height, int X, int Y)
        {
            /// <summary>MapId tel que les clients l'envoient : clé du groupe temps réel et du verrou par ville.</summary>
            public int ClientMapId => IdTown < 0 ? -IdTown : MapId ?? IdTown;
        }

        public async Task<MapRoutesDto> GetMapRoutesAsync(int mapId)
        {
            var town = await LoadTownAsync(DbContext.ResolveTownId(mapId));
            if (town is null)
            {
                return new MapRoutesDto();
            }
            var result = new MapRoutesDto { Access = await BuildAccessAsync(town, mapId) };
            if (!result.Access.IsCitizen)
            {
                return result;
            }
            var userId = UserInfoProvider.UserId;
            var routes = await VisibleRoutesQuery(town.IdTown, userId).ToListAsync();
            var authorNames = await LoadUserNamesAsync(routes.Select(route => route.IdAuthor));
            result.Routes = routes.Select(route => ToDto(route, userId, town, authorNames)).ToList();
            var gameRoutes = await DbContext.MapRouteGames.AsNoTracking()
                .Where(gameRoute => gameRoute.IdTown == town.IdTown && gameRoute.Day == town.Day)
                .OrderBy(gameRoute => gameRoute.IdMapRouteGame)
                .ToListAsync();
            result.GameRoutes = gameRoutes.Select(ToGameDto).ToList();
            return result;
        }

        public async Task<MapRouteAccessDto> GetAccessAsync(int mapId)
        {
            var town = await LoadTownAsync(DbContext.ResolveTownId(mapId));
            return town is null ? new MapRouteAccessDto() : await BuildAccessAsync(town, mapId);
        }

        /// <summary>Citoyen (vivant ou mort, actuel ou passé), ville du jeton, création permise (ville non terminée).</summary>
        private async Task<MapRouteAccessDto> BuildAccessAsync(TownInfo town, int mapId)
        {
            var isCitizen = await TownAccessService.CanWriteTownAsync(town.IdTown, mapId);
            return new MapRouteAccessDto
            {
                IsCitizen = isCitizen,
                IsCurrentTown = UserInfoProvider.TownDetail?.TownId == mapId,
                CanCreate = isCitizen && !town.IsFinished
            };
        }

        public async Task<MapRouteDto?> GetMapRouteAsync(int mapId, int routeId)
        {
            var town = await LoadTownAsync(DbContext.ResolveTownId(mapId));
            if (town is null || !await TownAccessService.CanWriteTownAsync(town.IdTown, mapId))
            {
                return null;
            }
            var userId = UserInfoProvider.UserId;
            var route = await VisibleRoutesQuery(town.IdTown, userId).SingleOrDefaultAsync(mapRoute => mapRoute.IdMapRoute == routeId);
            if (route is null)
            {
                return null;
            }
            return ToDto(route, userId, town, await LoadUserNamesAsync(new[] { route.IdAuthor }));
        }

        public async Task<MapRouteDto> SaveMapRouteAsync(int mapId, MapRouteRequestDto request)
        {
            if (request is null)
            {
                throw new MhoTechnicalException("Tracé absent.");
            }
            // Verrou pris sur le mapId brut AVANT résolution (même convention que ExpeditionService).
            await using var townLock = await TownSyncLock.AcquireTownAsync(-mapId);
            var town = await LoadTownAsync(DbContext.ResolveTownId(mapId))
                ?? throw new MhoTechnicalException($"Ville {mapId} inconnue.");
            await TownAccessService.EnsureCanWriteTownAsync(town.IdTown, mapId);
            if (town.IsFinished)
            {
                throw new MhoForbiddenException($"La ville {mapId} est terminée : ses tracés ne sont plus modifiables.");
            }
            var label = MapRoutePath.NormalizeLabel(request.Label);
            MapRoutePath.Validate(request.Cells, request.Stops, town.Width, town.Height);
            if (request.Color is not null && !MapRoutePalette.IsValid(request.Color))
            {
                throw new MhoTechnicalException($"Couleur de tracé inconnue : {request.Color}.");
            }
            var userId = UserInfoProvider.UserId;

            MapRoute route;
            if (request.Id.HasValue)
            {
                route = await DbContext.MapRoutes
                    .Include(mapRoute => mapRoute.MapRouteShares)
                    .Include(mapRoute => mapRoute.ExpeditionParts)
                        .ThenInclude(part => part.IdExpeditionNavigation)
                    .AsSplitQuery()
                    .SingleOrDefaultAsync(mapRoute => mapRoute.IdMapRoute == request.Id.Value && mapRoute.IdTown == town.IdTown)
                    ?? throw new MhoForbiddenException($"Le tracé {request.Id} n'appartient pas à la ville {mapId}.");
                if (!CanEdit(route, userId, town))
                {
                    throw new MhoForbiddenException($"L'utilisateur {userId} ne peut pas modifier le tracé {route.IdMapRoute}.");
                }
                if (!request.Version.HasValue)
                {
                    throw new MhoTechnicalException("Version du tracé absente.");
                }
                if (request.Version.Value != route.Version)
                {
                    throw new MhoConflictException($"Le tracé {route.IdMapRoute} a été modifié entre-temps (version {route.Version}).");
                }
                if (request.IsPrivate && route.ExpeditionParts.Count > 0)
                {
                    throw new MhoTechnicalException("Un tracé lié à une expédition reste visible de toute la ville.");
                }
            }
            else
            {
                route = new MapRoute { IdTown = town.IdTown, IdAuthor = userId, Color = MapRoutePalette.PickRandom() };
            }
            var sharedUserIds = request.IsPrivate
                ? await ValidateSharedUsersAsync(request.SharedUserIds, town.IdTown, route.IdAuthor)
                : new List<int>();

            await using var transaction = await DbContext.Database.BeginTransactionAsync();
            LastUpdateInfoDto lastUpdateInfoDto = UserInfoProvider.GenerateLastUpdateInfo();
            var newLastUpdate = DbContext.LastUpdateInfos.Update(Mapper.Map<LastUpdateInfo>(lastUpdateInfoDto, opt => opt.SetDbContext(DbContext))).Entity;
            await DbContext.SaveChangesAsync();

            route.Label = label;
            route.Color = request.Color ?? route.Color;
            route.IsPrivate = request.IsPrivate;
            route.IsEditableByAll = request.IsEditableByAll;
            route.Cells = MapRouteJson.SerializePoints(request.Cells);
            route.Stops = MapRouteJson.SerializeStops(request.Stops);
            route.Length = request.Cells.Count - 1;
            route.IdLastUpdateInfo = newLastUpdate.IdLastUpdateInfo;
            if (request.Id.HasValue)
            {
                route.Version++;
                SyncShares(route, sharedUserIds);
                // La rose des vents d'une partie liée suit la première case de son tracé.
                var direction = MapRouteDirection.FirstCell(request.Cells, town.X, town.Y);
                if (direction.HasValue)
                {
                    foreach (var part in route.ExpeditionParts)
                    {
                        part.Direction = (int)direction.Value;
                    }
                }
            }
            else
            {
                route.MapRouteShares = sharedUserIds.Select(sharedUserId => new MapRouteShare { IdUser = sharedUserId }).ToList();
                DbContext.MapRoutes.Add(route);
            }
            try
            {
                await DbContext.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                // Autre instance de l'API (le verrou par ville n'est que local au processus).
                throw new MhoConflictException($"Le tracé {route.IdMapRoute} a été modifié entre-temps.");
            }
            await transaction.CommitAsync();

            var saved = await RouteWithDetailsQuery().SingleAsync(mapRoute => mapRoute.IdMapRoute == route.IdMapRoute);
            return ToDto(saved, userId, town, await LoadUserNamesAsync(new[] { saved.IdAuthor }));
        }

        public async Task<MapRouteDto> CopyGameRouteAsync(int mapId, int gameRouteId)
        {
            var idTown = DbContext.ResolveTownId(mapId);
            var gameRoute = await DbContext.MapRouteGames.AsNoTracking()
                .SingleOrDefaultAsync(mapRouteGame => mapRouteGame.IdMapRouteGame == gameRouteId && mapRouteGame.IdTown == idTown)
                ?? throw new MhoForbiddenException($"L'itinéraire {gameRouteId} n'est pas un itinéraire de la ville {mapId}.");
            return await SaveMapRouteAsync(mapId, MapRouteGames.ToRouteRequest(gameRoute));
        }

        public async Task<int> DeleteMapRouteAsync(int routeId)
        {
            var idTown = await DbContext.MapRoutes
                .Where(mapRoute => mapRoute.IdMapRoute == routeId)
                .Select(mapRoute => (int?)mapRoute.IdTown)
                .SingleOrDefaultAsync()
                ?? throw new MhoForbiddenException($"Tracé {routeId} inconnu.");
            var town = await LoadTownAsync(idTown)
                ?? throw new MhoForbiddenException($"Le tracé {routeId} n'est rattaché à aucune ville.");
            await using var townLock = await TownSyncLock.AcquireTownAsync(-town.ClientMapId);
            await TownAccessService.EnsureCanWriteTownAsync(town.IdTown, town.ClientMapId);
            var userId = UserInfoProvider.UserId;
            var route = await DbContext.MapRoutes
                .Include(mapRoute => mapRoute.MapRouteShares)
                .Include(mapRoute => mapRoute.ExpeditionParts)
                    .ThenInclude(part => part.IdExpeditionNavigation)
                .AsSplitQuery()
                .SingleOrDefaultAsync(mapRoute => mapRoute.IdMapRoute == routeId)
                ?? throw new MhoForbiddenException($"Tracé {routeId} inconnu.");
            if (!CanEdit(route, userId, town))
            {
                throw new MhoForbiddenException($"L'utilisateur {userId} ne peut pas supprimer le tracé {routeId}.");
            }
            // Autorisations supprimées avec le tracé ; parties liées déliées (SET NULL), consignes conservées.
            DbContext.MapRoutes.Remove(route);
            await DbContext.SaveChangesAsync();
            return town.ClientMapId;
        }

        private Task<TownInfo?> LoadTownAsync(int idTown)
        {
            return DbContext.Towns.AsNoTracking()
                .Where(town => town.IdTown == idTown)
                .Select(town => new TownInfo(town.IdTown, town.MapId, town.Day, town.IsFinished, town.Width, town.Height, town.X, town.Y))
                .SingleOrDefaultAsync();
        }

        /// <summary>Tracé avec ce qu'il faut pour le DTO : autorisations, parties liées et leur jour, dernière modification.</summary>
        private IQueryable<MapRoute> RouteWithDetailsQuery()
        {
            return DbContext.MapRoutes.AsNoTracking()
                .Include(mapRoute => mapRoute.MapRouteShares)
                .Include(mapRoute => mapRoute.ExpeditionParts)
                    .ThenInclude(part => part.IdExpeditionNavigation)
                .Include(mapRoute => mapRoute.IdLastUpdateInfoNavigation)
                    .ThenInclude(lastUpdateInfo => lastUpdateInfo!.IdUserNavigation)
                .AsSplitQuery();
        }

        private IQueryable<MapRoute> VisibleRoutesQuery(int idTown, int userId)
        {
            return RouteWithDetailsQuery()
                .Where(mapRoute => mapRoute.IdTown == idTown
                    && (!mapRoute.IsPrivate
                        || mapRoute.IdAuthor == userId
                        || mapRoute.MapRouteShares.Any(share => share.IdUser == userId)))
                .OrderBy(mapRoute => mapRoute.IdMapRoute);
        }

        private static bool CanEdit(MapRoute route, int userId, TownInfo town)
        {
            return MapRouteRights.IsVisible(route, userId)
                && MapRouteRights.IsAuthorOrEditableByAll(route, userId)
                && !town.IsFinished
                && !route.ExpeditionParts.Any(part => ExpeditionDayLock.IsLocked(part.IdExpeditionNavigation?.Day, town.Day));
        }

        /// <summary>
        /// Citoyens autorisés : distincts, sans l'auteur (qui voit toujours son tracé), et tous citoyens de la
        /// ville, vivants ou morts (<see cref="TownMembersExtensions.CountTownMembersAsync"/>).
        /// </summary>
        private async Task<List<int>> ValidateSharedUsersAsync(List<int>? requestedUserIds, int idTown, int authorId)
        {
            var userIds = (requestedUserIds ?? new List<int>()).Where(id => id != authorId).Distinct().ToList();
            if (userIds.Count == 0)
            {
                return userIds;
            }
            if (await DbContext.CountTownMembersAsync(idTown, userIds) != userIds.Count)
            {
                throw new MhoTechnicalException("Un des citoyens autorisés à voir le tracé n'est pas de la ville.");
            }
            return userIds;
        }

        /// <summary>Retire les autorisations disparues, ajoute les nouvelles (jamais retirer puis rajouter la même clé).</summary>
        private void SyncShares(MapRoute route, List<int> sharedUserIds)
        {
            var wanted = sharedUserIds.ToHashSet();
            foreach (var share in route.MapRouteShares.Where(share => !wanted.Contains(share.IdUser)).ToList())
            {
                route.MapRouteShares.Remove(share);
                DbContext.MapRouteShares.Remove(share);
            }
            var existing = route.MapRouteShares.Select(share => share.IdUser).ToHashSet();
            foreach (var sharedUserId in wanted.Where(id => !existing.Contains(id)))
            {
                route.MapRouteShares.Add(new MapRouteShare { IdMapRoute = route.IdMapRoute, IdUser = sharedUserId });
            }
        }

        private async Task<Dictionary<int, string>> LoadUserNamesAsync(IEnumerable<int> userIds)
        {
            var ids = userIds.Distinct().ToList();
            if (ids.Count == 0)
            {
                return new Dictionary<int, string>();
            }
            return await DbContext.Users.AsNoTracking()
                .Where(user => ids.Contains(user.IdUser))
                .ToDictionaryAsync(user => user.IdUser, user => user.Name);
        }

        private MapRouteDto ToDto(MapRoute route, int userId, TownInfo town, IReadOnlyDictionary<int, string> authorNames)
        {
            return new MapRouteDto
            {
                Id = route.IdMapRoute,
                Label = route.Label,
                Color = route.Color,
                AuthorId = route.IdAuthor,
                AuthorName = authorNames.TryGetValue(route.IdAuthor, out var authorName) ? authorName : null,
                IsPrivate = route.IsPrivate,
                IsEditableByAll = route.IsEditableByAll,
                SharedUserIds = route.MapRouteShares.Select(share => share.IdUser).OrderBy(id => id).ToList(),
                Cells = MapRouteJson.ParsePoints(route.Cells),
                Stops = MapRouteJson.ParseStops(route.Stops),
                Length = route.Length,
                Version = route.Version,
                CanEdit = CanEdit(route, userId, town),
                LinkedParts = route.ExpeditionParts
                    .OrderBy(part => part.IdExpeditionNavigation?.Day)
                    .ThenBy(part => part.Position)
                    .Select(part => new MapRouteLinkedPartDto
                    {
                        ExpeditionId = part.IdExpedition ?? 0,
                        PartId = part.IdExpeditionPart,
                        Day = part.IdExpeditionNavigation?.Day,
                        ExpeditionLabel = part.IdExpeditionNavigation?.Label,
                        PartPosition = part.Position
                    })
                    .ToList(),
                LastUpdateInfo = route.IdLastUpdateInfoNavigation is null ? null : Mapper.Map<LastUpdateInfoDto>(route.IdLastUpdateInfoNavigation)
            };
        }

        private static MapRouteGameDto ToGameDto(MapRouteGame gameRoute)
        {
            return new MapRouteGameDto
            {
                Id = gameRoute.IdMapRouteGame,
                AuthorId = gameRoute.IdAuthor,
                Label = gameRoute.Label,
                Length = gameRoute.Length,
                Stops = MapRouteJson.ParsePoints(gameRoute.Stops)
            };
        }
    }
}
