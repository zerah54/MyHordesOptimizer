using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace MyHordesOptimizerApi.Models;

[PrimaryKey("IdChest", "IdItem", "IsBroken")]
[Table("ChestItem")]
[Index("IdItem", Name = "idItem")]
public partial class ChestItem
{
    [Key]
    [Column("idChest", TypeName = "int(11)")]
    public int IdChest { get; set; }

    [Key]
    [Column("idItem", TypeName = "int(11)")]
    public int IdItem { get; set; }

    [Column("count", TypeName = "int(11)")]
    public int? Count { get; set; }

    [Key]
    [Required]
    [Column("isBroken")]
    public bool? IsBroken { get; set; }

    [ForeignKey("IdChest")]
    [InverseProperty("ChestItems")]
    public virtual Chest IdChestNavigation { get; set; } = null!;

    [ForeignKey("IdItem")]
    [InverseProperty("ChestItems")]
    public virtual Item IdItemNavigation { get; set; } = null!;
}
