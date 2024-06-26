﻿using System;
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
    [MySqlCharSet("utf8mb3")]
    [MySqlCollation("utf8mb3_general_ci")]
    public string Name { get; set; } = null!;

    [ForeignKey("ActionName")]
    [InverseProperty("ActionNames")]
    public virtual ICollection<Item> IdItems { get; set; } = new List<Item>();
}
