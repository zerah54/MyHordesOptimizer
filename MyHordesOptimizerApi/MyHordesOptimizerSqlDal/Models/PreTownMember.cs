using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace MyHordesOptimizerApi.Models;

/// <summary>Membre d'une pré-ville.</summary>
[Table("PreTownMember")]
[PrimaryKey("IdPreTown", "IdUser")]
[Index("IdUser", Name = "PreTownMember_idUser")]
public partial class PreTownMember
{
    [Column("idPreTown", TypeName = "int(11)")]
    public int IdPreTown { get; set; }

    [Column("idUser", TypeName = "int(11)")]
    public int IdUser { get; set; }

    [Column("isOrganizer")]
    public bool IsOrganizer { get; set; }

    [Column("addedAt", TypeName = "datetime")]
    public DateTime AddedAt { get; set; }

    /// <summary>L'invitation a été vue par le membre.</summary>
    [Column("seen")]
    public bool Seen { get; set; }
}
