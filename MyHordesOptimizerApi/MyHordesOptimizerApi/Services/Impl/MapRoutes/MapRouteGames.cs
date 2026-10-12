using MyHordesOptimizerApi.Dtos.MyHordes;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.MapRoutes;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.MapRoutes.Request;
using MyHordesOptimizerApi.Models;
using System;
using System.Collections.Generic;
using System.Linq;

namespace MyHordesOptimizerApi.Services.Impl.MapRoutes
{
    /// <summary>Itinéraires créés dans MyHordes : import à la mise à jour MHO, et copie en tracé MHO.</summary>
    public static class MapRouteGames
    {
        /// <summary>Taille de la colonne <c>MapRouteGame.label</c> (MyHordes limite le nom à 32 caractères).</summary>
        public const int MaxLabelLength = 32;

        /// <summary>
        /// Itinéraires à enregistrer pour une ville : ceux qui ont un nom et au moins deux points d'arrêt, tous dans
        /// la carte. MyHordes renvoie les points en deux tableaux parallèles (<c>X[i]</c>, <c>Y[i]</c>), déjà en
        /// coordonnées absolues. L'auteur n'est gardé que s'il est connu de MHO.
        /// </summary>
        public static List<MapRouteGame> FromMyHordes(IEnumerable<MyHordesExpeditionDto?> expeditions, int idTown, int day, int mapWidth, int mapHeight,
            IReadOnlySet<int> knownUserIds, int? idLastUpdateInfo)
        {
            var gameRoutes = new List<MapRouteGame>();
            foreach (var expedition in expeditions)
            {
                var label = expedition?.Name?.Trim();
                var xs = expedition?.Points?.X;
                var ys = expedition?.Points?.Y;
                if (string.IsNullOrEmpty(label) || xs is null || ys is null || xs.Count != ys.Count || xs.Count < 2)
                {
                    continue;
                }
                var stops = xs.Zip(ys, (x, y) => new MapRoutePointDto { X = x, Y = y }).ToList();
                if (stops.Any(stop => stop.X < 0 || stop.X >= mapWidth || stop.Y < 0 || stop.Y >= mapHeight))
                {
                    continue;
                }
                var authorId = expedition!.Author?.Id;
                gameRoutes.Add(new MapRouteGame
                {
                    IdTown = idTown,
                    IdAuthor = authorId.HasValue && knownUserIds.Contains(authorId.Value) ? authorId : null,
                    Label = label.Length > MaxLabelLength ? label[..MaxLabelLength] : label,
                    Length = expedition.Length ?? Distance(stops),
                    Stops = MapRouteJson.SerializePoints(stops),
                    Day = day,
                    IdLastUpdateInfo = idLastUpdateInfo
                });
            }
            return gameRoutes;
        }

        /// <summary>
        /// Cases d'un itinéraire : d'un point d'arrêt au suivant en ligne droite (l'horizontale d'abord s'ils ne sont
        /// pas alignés), comme le site les dessine (<c>expandStops</c>).
        /// </summary>
        public static List<MapRoutePointDto> ExpandStops(IReadOnlyList<MapRoutePointDto> stops)
        {
            var cells = new List<MapRoutePointDto>();
            if (stops.Count == 0)
            {
                return cells;
            }
            int x = stops[0].X, y = stops[0].Y;
            cells.Add(new MapRoutePointDto { X = x, Y = y });
            foreach (var target in stops.Skip(1))
            {
                while (x != target.X)
                {
                    x += Math.Sign(target.X - x);
                    cells.Add(new MapRoutePointDto { X = x, Y = y });
                }
                while (y != target.Y)
                {
                    y += Math.Sign(target.Y - y);
                    cells.Add(new MapRoutePointDto { X = x, Y = y });
                }
            }
            return cells;
        }

        /// <summary>
        /// Création d'un tracé MHO qui reprend un itinéraire du jeu : mêmes cases, chaque point d'arrêt devient une
        /// destination en ligne droite (mode « en L »), visible de toute la ville et modifiable par tous ceux qui le
        /// voient (comme un nouveau tracé saisi sur la carte).
        /// </summary>
        public static MapRouteRequestDto ToRouteRequest(MapRouteGame gameRoute)
        {
            var stops = MapRouteJson.ParsePoints(gameRoute.Stops);
            var destinations = new List<MapRouteStopDto>();
            for (var index = 1; index < stops.Count; index++)
            {
                var previous = stops[index - 1];
                var stop = stops[index];
                if (stop.X != previous.X || stop.Y != previous.Y)
                {
                    destinations.Add(new MapRouteStopDto { X = stop.X, Y = stop.Y, Mode = MapRouteStopModes.L });
                }
            }
            return new MapRouteRequestDto
            {
                Label = gameRoute.Label,
                IsPrivate = false,
                IsEditableByAll = true,
                SharedUserIds = new List<int>(),
                Cells = ExpandStops(stops),
                Stops = destinations
            };
        }

        private static int Distance(IReadOnlyList<MapRoutePointDto> stops)
        {
            var distance = 0;
            for (var index = 1; index < stops.Count; index++)
            {
                distance += Math.Abs(stops[index].X - stops[index - 1].X) + Math.Abs(stops[index].Y - stops[index - 1].Y);
            }
            return distance;
        }
    }
}
