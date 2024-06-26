﻿using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace MyHordesOptimizerApi.Models;

[Table("TownCadaverCleanUpType")]
[Index("MyHordesApiName", Name = "myHordesApiName", IsUnique = true)]
[Index("TypeName", Name = "typeName", IsUnique = true)]
public partial class TownCadaverCleanUpType
{
    [Key]
    [Column("idType", TypeName = "int(11)")]
    public int IdType { get; set; }

    [Column("typeName")]
    [StringLength(100)]
    [MySqlCharSet("utf8mb3")]
    [MySqlCollation("utf8mb3_general_ci")]
    public string? TypeName { get; set; }

    [Column("myHordesApiName")]
    [StringLength(100)]
    [MySqlCharSet("utf8mb3")]
    [MySqlCollation("utf8mb3_general_ci")]
    public string? MyHordesApiName { get; set; }
}
