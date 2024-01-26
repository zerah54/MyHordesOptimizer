using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace MyHordesOptimizerApi.Models;

[Table("Action")]
public partial class Action
{
    [Key]
    [Column("name")]
    public string Name { get; set; }

    [ForeignKey("ActionName")]
    [InverseProperty("ActionNames")]
    public virtual ICollection<Item> IdItems { get; set; } = new List<Item>();
}
