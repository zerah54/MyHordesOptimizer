using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;

namespace MyHordesOptimizerApi.Services.Impl;

/// <summary>Jetons de couleur de la carte acceptés dans un thème.</summary>
public static class MapThemePalette
{
    public const int MaxThemesPerUser = 20;
    public const int MaxNameLength = 64;

    public static readonly IReadOnlyList<string> TokenKeys = new[]
    {
        "map-l0", "map-l1", "map-l2", "map-l3", "map-unknown", "map-hatch", "map-fg", "map-marker",
        "map-marker-ink", "map-me", "map-sel", "map-sel-fg", "map-age-green", "map-age-yellow",
        "map-age-orange", "map-age-red"
    };

    private static readonly Regex HexColor = new("^#[0-9a-fA-F]{6}$", RegexOptions.Compiled);

    public static bool IsValidToken(string? key) => key is not null && TokenKeys.Contains(key);

    public static bool IsValidColor(string? value) => value is not null && HexColor.IsMatch(value);
}
