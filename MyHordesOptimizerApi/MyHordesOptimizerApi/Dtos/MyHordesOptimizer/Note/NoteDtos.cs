using System;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Note;

public class NoteDto
{
    public string? Note { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class UpsertNoteRequestDto
{
    public string? Note { get; set; }
}
