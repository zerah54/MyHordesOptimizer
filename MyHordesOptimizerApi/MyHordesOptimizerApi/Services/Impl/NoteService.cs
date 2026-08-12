using System;
using System.Collections.Generic;
using System.Linq;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Note;
using MyHordesOptimizerApi.Exceptions;
using MyHordesOptimizerApi.Models;
using MyHordesOptimizerApi.Services.Interfaces;

namespace MyHordesOptimizerApi.Services.Impl;

public class NoteService : INoteService
{
    private readonly MhoContext _dbContext;

    public NoteService(MhoContext dbContext)
    {
        _dbContext = dbContext;
    }

    /// <summary>
    /// Clé du dictionnaire = mapId (identifiant public), pas IdTown (interne) : le client envoie
    /// toujours le mapId (voir ResolveTownId), donc TownNote.IdTown doit être rejoint sur Town pour
    /// retrouver le mapId affiché par town-list. Une note sans Town.MapId (ville jamais migrée) est
    /// exclue — le front ne propose d'ailleurs pas d'ouvrir la note sur une ligne sans mapId.
    /// </summary>
    public Dictionary<int, NoteDto> GetMyTownNotes(int authorUserId)
    {
        return _dbContext.TownNotes
            .Where(n => n.IdUserAuthor == authorUserId)
            .Join(_dbContext.Towns, n => n.IdTown, t => t.IdTown,
                (n, t) => new { t.MapId, n.Note, n.UpdatedAt })
            .Where(x => x.MapId.HasValue)
            .ToDictionary(x => x.MapId!.Value, x => new NoteDto { Note = x.Note, UpdatedAt = x.UpdatedAt });
    }

    public void UpsertTownNote(int authorUserId, int mapId, string? note)
    {
        var townId = _dbContext.ResolveTownId(mapId);
        EnsureParticipated(authorUserId, townId);
        var existing = _dbContext.TownNotes
            .SingleOrDefault(n => n.IdUserAuthor == authorUserId && n.IdTown == townId);

        if (string.IsNullOrWhiteSpace(note))
        {
            if (existing is not null) _dbContext.TownNotes.Remove(existing);
            _dbContext.SaveChanges();
            return;
        }

        if (existing is null)
        {
            _dbContext.TownNotes.Add(new TownNote
            {
                IdUserAuthor = authorUserId,
                IdTown = townId,
                Note = note,
                UpdatedAt = DateTime.UtcNow
            });
        }
        else
        {
            existing.Note = note;
            existing.UpdatedAt = DateTime.UtcNow;
        }
        _dbContext.SaveChanges();
    }

    public NoteDto GetUserNote(int authorUserId, int targetUserId)
    {
        var note = _dbContext.UserNotes
            .SingleOrDefault(n => n.IdUserAuthor == authorUserId && n.IdUserTarget == targetUserId && n.IdTown == 0);
        return new NoteDto { Note = note?.Note, UpdatedAt = note?.UpdatedAt };
    }

    public void UpsertUserNote(int authorUserId, int targetUserId, string? note)
        => UpsertUserNoteInternal(authorUserId, targetUserId, 0, note);

    /// <summary>Notes globales (idTown = 0) de l'appelant, indexées par idUserTarget. Un seul appel pour toute une liste.</summary>
    public Dictionary<int, NoteDto> GetMyUserNotes(int authorUserId)
    {
        return _dbContext.UserNotes
            .Where(n => n.IdUserAuthor == authorUserId && n.IdTown == 0)
            .ToDictionary(n => n.IdUserTarget, n => new NoteDto { Note = n.Note, UpdatedAt = n.UpdatedAt });
    }

    public Dictionary<int, NoteDto> GetMyCitizenNotes(int authorUserId, int mapId)
    {
        var townId = _dbContext.ResolveTownId(mapId);
        return _dbContext.UserNotes
            .Where(n => n.IdUserAuthor == authorUserId && n.IdTown == townId)
            .ToDictionary(n => n.IdUserTarget, n => new NoteDto { Note = n.Note, UpdatedAt = n.UpdatedAt });
    }

    public void UpsertCitizenNote(int authorUserId, int targetUserId, int mapId, string? note)
    {
        var townId = _dbContext.ResolveTownId(mapId);
        EnsureParticipated(authorUserId, townId);
        UpsertUserNoteInternal(authorUserId, targetUserId, townId, note);
    }

    /// <summary>Notes de l'appelant sur ce citoyen, une par ville jouée ensemble, indexées par mapId (même join que GetMyTownNotes).</summary>
    public Dictionary<int, NoteDto> GetMyCitizenNotesForUser(int authorUserId, int targetUserId)
    {
        return _dbContext.UserNotes
            .Where(n => n.IdUserAuthor == authorUserId && n.IdUserTarget == targetUserId && n.IdTown != 0)
            .Join(_dbContext.Towns, n => n.IdTown, t => t.IdTown,
                (n, t) => new { t.MapId, n.Note, n.UpdatedAt })
            .Where(x => x.MapId.HasValue)
            .ToDictionary(x => x.MapId!.Value, x => new NoteDto { Note = x.Note, UpdatedAt = x.UpdatedAt });
    }

    private void UpsertUserNoteInternal(int authorUserId, int targetUserId, int townId, string? note)
    {
        if (authorUserId == targetUserId)
        {
            throw new MhoTechnicalException("Impossible de mettre une note sur soi-même.");
        }

        if (!_dbContext.Users.Any(u => u.IdUser == targetUserId))
        {
            throw new MhoTechnicalException($"L'utilisateur cible {targetUserId} n'existe pas.");
        }

        var existing = _dbContext.UserNotes
            .SingleOrDefault(n => n.IdUserAuthor == authorUserId && n.IdUserTarget == targetUserId && n.IdTown == townId);

        if (string.IsNullOrWhiteSpace(note))
        {
            if (existing is not null) _dbContext.UserNotes.Remove(existing);
            _dbContext.SaveChanges();
            return;
        }

        if (existing is null)
        {
            _dbContext.UserNotes.Add(new UserNote
            {
                IdUserAuthor = authorUserId,
                IdUserTarget = targetUserId,
                IdTown = townId,
                Note = note,
                UpdatedAt = DateTime.UtcNow
            });
        }
        else
        {
            existing.Note = note;
            existing.UpdatedAt = DateTime.UtcNow;
        }
        _dbContext.SaveChanges();
    }

    /// <summary>Note de ville ou de citoyen : n'a de sens que sur une ville où l'auteur a lui-même été citoyen.</summary>
    private void EnsureParticipated(int authorUserId, int townId)
    {
        var participated = _dbContext.TownCitizens.Any(c => c.IdTown == townId && c.IdUser == authorUserId);
        if (!participated)
        {
            throw new MhoTechnicalException($"L'utilisateur {authorUserId} n'a pas participé à la ville {townId}.");
        }
    }
}
