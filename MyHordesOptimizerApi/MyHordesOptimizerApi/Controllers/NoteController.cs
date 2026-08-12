using System.Collections.Generic;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.Controllers.Abstract;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Note;
using MyHordesOptimizerApi.Providers.Interfaces;
using MyHordesOptimizerApi.Services.Interfaces;

namespace MyHordesOptimizerApi.Controllers;

[ApiController]
[Route("[controller]")]
[Authorize]
public class NoteController : AbstractMyHordesOptimizerControllerBase
{
    private readonly INoteService _noteService;

    public NoteController(ILogger<NoteController> logger, IUserInfoProvider userInfoProvider, INoteService noteService)
        : base(logger, userInfoProvider)
    {
        _noteService = noteService;
    }

    [HttpGet]
    [Route("town/mine")]
    public ActionResult<Dictionary<int, NoteDto>> GetMyTownNotes()
        => Ok(_noteService.GetMyTownNotes(UserInfoProvider.UserId));

    [HttpPut]
    [Route("town/{mapId:int}")]
    public ActionResult UpsertTownNote([FromRoute] int mapId, [FromBody] UpsertNoteRequestDto request)
    {
        _noteService.UpsertTownNote(UserInfoProvider.UserId, mapId, request.Note);
        return NoContent();
    }

    [HttpGet]
    [Route("user/mine")]
    public ActionResult<Dictionary<int, NoteDto>> GetMyUserNotes()
        => Ok(_noteService.GetMyUserNotes(UserInfoProvider.UserId));

    [HttpGet]
    [Route("user/{userId:int}")]
    public ActionResult<NoteDto> GetUserNote([FromRoute] int userId)
        => Ok(_noteService.GetUserNote(UserInfoProvider.UserId, userId));

    [HttpPut]
    [Route("user/{userId:int}")]
    public ActionResult UpsertUserNote([FromRoute] int userId, [FromBody] UpsertNoteRequestDto request)
    {
        _noteService.UpsertUserNote(UserInfoProvider.UserId, userId, request.Note);
        return NoContent();
    }

    [HttpGet]
    [Route("citizen/mine")]
    public ActionResult<Dictionary<int, NoteDto>> GetMyCitizenNotes([FromQuery] int townId)
        => Ok(_noteService.GetMyCitizenNotes(UserInfoProvider.UserId, townId));

    [HttpGet]
    [Route("citizen/{userId:int}/mine")]
    public ActionResult<Dictionary<int, NoteDto>> GetMyCitizenNotesForUser([FromRoute] int userId)
        => Ok(_noteService.GetMyCitizenNotesForUser(UserInfoProvider.UserId, userId));

    [HttpPut]
    [Route("citizen/{userId:int}")]
    public ActionResult UpsertCitizenNote([FromRoute] int userId, [FromQuery] int townId, [FromBody] UpsertNoteRequestDto request)
    {
        _noteService.UpsertCitizenNote(UserInfoProvider.UserId, userId, townId, request.Note);
        return NoContent();
    }
}
