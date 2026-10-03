using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace MyHordesOptimizerApi.Models;

/// <summary>
/// Compteur du bot Discord (/aa, /timer) en attente d'échéance. Persisté pour survivre à un
/// redémarrage de l'API ; supprimé une fois la notification envoyée.
/// </summary>
[Table("DiscordTimer")]
[Index("UserId", Name = "idx_discordtimer_user")]
public partial class DiscordTimer
{
    [Key]
    [Column("idDiscordTimer", TypeName = "int(11)")]
    public int IdDiscordTimer { get; set; }

    /// <summary>Identifiant Discord de l'auteur de la commande.</summary>
    [Column("userId", TypeName = "bigint(20) unsigned")]
    public ulong UserId { get; set; }

    /// <summary>Salon où publier la notification ; null : message privé à l'auteur.</summary>
    [Column("channelId", TypeName = "bigint(20) unsigned")]
    public ulong? ChannelId { get; set; }

    [Column("message")]
    [StringLength(1000)]
    public string Message { get; set; } = null!;

    /// <summary>Langue de l'auteur (« fr », « en », « de », « es ») : textes ajoutés à l'envoi (retard).</summary>
    [Column("locale")]
    [StringLength(8)]
    public string Locale { get; set; } = null!;

    /// <summary>Échéance, en UTC.</summary>
    [Column("dueAt")]
    public DateTime DueAt { get; set; }

    /// <summary>Date de création, en UTC.</summary>
    [Column("createdAt")]
    public DateTime CreatedAt { get; set; }
}
