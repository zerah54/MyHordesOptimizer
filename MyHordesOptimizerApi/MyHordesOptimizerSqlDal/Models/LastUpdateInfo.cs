using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace MyHordesOptimizerApi.Models;

[Table("LastUpdateInfo")]
[Index("IdUser", Name = "idUser")]
public partial class LastUpdateInfo
{
    [Key]
    [Column("idLastUpdateInfo", TypeName = "int(11)")]
    public int IdLastUpdateInfo { get; set; }

    [Column("dateUpdate", TypeName = "datetime")]
    public DateTime DateUpdate { get; set; }

    [Column("idUser", TypeName = "int(11)")]
    public int? IdUser { get; set; }

    [InverseProperty("IdLastUpdateInfoNavigation")]
    public virtual ICollection<Bag> Bags { get; set; } = new List<Bag>();

    [InverseProperty("IdLastUpdateInfoNavigation")]
    public virtual ICollection<Expedition> Expeditions { get; set; } = new List<Expedition>();

    [ForeignKey("IdUser")]
    [InverseProperty("LastUpdateInfos")]
    public virtual User? IdUserNavigation { get; set; }

    [InverseProperty("IdLastUpdateInfoNavigation")]
    public virtual ICollection<MapCellDig> MapCellDigs { get; set; } = new List<MapCellDig>();

    [InverseProperty("IdLastUpdateInfoNavigation")]
    public virtual ICollection<MapCell> MapCells { get; set; } = new List<MapCell>();

    [InverseProperty("IdLastUpdateInfoNavigation")]
    public virtual ICollection<TownBankItem> TownBankItems { get; set; } = new List<TownBankItem>();

    [InverseProperty("IdLastUpdateInfoNavigation")]
    public virtual ICollection<TownCadaver> TownCadavers { get; set; } = new List<TownCadaver>();

    [InverseProperty("IdLastUpdateInfoNavigation")]
    public virtual ICollection<TownCitizenBath> TownCitizenBaths { get; set; } = new List<TownCitizenBath>();

    [InverseProperty("IdLastUpdateInfoGhoulStatusNavigation")]
    public virtual ICollection<TownCitizen> TownCitizenIdLastUpdateInfoGhoulStatusNavigations { get; set; } = new List<TownCitizen>();

    [InverseProperty("IdLastUpdateInfoHeroicActionNavigation")]
    public virtual ICollection<TownCitizen> TownCitizenIdLastUpdateInfoHeroicActionNavigations { get; set; } = new List<TownCitizen>();

    [InverseProperty("IdLastUpdateInfoHomeNavigation")]
    public virtual ICollection<TownCitizen> TownCitizenIdLastUpdateInfoHomeNavigations { get; set; } = new List<TownCitizen>();

    [InverseProperty("IdLastUpdateInfoNavigation")]
    public virtual ICollection<TownCitizen> TownCitizenIdLastUpdateInfoNavigations { get; set; } = new List<TownCitizen>();

    [InverseProperty("IdLastUpdateInfoStatusNavigation")]
    public virtual ICollection<TownCitizen> TownCitizenIdLastUpdateInfoStatusNavigations { get; set; } = new List<TownCitizen>();

    [InverseProperty("IdLastUpdateInfoNavigation")]
    public virtual ICollection<TownEstimation> TownEstimations { get; set; } = new List<TownEstimation>();
}
