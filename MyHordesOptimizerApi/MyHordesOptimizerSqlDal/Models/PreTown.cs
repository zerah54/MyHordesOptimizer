using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace MyHordesOptimizerApi.Models;

/// <summary>Espace de préparation d'une ville avant son lancement (cf. 2026_11_13_pre_towns.sql).</summary>
[Table("PreTown")]
[Index("LinkedIdTown", Name = "PreTown_linkedIdTown", IsUnique = true)]
public partial class PreTown
{
    [Key]
    [Column("idPreTown", TypeName = "int(11)")]
    public int IdPreTown { get; set; }

    [Column("alias")]
    [StringLength(64)]
    public string Alias { get; set; } = null!;

    [Column("idCreator", TypeName = "int(11)")]
    public int IdCreator { get; set; }

    [Column("createdAt", TypeName = "datetime")]
    public DateTime CreatedAt { get; set; }

    /// <summary>Ville réelle rattachée (une pré-ville ↔ une ville) ; null tant que non liée.</summary>
    [Column("linkedIdTown", TypeName = "int(11)")]
    public int? LinkedIdTown { get; set; }

    [Column("linkedMapId", TypeName = "int(11)")]
    public int? LinkedMapId { get; set; }

    [Column("linkedAt", TypeName = "datetime")]
    public DateTime? LinkedAt { get; set; }

    [Column("idLinker", TypeName = "int(11)")]
    public int? IdLinker { get; set; }

    /// <summary>Nombre de citoyens simulés pour chiffrer Chantiers et Veilles (cf. 2026_11_16_pre_town_simulated_citizens.sql).</summary>
    [Column("simulatedCitizens", TypeName = "int(11)")]
    public int SimulatedCitizens { get; set; } = 40;
}
