using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.MapRoutes;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;

namespace MyHordesOptimizerApi.Services.Impl.MapRoutes
{
    /// <summary>
    /// Sérialisation des colonnes JSON des tracés : cases et points d'arrêt en [[x,y],…] (compact),
    /// destinations en [{"x":…,"y":…,"mode":…}]. Une valeur illisible donne une liste vide plutôt qu'une
    /// erreur à la lecture.
    /// </summary>
    public static class MapRouteJson
    {
        private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

        public static string SerializePoints(IEnumerable<MapRoutePointDto> points)
        {
            return JsonSerializer.Serialize(points.Select(point => new[] { point.X, point.Y }));
        }

        public static List<MapRoutePointDto> ParsePoints(string? json)
        {
            if (string.IsNullOrWhiteSpace(json))
            {
                return new List<MapRoutePointDto>();
            }
            try
            {
                var pairs = JsonSerializer.Deserialize<int[][]>(json) ?? System.Array.Empty<int[]>();
                return pairs
                    .Where(pair => pair is { Length: 2 })
                    .Select(pair => new MapRoutePointDto { X = pair[0], Y = pair[1] })
                    .ToList();
            }
            catch (JsonException)
            {
                return new List<MapRoutePointDto>();
            }
        }

        public static string SerializeStops(IEnumerable<MapRouteStopDto> stops)
        {
            return JsonSerializer.Serialize(stops.Select(stop => new MapRouteStopDto { X = stop.X, Y = stop.Y, Mode = stop.Mode }), JsonOptions);
        }

        public static List<MapRouteStopDto> ParseStops(string? json)
        {
            if (string.IsNullOrWhiteSpace(json))
            {
                return new List<MapRouteStopDto>();
            }
            try
            {
                return JsonSerializer.Deserialize<List<MapRouteStopDto>>(json, JsonOptions) ?? new List<MapRouteStopDto>();
            }
            catch (JsonException)
            {
                return new List<MapRouteStopDto>();
            }
        }
    }
}
