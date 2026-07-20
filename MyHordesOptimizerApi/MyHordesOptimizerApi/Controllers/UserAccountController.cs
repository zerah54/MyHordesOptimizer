using System.Net;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.Controllers.Abstract;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.UserAccount;
using MyHordesOptimizerApi.Providers.Interfaces;
using MyHordesOptimizerApi.Services.Interfaces;

namespace MyHordesOptimizerApi.Controllers;

[ApiController]
[Route("[controller]")]
public class UserAccountController : AbstractMyHordesOptimizerControllerBase
{
    private readonly IUserAccountService _userAccountService;
    private readonly IMyHordesFetcherService _myHordesFetcherService;

    public UserAccountController(
        ILogger<UserAccountController> logger,
        IUserInfoProvider userInfoProvider,
        IUserAccountService userAccountService,
        IMyHordesFetcherService myHordesFetcherService) : base(logger, userInfoProvider)
    {
        _userAccountService = userAccountService;
        _myHordesFetcherService = myHordesFetcherService;
    }

    /// <summary>
    /// Annuaire des citoyens, paginé côté serveur. Recense tous les joueurs connus, y compris ceux
    /// qui n'utilisent pas MHO : la table est peuplée par les imports de villes.
    /// </summary>
    [HttpGet]
    [Route("list")]
    public ActionResult<CitizenListPageResultDto> GetCitizens([FromQuery] CitizenListQueryDto query)
    {
        var citizens = _userAccountService.GetCitizens(query);
        return Ok(citizens);
    }

    [HttpGet]
    [Route("{userId:int}")]
    public ActionResult<UserAccountPublicDto> GetPublicProfile([FromRoute] int userId)
    {
        var profile = _userAccountService.GetPublicProfile(userId);
        return Ok(profile);
    }

    /// <summary>
    /// Pictos d'un joueur. Sans <paramref name="townId"/> : son total. Avec : les pictos qu'il a
    /// gagnés dans cette ville, chacun accompagné de son total.
    /// </summary>
    [HttpGet]
    [Route("{userId:int}/pictos")]
    public ActionResult<UserPictosDto> GetPictos([FromRoute] int userId, [FromQuery] int? townId)
    {
        var pictos = _userAccountService.GetPictos(userId, townId);
        return Ok(pictos);
    }

    /// <summary>
    /// Déclenche l'import des pictos d'un joueur depuis MyHordes et renvoie son total à jour.
    /// POST : l'appel écrit en base, contrairement à la lecture ci-dessus.
    /// Renvoie 429 si l'import a déjà eu lieu récemment — l'appel est lourd côté MyHordes.
    /// </summary>
    [HttpPost]
    [Route("{userId:int}/pictos/import")]
    [Authorize]
    public ActionResult<UserPictosDto> ImportPictos([FromRoute] int userId)
    {
        if (!_myHordesFetcherService.ImportUserPictos(userId))
        {
            return StatusCode((int)HttpStatusCode.TooManyRequests,
                "Les récompenses de ce joueur ont déjà été importées récemment.");
        }
        return Ok(_userAccountService.GetPictos(userId, null));
    }
}
