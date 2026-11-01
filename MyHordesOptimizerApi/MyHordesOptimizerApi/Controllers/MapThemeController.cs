using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.Controllers.Abstract;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.MapTheme;
using MyHordesOptimizerApi.Providers.Interfaces;
using MyHordesOptimizerApi.Services.Interfaces;

namespace MyHordesOptimizerApi.Controllers;

[ApiController]
[Route("[controller]")]
[Authorize]
public class MapThemeController : AbstractMyHordesOptimizerControllerBase
{
    private readonly IMapThemeService _mapThemeService;

    public MapThemeController(ILogger<MapThemeController> logger, IUserInfoProvider userInfoProvider, IMapThemeService mapThemeService)
        : base(logger, userInfoProvider)
    {
        _mapThemeService = mapThemeService;
    }

    [HttpGet]
    public ActionResult<MapThemesDto> GetMine()
        => Ok(_mapThemeService.GetMine(UserInfoProvider.UserId));

    [HttpPost]
    public ActionResult<MapThemeDto> Create([FromBody] UpsertMapThemeRequestDto request)
        => Ok(_mapThemeService.Create(UserInfoProvider.UserId, request));

    [HttpPut("{id:int}")]
    public ActionResult<MapThemeDto> Update([FromRoute] int id, [FromBody] UpsertMapThemeRequestDto request)
        => Ok(_mapThemeService.Update(UserInfoProvider.UserId, id, request));

    [HttpDelete("{id:int}")]
    public ActionResult Delete([FromRoute] int id)
    {
        _mapThemeService.Delete(UserInfoProvider.UserId, id);
        return NoContent();
    }

    [HttpPut("active")]
    public ActionResult SetActive([FromBody] MapThemeActiveDto active)
    {
        _mapThemeService.SetActive(UserInfoProvider.UserId, active);
        return NoContent();
    }
}
