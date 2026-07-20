using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MyHordesOptimizerApi.Models;

[Table("Picto")]
public partial class Picto
{
    [Key]
    [Column("idPicto", TypeName = "int(11)")]
    [DatabaseGenerated(DatabaseGeneratedOption.None)]
    public int IdPicto { get; set; }

    [Column("img")]
    [StringLength(255)]
    public string Img { get; set; } = null!;

    [Column("nameFr")]
    [StringLength(255)]
    public string? NameFr { get; set; }

    [Column("nameEn")]
    [StringLength(255)]
    public string? NameEn { get; set; }

    [Column("nameEs")]
    [StringLength(255)]
    public string? NameEs { get; set; }

    [Column("nameDe")]
    [StringLength(255)]
    public string? NameDe { get; set; }

    [Column("descFr", TypeName = "text")]
    public string? DescFr { get; set; }

    [Column("descEn", TypeName = "text")]
    public string? DescEn { get; set; }

    [Column("descEs", TypeName = "text")]
    public string? DescEs { get; set; }

    [Column("descDe", TypeName = "text")]
    public string? DescDe { get; set; }

    [Column("rare")]
    public bool Rare { get; set; }

    [Column("community")]
    public bool Community { get; set; }

    [InverseProperty("IdPictoNavigation")]
    public virtual ICollection<UserPicto> UserPictos { get; set; } = new List<UserPicto>();

    [InverseProperty("IdPictoNavigation")]
    public virtual ICollection<TownCitizenPicto> TownCitizenPictos { get; set; } = new List<TownCitizenPicto>();
}
