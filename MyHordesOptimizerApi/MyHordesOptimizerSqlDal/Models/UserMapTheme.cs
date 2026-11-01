using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MyHordesOptimizerApi.Models;

[Table("UserMapTheme")]
public partial class UserMapTheme
{
    [Key]
    [Column("idUserMapTheme", TypeName = "int(11)")]
    public int IdUserMapTheme { get; set; }

    [Column("idUser", TypeName = "int(11)")]
    public int IdUser { get; set; }

    [Column("name")]
    public string Name { get; set; } = null!;

    /// <summary>Dictionnaire clé de jeton -> couleur hexadécimale, sérialisé en JSON.</summary>
    [Column("colors", TypeName = "text")]
    public string Colors { get; set; } = null!;

    [Column("updatedAt")]
    public DateTime UpdatedAt { get; set; }
}
