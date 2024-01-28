using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace MyHordesOptimizerApi.Models;

public partial class Parameter
{
    [Key]
    [Column("name")]
    public string Name { get; set; } = null!;

    [Column("value")]
    [StringLength(255)]
    public string Value { get; set; } = null!;
}
