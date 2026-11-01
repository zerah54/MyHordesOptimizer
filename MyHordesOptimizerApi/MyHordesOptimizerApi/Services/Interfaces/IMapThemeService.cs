using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.MapTheme;

namespace MyHordesOptimizerApi.Services.Interfaces;

public interface IMapThemeService
{
    MapThemesDto GetMine(int userId);
    MapThemeDto Create(int userId, UpsertMapThemeRequestDto request);
    MapThemeDto Update(int userId, int themeId, UpsertMapThemeRequestDto request);
    void Delete(int userId, int themeId);
    void SetActive(int userId, MapThemeActiveDto active);
}
