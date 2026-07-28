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

    /// <summary>
    /// Nom du prototype côté MyHordes (ex. <c>r_ripflash_#00</c>), clé du dictionnaire renvoyé
    /// par <c>/json/pictos</c>. C'est l'identité stable du picto, que l'import jetait avant.
    /// </summary>
    [Column("uid")]
    public string? Uid { get; set; }

    /// <summary>
    /// Identifiant du prototype chez MyHordes, à l'instant de la dernière synchronisation.
    /// MUTABLE et sans valeur d'identité : c'est un auto-incrément de fixtures, qui change
    /// d'une instance du jeu à l'autre. L'identité, c'est <see cref="Uid"/>.
    /// Peut différer de <c>IdPicto</c> — c'est normal et voulu.
    /// </summary>
    [Column("mhId", TypeName = "int(11)")]
    public int? MhId { get; set; }

    /// <summary>
    /// Vrai quand le prototype a disparu du jeu. La ligne est CONSERVÉE pour que les données
    /// qui la référencent restent résolvables — un picto gagné il y a trois saisons doit
    /// rester affichable ; elle est seulement exclue des catalogues.
    /// </summary>
    [Column("isObsolete")]
    public bool IsObsolete { get; set; }

    [InverseProperty("IdPictoNavigation")]
    public virtual ICollection<UserPicto> UserPictos { get; set; } = new List<UserPicto>();

    [InverseProperty("IdPictoNavigation")]
    public virtual ICollection<TownCitizenPicto> TownCitizenPictos { get; set; } = new List<TownCitizenPicto>();
}
