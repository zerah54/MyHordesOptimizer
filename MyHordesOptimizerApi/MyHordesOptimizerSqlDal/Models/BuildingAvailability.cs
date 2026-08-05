using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace MyHordesOptimizerApi.Models;

/// <summary>
/// Disponibilité d'un chantier selon le type de ville. L'ABSENCE de ligne pour un couple
/// (chantier, townType) signifie « disponible normalement » — voir MyHordesImportService.
/// </summary>
/// <remarks>
/// Délibérément SANS propriété de navigation : rien dans le code n'a besoin de naviguer depuis
/// cette entité, et son absence évite tout risque avec DbContext.Patch/UpdateAllButKeysProperties.
/// </remarks>
[Table("BuildingAvailability")]
[PrimaryKey("IdBuilding", "TownType")]
public partial class BuildingAvailability
{
    [Key]
    [Column("idBuilding", TypeName = "int(11)")]
    public int IdBuilding { get; set; }

    [Key]
    [Column("townType")]
    public int TownType { get; set; }

    [Column("status")]
    public int Status { get; set; }
}
