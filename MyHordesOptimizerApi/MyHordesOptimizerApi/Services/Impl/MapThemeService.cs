using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.MapTheme;
using MyHordesOptimizerApi.Exceptions;
using MyHordesOptimizerApi.Models;
using MyHordesOptimizerApi.Services.Interfaces;

namespace MyHordesOptimizerApi.Services.Impl;

public class MapThemeService : IMapThemeService
{
    private readonly MhoContext _dbContext;

    public MapThemeService(MhoContext dbContext)
    {
        _dbContext = dbContext;
    }

    public MapThemesDto GetMine(int userId)
    {
        var themes = _dbContext.UserMapThemes
            .Where(t => t.IdUser == userId)
            .OrderBy(t => t.Name)
            .AsEnumerable()
            .Select(ToDto)
            .ToList();
        var pref = _dbContext.UserMapThemePreferences.SingleOrDefault(p => p.IdUser == userId);
        return new MapThemesDto
        {
            Themes = themes,
            Active = new MapThemeActiveDto { ThemeId = pref?.ActiveThemeId }
        };
    }

    public MapThemeDto Create(int userId, UpsertMapThemeRequestDto request)
    {
        var name = Validate(request);
        if (_dbContext.UserMapThemes.Count(t => t.IdUser == userId) >= MapThemePalette.MaxThemesPerUser)
        {
            throw new MhoConflictException($"Limite de {MapThemePalette.MaxThemesPerUser} thèmes atteinte.");
        }
        EnsureNameFree(userId, name, null);

        var theme = new UserMapTheme
        {
            IdUser = userId,
            Name = name,
            Colors = JsonSerializer.Serialize(request.Colors),
            UpdatedAt = DateTime.UtcNow
        };
        _dbContext.UserMapThemes.Add(theme);
        _dbContext.SaveChanges();
        return ToDto(theme);
    }

    public MapThemeDto Update(int userId, int themeId, UpsertMapThemeRequestDto request)
    {
        var theme = FindOwned(userId, themeId);
        var name = Validate(request);
        EnsureNameFree(userId, name, themeId);

        theme.Name = name;
        theme.Colors = JsonSerializer.Serialize(request.Colors);
        theme.UpdatedAt = DateTime.UtcNow;
        _dbContext.SaveChanges();
        return ToDto(theme);
    }

    /// <summary>Efface l'actif explicitement : le suivi EF ne voit pas le ON DELETE SET NULL.</summary>
    public void Delete(int userId, int themeId)
    {
        var theme = FindOwned(userId, themeId);
        var pref = _dbContext.UserMapThemePreferences.SingleOrDefault(p => p.IdUser == userId);
        if (pref?.ActiveThemeId == themeId)
        {
            pref.ActiveThemeId = null;
        }
        _dbContext.UserMapThemes.Remove(theme);
        _dbContext.SaveChanges();
    }

    public void SetActive(int userId, MapThemeActiveDto active)
    {
        if (active.ThemeId.HasValue)
        {
            FindOwned(userId, active.ThemeId.Value);
        }

        var pref = _dbContext.UserMapThemePreferences.SingleOrDefault(p => p.IdUser == userId);
        if (pref is null)
        {
            pref = new UserMapThemePreference { IdUser = userId };
            _dbContext.UserMapThemePreferences.Add(pref);
        }
        pref.ActiveThemeId = active.ThemeId;
        _dbContext.SaveChanges();
    }

    /// <summary>Valide nom et couleurs ; renvoie le nom sans espaces de bord.</summary>
    private static string Validate(UpsertMapThemeRequestDto request)
    {
        var name = request.Name?.Trim() ?? string.Empty;
        if (name.Length is 0 or > MapThemePalette.MaxNameLength)
        {
            throw new MhoBadRequestException($"Le nom doit contenir de 1 à {MapThemePalette.MaxNameLength} caractères.");
        }
        if (request.Colors is null)
        {
            throw new MhoBadRequestException("Les couleurs sont requises.");
        }
        foreach (var (key, value) in request.Colors)
        {
            if (!MapThemePalette.IsValidToken(key))
            {
                throw new MhoBadRequestException($"Jeton de couleur inconnu : {key}.");
            }
            if (!MapThemePalette.IsValidColor(value))
            {
                throw new MhoBadRequestException($"Couleur invalide pour {key}.");
            }
        }
        return name;
    }

    private void EnsureNameFree(int userId, string name, int? exceptThemeId)
    {
        if (_dbContext.UserMapThemes.Any(t => t.IdUser == userId && t.Name == name && t.IdUserMapTheme != exceptThemeId))
        {
            throw new MhoConflictException("Un thème porte déjà ce nom.");
        }
    }

    private UserMapTheme FindOwned(int userId, int themeId)
    {
        return _dbContext.UserMapThemes.SingleOrDefault(t => t.IdUserMapTheme == themeId && t.IdUser == userId)
            ?? throw new MhoNotFoundException("Thème introuvable.");
    }

    private static MapThemeDto ToDto(UserMapTheme t) => new()
    {
        Id = t.IdUserMapTheme,
        Name = t.Name,
        Colors = JsonSerializer.Deserialize<Dictionary<string, string>>(t.Colors) ?? new(),
        UpdatedAt = t.UpdatedAt
    };
}
