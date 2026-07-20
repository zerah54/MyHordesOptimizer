using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace MyHordesOptimizerApi.Models;

[Table("TownCitizenPicto")]
[PrimaryKey("IdTown", "IdUser", "IdPicto")]
public partial class TownCitizenPicto
{
    [Key]
    [Column("idTown", TypeName = "int(11)")]
    public int IdTown { get; set; }

    [Key]
    [Column("idUser", TypeName = "int(11)")]
    public int IdUser { get; set; }

    [Key]
    [Column("idPicto", TypeName = "int(11)")]
    public int IdPicto { get; set; }

    [Column("count", TypeName = "int(11)")]
    public int Count { get; set; }

    [Column("lastUpdate")]
    public DateTime LastUpdate { get; set; }

    [ForeignKey("IdTown")]
    [InverseProperty("TownCitizenPictos")]
    public virtual Town IdTownNavigation { get; set; } = null!;

    [ForeignKey("IdUser")]
    [InverseProperty("TownCitizenPictos")]
    public virtual User IdUserNavigation { get; set; } = null!;

    [ForeignKey("IdPicto")]
    [InverseProperty("TownCitizenPictos")]
    public virtual Picto IdPictoNavigation { get; set; } = null!;
}