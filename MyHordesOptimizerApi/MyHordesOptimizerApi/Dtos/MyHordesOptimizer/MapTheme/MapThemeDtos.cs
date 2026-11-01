using System;
using System.Collections.Generic;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.MapTheme;

public class MapThemeDto
{
    public int Id { get; set; }
    public string Name { get; set; } = null!;
    public Dictionary<string, string> Colors { get; set; } = new();
    public DateTime UpdatedAt { get; set; }
}

public class MapThemeActiveDto
{
    public int? ThemeId { get; set; }
}

public class MapThemesDto
{
    public List<MapThemeDto> Themes { get; set; } = new();
    public MapThemeActiveDto Active { get; set; } = new();
}

public class UpsertMapThemeRequestDto
{
    public string Name { get; set; } = null!;
    public Dictionary<string, string> Colors { get; set; } = null!;
}
