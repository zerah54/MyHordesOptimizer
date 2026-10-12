using System;
using System.Collections.Generic;
using System.Linq;

namespace MyHordesOptimizerApi.Services.Impl.MapRoutes
{
    /// <summary>
    /// Couleurs communes des tracés : des clés, pas des codes couleur, car la teinte affichée dépend du thème
    /// (clair ou sombre) côté site. Aucune ne reprend le rouge, l'orange, le jaune ou le vert de l'échelle
    /// de la carte.
    /// </summary>
    public static class MapRoutePalette
    {
        public static readonly IReadOnlyList<string> Colors = new[]
        {
            "blue", "violet", "magenta", "teal", "brown", "indigo", "pink", "cyan", "slate", "plum"
        };

        public static bool IsValid(string? color) => color is not null && Colors.Contains(color);

        public static string PickRandom() => Colors[Random.Shared.Next(Colors.Count)];
    }
}
