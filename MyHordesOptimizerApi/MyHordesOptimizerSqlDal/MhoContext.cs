using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;
using MyHordesOptimizerApi.Models;
using Action = MyHordesOptimizerApi.Models.Action;

namespace MyHordesOptimizerApi;

public partial class MhoContext : DbContext
{
    public MhoContext()
    {
    }

    public MhoContext(DbContextOptions<MhoContext> options)
        : base(options)
    {
    }

    public virtual DbSet<Action> Actions { get; set; }

    public virtual DbSet<Bag> Bags { get; set; }

    public virtual DbSet<BagItem> BagItems { get; set; }

    public virtual DbSet<Category> Categories { get; set; }

    public virtual DbSet<CauseOfDeath> CauseOfDeaths { get; set; }

    public virtual DbSet<DefaultWishlistItem> DefaultWishlistItems { get; set; }

    public virtual DbSet<Expedition> Expeditions { get; set; }

    public virtual DbSet<ExpeditionBag> ExpeditionBags { get; set; }

    public virtual DbSet<ExpeditionCitizen> ExpeditionCitizens { get; set; }

    public virtual DbSet<ExpeditionOrder> ExpeditionOrders { get; set; }

    public virtual DbSet<ExpeditionPart> ExpeditionParts { get; set; }

    public virtual DbSet<HeroSkill> HeroSkills { get; set; }

    public virtual DbSet<Item> Items { get; set; }

    public virtual DbSet<ItemComplet> ItemComplets { get; set; }

    public virtual DbSet<LastUpdateInfo> LastUpdateInfos { get; set; }

    public virtual DbSet<MapCell> MapCells { get; set; }

    public virtual DbSet<MapCellComplet> MapCellComplets { get; set; }

    public virtual DbSet<MapCellDig> MapCellDigs { get; set; }

    public virtual DbSet<MapCellDigUpdate> MapCellDigUpdates { get; set; }

    public virtual DbSet<MapCellItem> MapCellItems { get; set; }

    public virtual DbSet<Parameter> Parameters { get; set; }

    public virtual DbSet<Property> Properties { get; set; }

    public virtual DbSet<Recipe> Recipes { get; set; }

    public virtual DbSet<RecipeComplet> RecipeComplets { get; set; }

    public virtual DbSet<RecipeItemComponent> RecipeItemComponents { get; set; }

    public virtual DbSet<RecipeItemResult> RecipeItemResults { get; set; }

    public virtual DbSet<Ruin> Ruins { get; set; }

    public virtual DbSet<RuinComplete> RuinCompletes { get; set; }

    public virtual DbSet<RuinItemDrop> RuinItemDrops { get; set; }

    public virtual DbSet<Town> Towns { get; set; }

    public virtual DbSet<TownBankItem> TownBankItems { get; set; }

    public virtual DbSet<TownCadaver> TownCadavers { get; set; }

    public virtual DbSet<TownCadaverCleanUp> TownCadaverCleanUps { get; set; }

    public virtual DbSet<TownCadaverCleanUpType> TownCadaverCleanUpTypes { get; set; }

    public virtual DbSet<TownCitizen> TownCitizens { get; set; }

    public virtual DbSet<TownEstimation> TownEstimations { get; set; }

    public virtual DbSet<TownWishListItem> TownWishListItems { get; set; }

    public virtual DbSet<User> Users { get; set; }

    public virtual DbSet<WishlistCategorie> WishlistCategories { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Action>(entity =>
        {
            entity.HasKey(e => e.Name).HasName("PRIMARY");
        });

        modelBuilder.Entity<Bag>(entity =>
        {
            entity.HasKey(e => e.IdBag).HasName("PRIMARY");

            entity.Property(e => e.IdLastUpdateInfo).HasDefaultValueSql("'NULL'");

            entity.HasOne(d => d.IdLastUpdateInfoNavigation).WithMany(p => p.Bags)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("BagItem_fk_lastupdate");
        });

        modelBuilder.Entity<BagItem>(entity =>
        {
            entity.HasKey(e => new { e.IdBag, e.IdItem }).HasName("PRIMARY");

            entity.Property(e => e.Count).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.IsBroken).HasDefaultValueSql("b'0'");

            entity.HasOne(d => d.IdBagNavigation).WithMany(p => p.BagItems)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("BagItem_fk_bag");

            entity.HasOne(d => d.IdItemNavigation).WithMany(p => p.BagItems)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("BagItem_ibfk_1");
        });

        modelBuilder.Entity<Category>(entity =>
        {
            entity.HasKey(e => e.IdCategory).HasName("PRIMARY");

            entity.Property(e => e.LabelDe).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.LabelEn).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.LabelEs).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.LabelFr).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.Ordering).HasDefaultValueSql("'NULL'");
        });

        modelBuilder.Entity<CauseOfDeath>(entity =>
        {
            entity.HasKey(e => e.Dtype).HasName("PRIMARY");

            entity.Property(e => e.DescriptionDe).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.DescriptionEn).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.DescriptionEs).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.DescriptionFr).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.Icon).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.LabelDe).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.LabelEn).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.LabelEs).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.LabelFr).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.Ref).HasDefaultValueSql("'NULL'");
        });

        modelBuilder.Entity<DefaultWishlistItem>(entity =>
        {
            entity.HasKey(e => new { e.IdDefaultWishlist, e.IdItem }).HasName("PRIMARY");

            entity.Property(e => e.Count).HasDefaultValueSql("'0'");
            entity.Property(e => e.Depot).HasDefaultValueSql("b'0'");
            entity.Property(e => e.IdUserAuthor).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.LabelDe).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.LabelEn).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.LabelEs).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.LabelFr).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.Priority).HasDefaultValueSql("'0'");
            entity.Property(e => e.ShouldSignal).HasDefaultValueSql("b'0'");
            entity.Property(e => e.ZoneXpa).HasDefaultValueSql("'0'");

            entity.HasOne(d => d.IdItemNavigation).WithMany(p => p.DefaultWishlistItems)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("DefaultWishlistItem_ibfk_1");
        });

        modelBuilder.Entity<Expedition>(entity =>
        {
            entity.HasKey(e => e.IdExpedition).HasName("PRIMARY");

            entity.Property(e => e.Day).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.IdLastUpdateInfo).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.IdTown).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.Label).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.MinPdc).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.State).HasDefaultValueSql("'NULL'");

            entity.HasOne(d => d.IdLastUpdateInfoNavigation).WithMany(p => p.Expeditions)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("Expedition_ibfk_2");

            entity.HasOne(d => d.IdTownNavigation).WithMany(p => p.Expeditions)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("Expedition_ibfk_1");
        });

        modelBuilder.Entity<ExpeditionBag>(entity =>
        {
            entity.HasKey(e => e.IdExpeditionBag).HasName("PRIMARY");

            entity.Property(e => e.Count).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.IdItem).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.IsBroken).HasDefaultValueSql("'NULL'");

            entity.HasOne(d => d.IdItemNavigation).WithMany(p => p.ExpeditionBags)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("ExpeditionBag_ibfk_1");
        });

        modelBuilder.Entity<ExpeditionCitizen>(entity =>
        {
            entity.HasKey(e => e.IdExpeditionCitizen).HasName("PRIMARY");

            entity.Property(e => e.IdExpeditionBag).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.IdExpeditionPart).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.IdUser).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.IsThirsty).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.Pdc).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.PreinscritHeroic).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.PreinscritJob).HasDefaultValueSql("'NULL'");

            entity.HasOne(d => d.IdExpeditionBagNavigation).WithMany(p => p.ExpeditionCitizens)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("ExpeditionCitizen_ibfk_4");

            entity.HasOne(d => d.IdExpeditionPartNavigation).WithMany(p => p.ExpeditionCitizens)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("ExpeditionCitizen_ibfk_1");

            entity.HasOne(d => d.IdUserNavigation).WithMany(p => p.ExpeditionCitizens)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("ExpeditionCitizen_ibfk_2");

            entity.HasOne(d => d.PreinscritHeroicNavigation).WithMany(p => p.ExpeditionCitizens)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("ExpeditionCitizen_ibfk_3");
        });

        modelBuilder.Entity<ExpeditionOrder>(entity =>
        {
            entity.HasKey(e => e.IdExpeditionOrder).HasName("PRIMARY");

            entity.Property(e => e.IsDone).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.Text).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.Type).HasDefaultValueSql("'NULL'");

            entity.HasMany(d => d.IdExpeditionCitizens).WithMany(p => p.IdExpeditionOrders)
                .UsingEntity<Dictionary<string, object>>(
                    "ExpeditionCitizenOrder",
                    r => r.HasOne<ExpeditionCitizen>().WithMany()
                        .HasForeignKey("IdExpeditionCitizen")
                        .OnDelete(DeleteBehavior.Restrict)
                        .HasConstraintName("ExpeditionCitizenOrder_ibfk_2"),
                    l => l.HasOne<ExpeditionOrder>().WithMany()
                        .HasForeignKey("IdExpeditionOrder")
                        .OnDelete(DeleteBehavior.Restrict)
                        .HasConstraintName("ExpeditionCitizenOrder_ibfk_1"),
                    j =>
                    {
                        j.HasKey("IdExpeditionOrder", "IdExpeditionCitizen").HasName("PRIMARY");
                        j.ToTable("ExpeditionCitizenOrder");
                        j.HasIndex(new[] { "IdExpeditionCitizen" }, "idExpeditionCitizen");
                        j.IndexerProperty<int>("IdExpeditionOrder")
                            .HasColumnType("int(11)")
                            .HasColumnName("idExpeditionOrder");
                        j.IndexerProperty<int>("IdExpeditionCitizen")
                            .HasColumnType("int(11)")
                            .HasColumnName("idExpeditionCitizen");
                    });

            entity.HasMany(d => d.IdExpeditionParts).WithMany(p => p.IdExpeditionOrders)
                .UsingEntity<Dictionary<string, object>>(
                    "ExpeditionPartOrder",
                    r => r.HasOne<ExpeditionPart>().WithMany()
                        .HasForeignKey("IdExpeditionPart")
                        .OnDelete(DeleteBehavior.Restrict)
                        .HasConstraintName("ExpeditionPartOrder_ibfk_2"),
                    l => l.HasOne<ExpeditionOrder>().WithMany()
                        .HasForeignKey("IdExpeditionOrder")
                        .OnDelete(DeleteBehavior.Restrict)
                        .HasConstraintName("ExpeditionPartOrder_ibfk_1"),
                    j =>
                    {
                        j.HasKey("IdExpeditionOrder", "IdExpeditionPart").HasName("PRIMARY");
                        j.ToTable("ExpeditionPartOrder");
                        j.HasIndex(new[] { "IdExpeditionPart" }, "idExpeditionPart");
                        j.IndexerProperty<int>("IdExpeditionOrder")
                            .HasColumnType("int(11)")
                            .HasColumnName("idExpeditionOrder");
                        j.IndexerProperty<int>("IdExpeditionPart")
                            .HasColumnType("int(11)")
                            .HasColumnName("idExpeditionPart");
                    });
        });

        modelBuilder.Entity<ExpeditionPart>(entity =>
        {
            entity.HasKey(e => e.IdExpeditionPart).HasName("PRIMARY");

            entity.Property(e => e.Direction).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.IdExpedition).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.Label).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.Path).HasDefaultValueSql("'NULL'");

            entity.HasOne(d => d.IdExpeditionNavigation).WithMany(p => p.ExpeditionParts)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("ExpeditionPart_ibfk_1");
        });

        modelBuilder.Entity<HeroSkill>(entity =>
        {
            entity.HasKey(e => e.Name).HasName("PRIMARY");

            entity.Property(e => e.DaysNeeded).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.DescriptionDe).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.DescriptionEn).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.DescriptionEs).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.DescriptionFr).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.Icon).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.LabelDe).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.LabelEn).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.LabelEs).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.LabelFr).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.NbUses).HasDefaultValueSql("'NULL'");
        });

        modelBuilder.Entity<Item>(entity =>
        {
            entity.HasKey(e => e.IdItem).HasName("PRIMARY");

            entity.Property(e => e.Deco).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.DescriptionDe).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.DescriptionEn).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.DescriptionEs).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.DescriptionFr).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.DropRateNotPraf).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.DropRatePraf).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.Guard).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.IdCategory).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.Img).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.IsHeaver).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.LabelDe).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.LabelEn).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.LabelEs).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.LabelFr).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.Uid).HasDefaultValueSql("'NULL'");

            entity.HasOne(d => d.IdCategoryNavigation).WithMany(p => p.Items)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("Item_ibfk_1");

            entity.HasMany(d => d.ActionNames).WithMany(p => p.IdItems)
                .UsingEntity<Dictionary<string, object>>(
                    "ItemAction",
                    r => r.HasOne<Action>().WithMany()
                        .HasForeignKey("ActionName")
                        .OnDelete(DeleteBehavior.Restrict)
                        .HasConstraintName("ItemAction_ibfk_2"),
                    l => l.HasOne<Item>().WithMany()
                        .HasForeignKey("IdItem")
                        .OnDelete(DeleteBehavior.Restrict)
                        .HasConstraintName("ItemAction_ibfk_1"),
                    j =>
                    {
                        j.HasKey("IdItem", "ActionName").HasName("PRIMARY");
                        j.ToTable("ItemAction");
                        j.HasIndex(new[] { "ActionName" }, "actionName");
                        j.IndexerProperty<int>("IdItem")
                            .HasColumnType("int(11)")
                            .HasColumnName("idItem");
                        j.IndexerProperty<string>("ActionName").HasColumnName("actionName");
                    });

            entity.HasMany(d => d.PropertyNames).WithMany(p => p.IdItems)
                .UsingEntity<Dictionary<string, object>>(
                    "ItemProperty",
                    r => r.HasOne<Property>().WithMany()
                        .HasForeignKey("PropertyName")
                        .OnDelete(DeleteBehavior.Restrict)
                        .HasConstraintName("ItemProperty_ibfk_2"),
                    l => l.HasOne<Item>().WithMany()
                        .HasForeignKey("IdItem")
                        .OnDelete(DeleteBehavior.Restrict)
                        .HasConstraintName("ItemProperty_ibfk_1"),
                    j =>
                    {
                        j.HasKey("IdItem", "PropertyName").HasName("PRIMARY");
                        j.ToTable("ItemProperty");
                        j.HasIndex(new[] { "PropertyName" }, "propertyName");
                        j.IndexerProperty<int>("IdItem")
                            .HasColumnType("int(11)")
                            .HasColumnName("idItem");
                        j.IndexerProperty<string>("PropertyName").HasColumnName("propertyName");
                    });
        });

        modelBuilder.Entity<ItemComplet>(entity =>
        {
            entity.ToView("ItemComplet");

            entity.Property(e => e.CatLabelDe).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.CatLabelEn).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.CatLabelEs).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.CatLabelFr).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.CatOrdering).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.DropRateNotPraf).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.DropRatePraf).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.IdCategory).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.ItemDeco).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.ItemDescriptionDe).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.ItemDescriptionEn).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.ItemDescriptionEs).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.ItemDescriptionFr).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.ItemDropRateNotPraf).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.ItemDropRatePraf).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.ItemGuard).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.ItemImg).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.ItemIsHeaver).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.ItemLabelDe).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.ItemLabelEn).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.ItemLabelEs).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.ItemLabelFr).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.ItemUid).HasDefaultValueSql("'NULL'");
        });

        modelBuilder.Entity<LastUpdateInfo>(entity =>
        {
            entity.HasKey(e => e.IdLastUpdateInfo).HasName("PRIMARY");

            entity.Property(e => e.IdUser).HasDefaultValueSql("'NULL'");

            entity.HasOne(d => d.IdUserNavigation).WithMany(p => p.LastUpdateInfos)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("LastUpdateInfo_ibfk_1");
        });

        modelBuilder.Entity<MapCell>(entity =>
        {
            entity.HasKey(e => e.IdCell).HasName("PRIMARY");

            entity.Property(e => e.AveragePotentialRemainingDig).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.DangerLevel).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.IdLastUpdateInfo).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.IdRuin).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.IdTown).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.IsDryed).HasDefaultValueSql("b'0'");
            entity.Property(e => e.IsNeverVisited).HasDefaultValueSql("b'1'");
            entity.Property(e => e.IsRuinCamped).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.IsRuinDryed).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.IsTown).HasDefaultValueSql("b'0'");
            entity.Property(e => e.IsVisitedToday).HasDefaultValueSql("b'0'");
            entity.Property(e => e.MaxPotentialRemainingDig).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.NbHero).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.NbKm).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.NbPa).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.NbRuinDig).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.NbZombie).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.NbZombieKilled).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.Note).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.ZoneRegen).HasDefaultValueSql("'NULL'");

            entity.HasOne(d => d.IdLastUpdateInfoNavigation).WithMany(p => p.MapCells)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("MapCell_ibfk_2");

            entity.HasOne(d => d.IdRuinNavigation).WithMany(p => p.MapCells)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("MapCell_ibfk_3");

            entity.HasOne(d => d.IdTownNavigation).WithMany(p => p.MapCells)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("MapCell_ibfk_1");
        });

        modelBuilder.Entity<MapCellComplet>(entity =>
        {
            entity.ToView("MapCellComplet");

            entity.Property(e => e.AveragePotentialRemainingDig).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.DangerLevel).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.IdCell).HasDefaultValueSql("'0'");
            entity.Property(e => e.IdLastUpdateInfo).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.IdRuin).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.IsDryed).HasDefaultValueSql("b'0'");
            entity.Property(e => e.IsItemBroken).HasDefaultValueSql("b'0'");
            entity.Property(e => e.IsNeverVisited).HasDefaultValueSql("b'1'");
            entity.Property(e => e.IsRuinCamped).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.IsRuinDryed).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.IsTown).HasDefaultValueSql("b'0'");
            entity.Property(e => e.IsVisitedToday).HasDefaultValueSql("b'0'");
            entity.Property(e => e.ItemCount).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.MaxPotentialRemainingDig).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.NbHero).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.NbKm).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.NbPa).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.NbRuinDig).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.NbZombie).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.NbZombieKilled).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.Note).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.TotalSucces).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.ZoneRegen).HasDefaultValueSql("'NULL'");
        });

        modelBuilder.Entity<MapCellDig>(entity =>
        {
            entity.HasKey(e => new { e.IdCell, e.IdUser, e.Day }).HasName("PRIMARY");

            entity.Property(e => e.IdLastUpdateInfo).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.NbSucces).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.NbTotalDig).HasDefaultValueSql("'NULL'");

            entity.HasOne(d => d.IdCellNavigation).WithMany(p => p.MapCellDigs)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("MapCellDig_ibfk_2");

            entity.HasOne(d => d.IdLastUpdateInfoNavigation).WithMany(p => p.MapCellDigs)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("MapCellDig_ibfk_3");

            entity.HasOne(d => d.IdUserNavigation).WithMany(p => p.MapCellDigs)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("MapCellDig_ibfk_1");
        });

        modelBuilder.Entity<MapCellDigUpdate>(entity =>
        {
            entity.HasKey(e => new { e.IdTown, e.Day }).HasName("PRIMARY");

            entity.Property(e => e.DirectionRegen).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.LevelRegen).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.TauxRegen).HasDefaultValueSql("'NULL'");

            entity.HasOne(d => d.IdTownNavigation).WithMany(p => p.MapCellDigUpdates)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("MapCellDigUpdate_ibfk_1");
        });

        modelBuilder.Entity<MapCellItem>(entity =>
        {
            entity.HasKey(e => new { e.IdCell, e.IdItem, e.IsBroken }).HasName("PRIMARY");

            entity.Property(e => e.IsBroken).HasDefaultValueSql("b'0'");
            entity.Property(e => e.Count).HasDefaultValueSql("'NULL'");

            entity.HasOne(d => d.IdCellNavigation).WithMany(p => p.MapCellItems)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("MapCellItem_ibfk_2");

            entity.HasOne(d => d.IdItemNavigation).WithMany(p => p.MapCellItems)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("MapCellItem_ibfk_1");
        });

        modelBuilder.Entity<Parameter>(entity =>
        {
            entity.HasKey(e => e.Name).HasName("PRIMARY");
        });

        modelBuilder.Entity<Property>(entity =>
        {
            entity.HasKey(e => e.Name).HasName("PRIMARY");
        });

        modelBuilder.Entity<Recipe>(entity =>
        {
            entity.HasKey(e => e.Name).HasName("PRIMARY");

            entity.Property(e => e.ActionDe).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.ActionEn).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.ActionEs).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.ActionFr).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.PictoUid).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.Stealthy).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.Type).HasDefaultValueSql("'NULL'");
        });

        modelBuilder.Entity<RecipeComplet>(entity =>
        {
            entity.ToView("RecipeComplet");

            entity.Property(e => e.ActionDe).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.ActionEn).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.ActionEs).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.ActionFr).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.ComponentCount).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.PictoUid).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.ResultWeight).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.Stealthy).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.Type).HasDefaultValueSql("'NULL'");
        });

        modelBuilder.Entity<RecipeItemComponent>(entity =>
        {
            entity.HasKey(e => new { e.RecipeName, e.IdItem }).HasName("PRIMARY");

            entity.Property(e => e.Count).HasDefaultValueSql("'NULL'");

            entity.HasOne(d => d.IdItemNavigation).WithMany(p => p.RecipeItemComponents)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("RecipeItemComponent_ibfk_2");

            entity.HasOne(d => d.RecipeNameNavigation).WithMany(p => p.RecipeItemComponents)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("RecipeItemComponent_ibfk_1");
        });

        modelBuilder.Entity<RecipeItemResult>(entity =>
        {
            entity.HasKey(e => new { e.RecipeName, e.IdItem, e.Probability }).HasName("PRIMARY");

            entity.Property(e => e.Weight).HasDefaultValueSql("'NULL'");

            entity.HasOne(d => d.IdItemNavigation).WithMany(p => p.RecipeItemResults)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("RecipeItemResult_ibfk_2");

            entity.HasOne(d => d.RecipeNameNavigation).WithMany(p => p.RecipeItemResults)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("RecipeItemResult_ibfk_1");
        });

        modelBuilder.Entity<Ruin>(entity =>
        {
            entity.HasKey(e => e.IdRuin).HasName("PRIMARY");

            entity.Property(e => e.Camping).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.Capacity).HasDefaultValueSql("'100'");
            entity.Property(e => e.Chance).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.DescriptionDe).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.DescriptionEn).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.DescriptionEs).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.DescriptionFr).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.Explorable).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.Img).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.LabelDe).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.LabelEn).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.LabelEs).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.LabelFr).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.MaxDist).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.MinDist).HasDefaultValueSql("'NULL'");
        });

        modelBuilder.Entity<RuinComplete>(entity =>
        {
            entity.ToView("RuinComplete");

            entity.Property(e => e.DropProbability).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.DropWeight).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.ItemLabelFr).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.ItemUid).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.RuinCamping).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.RuinCapacity).HasDefaultValueSql("'100'");
            entity.Property(e => e.RuinChance).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.RuinDescriptionDe).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.RuinDescriptionEn).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.RuinDescriptionEs).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.RuinDescriptionFr).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.RuinExplorable).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.RuinImg).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.RuinLabelDe).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.RuinLabelEn).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.RuinLabelEs).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.RuinLabelFr).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.RuinMaxDist).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.RuinMinDist).HasDefaultValueSql("'NULL'");
        });

        modelBuilder.Entity<RuinItemDrop>(entity =>
        {
            entity.HasKey(e => new { e.IdRuin, e.IdItem }).HasName("PRIMARY");

            entity.Property(e => e.Probability).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.Weight).HasDefaultValueSql("'NULL'");

            entity.HasOne(d => d.IdItemNavigation).WithMany(p => p.RuinItemDrops)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("RuinItemDrop_ibfk_2");

            entity.HasOne(d => d.IdRuinNavigation).WithMany(p => p.RuinItemDrops).HasConstraintName("RuinItemDrop_ibfk_1");
        });

        modelBuilder.Entity<Town>(entity =>
        {
            entity.HasKey(e => e.IdTown).HasName("PRIMARY");

            entity.Property(e => e.IdUserWishListUpdater).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.WishlistDateUpdate).HasDefaultValueSql("'NULL'");
        });

        modelBuilder.Entity<TownBankItem>(entity =>
        {
            entity.HasKey(e => new { e.IdTown, e.IdItem, e.IdLastUpdateInfo, e.IsBroken }).HasName("PRIMARY");

            entity.Property(e => e.IsBroken).HasDefaultValueSql("b'0'");
            entity.Property(e => e.Count).HasDefaultValueSql("'NULL'");

            entity.HasOne(d => d.IdItemNavigation).WithMany(p => p.TownBankItems)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("TownBankItem_ibfk_2");

            entity.HasOne(d => d.IdLastUpdateInfoNavigation).WithMany(p => p.TownBankItems)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("TownBankItem_ibfk_3");

            entity.HasOne(d => d.IdTownNavigation).WithMany(p => p.TownBankItems)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("TownBankItem_ibfk_1");
        });

        modelBuilder.Entity<TownCadaver>(entity =>
        {
            entity.HasKey(e => e.IdCadaver).HasName("PRIMARY");

            entity.Property(e => e.Avatar).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.CadaverName).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.CauseOfDeath).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.CleanUp).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.DeathMessage).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.IdCitizen).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.IdLastUpdateInfo).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.Score).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.SurvivalDay).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.TownMessage).HasDefaultValueSql("'NULL'");

            entity.HasOne(d => d.CauseOfDeathNavigation).WithMany(p => p.TownCadavers)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("TownCadaver_ibfk_3");

            entity.HasOne(d => d.CleanUpNavigation).WithMany(p => p.TownCadavers)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("TownCadaver_ibfk_4");

            entity.HasOne(d => d.IdCitizenNavigation).WithMany(p => p.TownCadavers)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("TownCadaver_ibfk_1");

            entity.HasOne(d => d.IdLastUpdateInfoNavigation).WithMany(p => p.TownCadavers)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("TownCadaver_ibfk_2");
        });

        modelBuilder.Entity<TownCadaverCleanUp>(entity =>
        {
            entity.HasKey(e => e.IdCleanUp).HasName("PRIMARY");

            entity.Property(e => e.IdCleanUpType).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.IdUserCleanUp).HasDefaultValueSql("'NULL'");
        });

        modelBuilder.Entity<TownCadaverCleanUpType>(entity =>
        {
            entity.HasKey(e => e.IdType).HasName("PRIMARY");

            entity.Property(e => e.MyHordesApiName).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.TypeName).HasDefaultValueSql("'NULL'");
        });

        modelBuilder.Entity<TownCitizen>(entity =>
        {
            entity.HasKey(e => new { e.IdTown, e.IdUser, e.IdLastUpdateInfo }).HasName("PRIMARY");

            entity.Property(e => e.Apagcharges).HasDefaultValueSql("'-1'");
            entity.Property(e => e.Avatar).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.ChestLevel).HasDefaultValueSql("'0'");
            entity.Property(e => e.Dead).HasDefaultValueSql("b'0'");
            entity.Property(e => e.GhoulVoracity).HasDefaultValueSql("'-1'");
            entity.Property(e => e.HasAlarm).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.HasBreakThrough).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.HasBrotherInArms).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.HasCheatDeath).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.HasCurtain).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.HasFence).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.HasHeroicReturn).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.HasLock).HasDefaultValueSql("b'0'");
            entity.Property(e => e.HasLuckyFind).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.HasRescue).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.HasSecondWind).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.HasUppercut).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.HomeMessage).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.HouseDefense).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.HouseLevel).HasDefaultValueSql("'-1'");
            entity.Property(e => e.IdBag).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.IdCadaver).HasDefaultValueSql("'0'");
            entity.Property(e => e.IdLastUpdateInfoGhoulStatus).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.IdLastUpdateInfoHeroicAction).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.IdLastUpdateInfoHome).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.IdLastUpdateInfoStatus).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.IsAddict).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.IsArmWounded).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.IsCamper).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.IsCheatingDeathActive).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.IsCleanBody).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.IsConvalescent).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.IsDesy).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.IsDrugged).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.IsDrunk).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.IsEyeWounded).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.IsFootWounded).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.IsGhost).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.IsGhoul).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.IsHandWounded).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.IsHeadWounded).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.IsHungOver).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.IsImmune).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.IsInfected).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.IsLegWounded).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.IsQuenched).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.IsSated).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.IsTerrorised).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.IsThirsty).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.IsTired).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.JobName).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.JobUid).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.KitchenLevel).HasDefaultValueSql("'-1'");
            entity.Property(e => e.LaboLevel).HasDefaultValueSql("'-1'");
            entity.Property(e => e.PositionX).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.PositionY).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.RenfortLevel).HasDefaultValueSql("'-1'");
            entity.Property(e => e.RestLevel).HasDefaultValueSql("'-1'");

            entity.HasOne(d => d.IdBagNavigation).WithMany(p => p.TownCitizens)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("TownCitizen_ibfk_4");

            entity.HasOne(d => d.IdLastUpdateInfoNavigation).WithMany(p => p.TownCitizenIdLastUpdateInfoNavigations)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("TownCitizen_ibfk_3");

            entity.HasOne(d => d.IdLastUpdateInfoGhoulStatusNavigation).WithMany(p => p.TownCitizenIdLastUpdateInfoGhoulStatusNavigations)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("TownCitizen_ibfk_8");

            entity.HasOne(d => d.IdLastUpdateInfoHeroicActionNavigation).WithMany(p => p.TownCitizenIdLastUpdateInfoHeroicActionNavigations)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("TownCitizen_ibfk_5");

            entity.HasOne(d => d.IdLastUpdateInfoHomeNavigation).WithMany(p => p.TownCitizenIdLastUpdateInfoHomeNavigations)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("TownCitizen_ibfk_6");

            entity.HasOne(d => d.IdLastUpdateInfoStatusNavigation).WithMany(p => p.TownCitizenIdLastUpdateInfoStatusNavigations)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("TownCitizen_ibfk_7");

            entity.HasOne(d => d.IdTownNavigation).WithMany(p => p.TownCitizens)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("TownCitizen_ibfk_1");

            entity.HasOne(d => d.IdUserNavigation).WithMany(p => p.TownCitizens)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("TownCitizen_ibfk_2");
        });

        modelBuilder.Entity<TownEstimation>(entity =>
        {
            entity.HasKey(e => new { e.IdTown, e.Day, e.IsPlanif }).HasName("PRIMARY");

            entity.Property(e => e.IdLastUpdateInfo).HasDefaultValueSql("'NULL'");
            entity.Property(e => e._0max).HasDefaultValueSql("'NULL'");
            entity.Property(e => e._0min).HasDefaultValueSql("'NULL'");
            entity.Property(e => e._100max).HasDefaultValueSql("'NULL'");
            entity.Property(e => e._100min).HasDefaultValueSql("'NULL'");
            entity.Property(e => e._13max).HasDefaultValueSql("'NULL'");
            entity.Property(e => e._13min).HasDefaultValueSql("'NULL'");
            entity.Property(e => e._17max).HasDefaultValueSql("'NULL'");
            entity.Property(e => e._17min).HasDefaultValueSql("'NULL'");
            entity.Property(e => e._21max).HasDefaultValueSql("'NULL'");
            entity.Property(e => e._21min).HasDefaultValueSql("'NULL'");
            entity.Property(e => e._25max).HasDefaultValueSql("'NULL'");
            entity.Property(e => e._25min).HasDefaultValueSql("'NULL'");
            entity.Property(e => e._29max).HasDefaultValueSql("'NULL'");
            entity.Property(e => e._29min).HasDefaultValueSql("'NULL'");
            entity.Property(e => e._33max).HasDefaultValueSql("'NULL'");
            entity.Property(e => e._33min).HasDefaultValueSql("'NULL'");
            entity.Property(e => e._38max).HasDefaultValueSql("'NULL'");
            entity.Property(e => e._38min).HasDefaultValueSql("'NULL'");
            entity.Property(e => e._42max).HasDefaultValueSql("'NULL'");
            entity.Property(e => e._42min).HasDefaultValueSql("'NULL'");
            entity.Property(e => e._46max).HasDefaultValueSql("'NULL'");
            entity.Property(e => e._46min).HasDefaultValueSql("'NULL'");
            entity.Property(e => e._4max).HasDefaultValueSql("'NULL'");
            entity.Property(e => e._4min).HasDefaultValueSql("'NULL'");
            entity.Property(e => e._50max).HasDefaultValueSql("'NULL'");
            entity.Property(e => e._50min).HasDefaultValueSql("'NULL'");
            entity.Property(e => e._54max).HasDefaultValueSql("'NULL'");
            entity.Property(e => e._54min).HasDefaultValueSql("'NULL'");
            entity.Property(e => e._58max).HasDefaultValueSql("'NULL'");
            entity.Property(e => e._58min).HasDefaultValueSql("'NULL'");
            entity.Property(e => e._63max).HasDefaultValueSql("'NULL'");
            entity.Property(e => e._63min).HasDefaultValueSql("'NULL'");
            entity.Property(e => e._68max).HasDefaultValueSql("'NULL'");
            entity.Property(e => e._68min).HasDefaultValueSql("'NULL'");
            entity.Property(e => e._71max).HasDefaultValueSql("'NULL'");
            entity.Property(e => e._71min).HasDefaultValueSql("'NULL'");
            entity.Property(e => e._75max).HasDefaultValueSql("'NULL'");
            entity.Property(e => e._75min).HasDefaultValueSql("'NULL'");
            entity.Property(e => e._79max).HasDefaultValueSql("'NULL'");
            entity.Property(e => e._79min).HasDefaultValueSql("'NULL'");
            entity.Property(e => e._83max).HasDefaultValueSql("'NULL'");
            entity.Property(e => e._83min).HasDefaultValueSql("'NULL'");
            entity.Property(e => e._88max).HasDefaultValueSql("'NULL'");
            entity.Property(e => e._88min).HasDefaultValueSql("'NULL'");
            entity.Property(e => e._8max).HasDefaultValueSql("'NULL'");
            entity.Property(e => e._8min).HasDefaultValueSql("'NULL'");
            entity.Property(e => e._92max).HasDefaultValueSql("'NULL'");
            entity.Property(e => e._92min).HasDefaultValueSql("'NULL'");
            entity.Property(e => e._96max).HasDefaultValueSql("'NULL'");
            entity.Property(e => e._96min).HasDefaultValueSql("'NULL'");

            entity.HasOne(d => d.IdLastUpdateInfoNavigation).WithMany(p => p.TownEstimations)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("TownEstimation_ibfk_2");

            entity.HasOne(d => d.IdTownNavigation).WithMany(p => p.TownEstimations)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("TownEstimation_ibfk_1");
        });

        modelBuilder.Entity<TownWishListItem>(entity =>
        {
            entity.HasKey(e => new { e.IdTown, e.IdItem, e.ZoneXpa }).HasName("PRIMARY");

            entity.Property(e => e.Count).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.Depot).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.Priority).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.ShouldSignal).HasDefaultValueSql("b'0'");

            entity.HasOne(d => d.IdItemNavigation).WithMany(p => p.TownWishListItems)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("TownWishListItem_ibfk_2");

            entity.HasOne(d => d.IdTownNavigation).WithMany(p => p.TownWishListItems)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("TownWishListItem_ibfk_1");
        });

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.IdUser).HasName("PRIMARY");

            entity.Property(e => e.UserKey).HasDefaultValueSql("'NULL'");
        });

        modelBuilder.Entity<WishlistCategorie>(entity =>
        {
            entity.HasKey(e => e.IdCategory).HasName("PRIMARY");

            entity.Property(e => e.IdUserAuthor).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.LabelDe).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.LabelEn).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.LabelEs).HasDefaultValueSql("'NULL'");
            entity.Property(e => e.LabelFr).HasDefaultValueSql("'NULL'");

            entity.HasOne(d => d.IdUserAuthorNavigation).WithMany(p => p.WishlistCategories)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("WishlistCategorie_ibfk_1");

            entity.HasMany(d => d.IdItems).WithMany(p => p.IdCategories)
                .UsingEntity<Dictionary<string, object>>(
                    "WishlistCategorieItem",
                    r => r.HasOne<Item>().WithMany()
                        .HasForeignKey("IdItem")
                        .OnDelete(DeleteBehavior.Restrict)
                        .HasConstraintName("WishlistCategorieItem_ibfk_1"),
                    l => l.HasOne<WishlistCategorie>().WithMany()
                        .HasForeignKey("IdCategory")
                        .OnDelete(DeleteBehavior.Restrict)
                        .HasConstraintName("WishlistCategorieItem_ibfk_2"),
                    j =>
                    {
                        j.HasKey("IdCategory", "IdItem").HasName("PRIMARY");
                        j.ToTable("WishlistCategorieItem");
                        j.HasIndex(new[] { "IdItem" }, "idItem");
                        j.IndexerProperty<int>("IdCategory")
                            .HasColumnType("int(11)")
                            .HasColumnName("idCategory");
                        j.IndexerProperty<int>("IdItem")
                            .HasColumnType("int(11)")
                            .HasColumnName("idItem");
                    });
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
