using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace MyHordesOptimizerApi.Models;

[Table("UserPicto")]
[PrimaryKey("IdUser", "IdPicto")]
public partial class UserPicto
{
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

    [ForeignKey("IdUser")]
    [InverseProperty("UserPictos")]
    public virtual User IdUserNavigation { get; set; } = null!;

    [ForeignKey("IdPicto")]
    [InverseProperty("UserPictos")]
    public virtual Picto IdPictoNavigation { get; set; } = null!;
}
