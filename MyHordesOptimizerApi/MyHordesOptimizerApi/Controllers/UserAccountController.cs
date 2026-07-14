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

    public UserAccountController(
        ILogger<UserAccountController> logger,
        IUserInfoProvider userInfoProvider,
        IUserAccountService userAccountService) : base(logger, userInfoProvider)
    {
        _userAccountService = userAccountService;
    }

    [HttpGet]
    [Route("{userId:int}")]
    public ActionResult<UserAccountPublicDto> GetPublicProfile([FromRoute] int userId)
    {
        var profile = _userAccountService.GetPublicProfile(userId);
        return Ok(profile);
    }
}
