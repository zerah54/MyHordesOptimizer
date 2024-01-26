using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace MyHordesOptimizerApi.Models;

[Table("Property")]
public partial class Property
{
    [Key]
    [Column("name")]
    public string Name { get; set; }

    [ForeignKey("PropertyName")]
    [InverseProperty("PropertyNames")]
    public virtual ICollection<Item> IdItems { get; set; } = new List<Item>();
}
