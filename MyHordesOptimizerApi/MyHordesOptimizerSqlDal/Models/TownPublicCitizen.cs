using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MyHordesOptimizerApi.Models;

[Table("TownPublicCitizen")]
public class TownPublicCitizen
{
    [Column("idTown", TypeName = "int(11)")]
    public int IdTown { get; set; }

    [Column("idUser", TypeName = "int(11)")]
    public int IdUser { get; set; }

    [Column("name", TypeName = "nvarchar(255)")]
    public string? Name { get; set; }

    [Column("avatar", TypeName = "nvarchar(255)")]
    public string? Avatar { get; set; }

    [Column("survivalDay", TypeName = "int(11)")]
    public int? SurvivalDay { get; set; }

    [Column("score", TypeName = "int(11)")]
    public int? Score { get; set; }

    [Column("deathTypeId", TypeName = "int(11)")]
    public int? DeathTypeId { get; set; }

    [Column("message")]
    public string? Message { get; set; }

    [Column("comment")]
    public string? Comment { get; set; }

    [ForeignKey("IdTown")]
    public virtual Town? IdTownNavigation { get; set; }
}
