using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace MyHordesOptimizerApi.Models;

[PrimaryKey("IdTown", "IdUser", "IdLastUpdateInfo", "Day")]
[Table("TownCitizenBath")]
[Index("IdLastUpdateInfo", Name = "idLastUpdateInfo")]
[Index("IdUser", Name = "idUser")]
public partial class TownCitizenBath
{
    [Key]
    [Column("idTown", TypeName = "int(11)")]
    public int IdTown { get; set; }

    [Key]
    [Column("idUser", TypeName = "int(11)")]
    public int IdUser { get; set; }

    [Key]
    [Column("idLastUpdateInfo", TypeName = "int(11)")]
    public int IdLastUpdateInfo { get; set; }

    [Key]
    [Column("day", TypeName = "int(11)")]
    public int Day { get; set; }

    [ForeignKey("IdLastUpdateInfo")]
    [InverseProperty("TownCitizenBaths")]
    public virtual LastUpdateInfo IdLastUpdateInfoNavigation { get; set; } = null!;

    [ForeignKey("IdTown")]
    [InverseProperty("TownCitizenBaths")]
    public virtual Town IdTownNavigation { get; set; } = null!;

    [ForeignKey("IdUser")]
    [InverseProperty("TownCitizenBaths")]
    public virtual User IdUserNavigation { get; set; } = null!;
}
