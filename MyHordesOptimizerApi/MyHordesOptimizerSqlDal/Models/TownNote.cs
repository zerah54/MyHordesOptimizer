using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MyHordesOptimizerApi.Models;

[Table("TownNote")]
public partial class TownNote
{
    [Key]
    [Column("idTownNote", TypeName = "int(11)")]
    public int IdTownNote { get; set; }

    [Column("idUserAuthor", TypeName = "int(11)")]
    public int IdUserAuthor { get; set; }

    /// <summary>Town.IdTown résolu via ResolveTownId — peut être une clé provisoire -mapId, pas de FK.</summary>
    [Column("idTown", TypeName = "int(11)")]
    public int IdTown { get; set; }

    [Column("note", TypeName = "text")]
    public string Note { get; set; } = null!;

    [Column("updatedAt")]
    public DateTime UpdatedAt { get; set; }
}
