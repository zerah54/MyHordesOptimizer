using System.Collections.Generic;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Note;

namespace MyHordesOptimizerApi.Services.Interfaces;

public interface INoteService
{
    Dictionary<int, NoteDto> GetMyTownNotes(int authorUserId);

    void UpsertTownNote(int authorUserId, int mapId, string? note);

    NoteDto GetUserNote(int authorUserId, int targetUserId);

    void UpsertUserNote(int authorUserId, int targetUserId, string? note);

    Dictionary<int, NoteDto> GetMyUserNotes(int authorUserId);

    Dictionary<int, NoteDto> GetMyCitizenNotes(int authorUserId, int mapId);

    void UpsertCitizenNote(int authorUserId, int targetUserId, int mapId, string? note);

    Dictionary<int, NoteDto> GetMyCitizenNotesForUser(int authorUserId, int targetUserId);
}
