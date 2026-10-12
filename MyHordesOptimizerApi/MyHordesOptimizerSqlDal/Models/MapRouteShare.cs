using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace MyHordesOptimizerApi.Models;

/// <summary>Citoyen autorisé à voir un tracé privé.</summary>
[PrimaryKey("IdMapRoute", "IdUser")]
[Table("MapRouteShare")]
public partial class MapRouteShare
{
    [Column("idMapRoute", TypeName = "int(11)")]
    public int IdMapRoute { get; set; }

    [Column("idUser", TypeName = "int(11)")]
    public int IdUser { get; set; }

    [ForeignKey("IdMapRoute")]
    [InverseProperty("MapRouteShares")]
    public virtual MapRoute IdMapRouteNavigation { get; set; } = null!;
}
