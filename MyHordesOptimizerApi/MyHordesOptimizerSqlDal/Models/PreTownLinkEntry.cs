using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace MyHordesOptimizerApi.Models;

/// <summary>Ligne de la ville fantôme réaffectée à la ville réelle lors du lien, pour pouvoir la restituer au délien.</summary>
[Table("PreTownLinkEntry")]
[Index("IdPreTown", Name = "PreTownLinkEntry_idPreTown")]
public partial class PreTownLinkEntry
{
    [Key]
    [Column("idPreTownLinkEntry", TypeName = "int(11)")]
    public int IdPreTownLinkEntry { get; set; }

    [Column("idPreTown", TypeName = "int(11)")]
    public int IdPreTown { get; set; }

    [Column("tableName")]
    [StringLength(64)]
    public string TableName { get; set; } = null!;

    [Column("rowKey")]
    [StringLength(128)]
    public string RowKey { get; set; } = null!;
}
