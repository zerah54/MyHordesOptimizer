using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MyHordesOptimizerApi.Models;

[Table("UserNote")]
public partial class UserNote
{
    [Key]
    [Column("idUserNote", TypeName = "int(11)")]
    public int IdUserNote { get; set; }

    [Column("idUserAuthor", TypeName = "int(11)")]
    public int IdUserAuthor { get; set; }

    [Column("idUserTarget", TypeName = "int(11)")]
    public int IdUserTarget { get; set; }

    /// <summary>0 = note globale sur l'utilisateur. Sinon Town.IdTown résolu (idem TownNote), pas de FK.</summary>
    [Column("idTown", TypeName = "int(11)")]
    public int IdTown { get; set; }

    [Column("note", TypeName = "text")]
    public string Note { get; set; } = null!;

    [Column("updatedAt")]
    public DateTime UpdatedAt { get; set; }
}
