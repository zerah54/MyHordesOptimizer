using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.MapRoutes;
using MyHordesOptimizerApi.Exceptions;
using System;
using System.Collections.Generic;
using System.Linq;

namespace MyHordesOptimizerApi.Services.Impl.MapRoutes
{
    /// <summary>Règles de forme d'un tracé, vérifiées côté serveur à chaque enregistrement.</summary>
    public static class MapRoutePath
    {
        public const int MaxLabelLength = 64;

        /// <summary>Libellé débarrassé de ses espaces de bord ; lève s'il est vide ou trop long.</summary>
        public static string NormalizeLabel(string? label)
        {
            var trimmed = label?.Trim();
            if (string.IsNullOrEmpty(trimmed))
            {
                throw new MhoTechnicalException("Le nom du tracé est obligatoire.");
            }
            if (trimmed.Length > MaxLabelLength)
            {
                throw new MhoTechnicalException($"Le nom du tracé ne peut pas dépasser {MaxLabelLength} caractères.");
            }
            return trimmed;
        }

        /// <summary>
        /// Lève si le chemin est invalide : au moins deux cases, toutes dans la carte (coordonnées absolues,
        /// 0 ≤ x &lt; largeur, 0 ≤ y &lt; hauteur), deux cases consécutives adjacentes horizontalement ou
        /// verticalement (1 PA), et chaque destination sur le chemin avec un mode connu.
        /// </summary>
        public static void Validate(IReadOnlyList<MapRoutePointDto>? cells, IReadOnlyList<MapRouteStopDto>? stops, int mapWidth, int mapHeight)
        {
            if (mapWidth <= 0 || mapHeight <= 0)
            {
                throw new MhoTechnicalException("Dimensions de la carte inconnues : synchronisez la ville avant de tracer.");
            }
            if (cells is null || cells.Count < 2)
            {
                throw new MhoTechnicalException("Un tracé compte au moins deux cases.");
            }
            for (var index = 0; index < cells.Count; index++)
            {
                var cell = cells[index] ?? throw new MhoTechnicalException($"Case {index} absente.");
                if (cell.X < 0 || cell.X >= mapWidth || cell.Y < 0 || cell.Y >= mapHeight)
                {
                    throw new MhoTechnicalException($"La case [{cell.X};{cell.Y}] est hors de la carte.");
                }
                if (index > 0)
                {
                    var previous = cells[index - 1];
                    if (Math.Abs(cell.X - previous.X) + Math.Abs(cell.Y - previous.Y) != 1)
                    {
                        throw new MhoTechnicalException($"Les cases [{previous.X};{previous.Y}] et [{cell.X};{cell.Y}] ne sont pas adjacentes.");
                    }
                }
            }
            if (stops is null)
            {
                throw new MhoTechnicalException("Les destinations du tracé sont absentes.");
            }
            var cellSet = new HashSet<(int X, int Y)>(cells.Select(cell => (cell.X, cell.Y)));
            foreach (var stop in stops)
            {
                if (stop is null || (stop.Mode != MapRouteStopModes.Best && stop.Mode != MapRouteStopModes.L))
                {
                    throw new MhoTechnicalException("Mode de calcul de destination inconnu.");
                }
                if (!cellSet.Contains((stop.X, stop.Y)))
                {
                    throw new MhoTechnicalException($"La destination [{stop.X};{stop.Y}] n'est pas sur le chemin.");
                }
            }
        }
    }
}
