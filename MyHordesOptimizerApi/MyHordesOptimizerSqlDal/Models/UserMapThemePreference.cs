using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MyHordesOptimizerApi.Models;

[Table("UserMapThemePreference")]
public partial class UserMapThemePreference
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.None)]
    [Column("idUser", TypeName = "int(11)")]
    public int IdUser { get; set; }

    [Column("activeThemeId", TypeName = "int(11)")]
    public int? ActiveThemeId { get; set; }
}
