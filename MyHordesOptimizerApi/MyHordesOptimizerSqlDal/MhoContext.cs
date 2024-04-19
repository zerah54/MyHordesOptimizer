using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;
using MyHordesOptimizerApi.Models;
using Pomelo.EntityFrameworkCore.MySql.Scaffolding.Internal;
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

    public virtual DbSet<Building> Buildings { get; set; }

    public virtual DbSet<BuildingRessource> BuildingRessources { get; set; }

    public virtual DbSet<Category> Categories { get; set; }

    public virtual DbSet<CauseOfDeath> CauseOfDeaths { get; set; }

    public virtual DbSet<DefaultWishlistItem> DefaultWishlistItems { get; set; }

    public virtual DbSet<Expedition> Expeditions { get; set; }

    public virtual DbSet<ExpeditionBag> ExpeditionBags { get; set; }

    public virtual DbSet<ExpeditionBagItem> ExpeditionBagItems { get; set; }

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

    public virtual DbSet<RuinBlueprint> RuinBlueprints { get; set; }

    public virtual DbSet<RuinComplete> RuinCompletes { get; set; }

    public virtual DbSet<RuinItemDrop> RuinItemDrops { get; set; }

    public virtual DbSet<Town> Towns { get; set; }

    public virtual DbSet<TownBankItem> TownBankItems { get; set; }

    public virtual DbSet<TownCadaver> TownCadavers { get; set; }

    public virtual DbSet<TownCadaverCleanUp> TownCadaverCleanUps { get; set; }

    public virtual DbSet<TownCadaverCleanUpType> TownCadaverCleanUpTypes { get; set; }

    public virtual DbSet<TownCitizen> TownCitizens { get; set; }

    public virtual DbSet<TownCitizenBath> TownCitizenBaths { get; set; }

    public virtual DbSet<TownEstimation> TownEstimations { get; set; }

    public virtual DbSet<TownWishListItem> TownWishListItems { get; set; }

    public virtual DbSet<User> Users { get; set; }

    public virtual DbSet<WishlistCategorie> WishlistCategories { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder
            .UseCollation("utf8mb4_general_ci")
            .HasCharSet("utf8mb4");

        modelBuilder.Entity<Action>(entity =>
        {
            entity.HasKey(e => e.Name).HasName("PRIMARY");
        });

        modelBuilder.Entity<Bag>(entity =>
        {
            entity.HasKey(e => e.IdBag).HasName("PRIMARY");

            entity.HasOne(d => d.IdLastUpdateInfoNavigation).WithMany(p => p.Bags).HasConstraintName("BagItem_fk_lastupdate");
        });

        modelBuilder.Entity<BagItem>(entity =>
        {
            entity.HasKey(e => new { e.IdBag, e.IdItem })
                .HasName("PRIMARY")
                .HasAnnotation("MySql:IndexPrefixLength", new[] { 0, 0 });

            entity.Property(e => e.IsBroken).HasDefaultValueSql("b'0'");

            entity.HasOne(d => d.IdBagNavigation).WithMany(p => p.BagItems)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("BagItem_fk_bag");

            entity.HasOne(d => d.IdItemNavigation).WithMany(p => p.BagItems)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("BagItem_ibfk_1");
        });

        modelBuilder.Entity<Building>(entity =>
        {
            entity.HasKey(e => e.IdBuilding).HasName("PRIMARY");

            entity.Property(e => e.IdBuilding).ValueGeneratedNever();

            entity.HasOne(d => d.IdBuildingParentNavigation).WithMany(p => p.InverseIdBuildingParentNavigation).HasConstraintName("Building_ibfk_1");
        });

        modelBuilder.Entity<BuildingRessource>(entity =>
        {
            entity.HasKey(e => new { e.IdBuilding, e.IdItem })
                .HasName("PRIMARY")
                .HasAnnotation("MySql:IndexPrefixLength", new[] { 0, 0 });

            entity.HasOne(d => d.IdBuildingNavigation).WithMany(p => p.BuildingRessources)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("BuildingRessources_ibfk_1");

            entity.HasOne(d => d.IdItemNavigation).WithMany(p => p.BuildingRessources)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("BuildingRessources_ibfk_2");
        });

        modelBuilder.Entity<Category>(entity =>
        {
            entity.HasKey(e => e.IdCategory).HasName("PRIMARY");
        });

        modelBuilder.Entity<CauseOfDeath>(entity =>
        {
            entity.HasKey(e => e.Dtype).HasName("PRIMARY");

            entity.Property(e => e.Dtype).ValueGeneratedNever();
        });

        modelBuilder.Entity<DefaultWishlistItem>(entity =>
        {
            entity.HasKey(e => new { e.IdDefaultWishlist, e.IdItem })
                .HasName("PRIMARY")
                .HasAnnotation("MySql:IndexPrefixLength", new[] { 0, 0 });

            entity.Property(e => e.Count).HasDefaultValueSql("'0'");
            entity.Property(e => e.Depot).HasDefaultValueSql("b'0'");
            entity.Property(e => e.Priority).HasDefaultValueSql("'0'");
            entity.Property(e => e.ShouldSignal).HasDefaultValueSql("b'0'");
            entity.Property(e => e.ZoneXpa).HasDefaultValueSql("'0'");

            entity.HasOne(d => d.IdItemNavigation).WithMany(p => p.DefaultWishlistItems)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("DefaultWishlistItem_ibfk_1");
        });

        modelBuilder.Entity<Expedition>(entity =>
        {
            entity.HasKey(e => e.IdExpedition).HasName("PRIMARY");

            entity.HasOne(d => d.IdLastUpdateInfoNavigation).WithMany(p => p.Expeditions)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("Expedition_ibfk_2");

            entity.HasOne(d => d.IdTownNavigation).WithMany(p => p.Expeditions)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("Expedition_ibfk_1");
        });

        modelBuilder.Entity<ExpeditionBag>(entity =>
        {
            entity.HasKey(e => e.IdExpeditionBag).HasName("PRIMARY");
        });

        modelBuilder.Entity<ExpeditionBagItem>(entity =>
        {
            entity.HasKey(e => new { e.IdExpeditionBag, e.IdItem })
                .HasName("PRIMARY")
                .HasAnnotation("MySql:IndexPrefixLength", new[] { 0, 0 });

            entity.Property(e => e.IsBroken).HasDefaultValueSql("b'0'");

            entity.HasOne(d => d.IdExpeditionBagNavigation).WithMany(p => p.ExpeditionBagItems).HasConstraintName("ExpeditionBagItem_ibfk_2");

            entity.HasOne(d => d.IdItemNavigation).WithMany(p => p.ExpeditionBagItems)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("ExpeditionBagItem_ibfk_1");
        });

        modelBuilder.Entity<ExpeditionCitizen>(entity =>
        {
            entity.HasKey(e => e.IdExpeditionCitizen).HasName("PRIMARY");

            entity.HasOne(d => d.IdExpeditionBagNavigation).WithMany(p => p.ExpeditionCitizens)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("ExpeditionCitizen_ibfk_4");

            entity.HasOne(d => d.IdExpeditionPartNavigation).WithMany(p => p.ExpeditionCitizens)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("ExpeditionCitizen_ibfk_1");

            entity.HasOne(d => d.IdUserNavigation).WithMany(p => p.ExpeditionCitizens).HasConstraintName("ExpeditionCitizen_ibfk_2");

            entity.HasOne(d => d.PreinscritHeroicNavigation).WithMany(p => p.ExpeditionCitizens).HasConstraintName("ExpeditionCitizen_ibfk_3");
        });

        modelBuilder.Entity<ExpeditionOrder>(entity =>
        {
            entity.HasKey(e => e.IdExpeditionOrder).HasName("PRIMARY");

            entity.HasOne(d => d.IdExpeditionCitizenNavigation).WithMany(p => p.ExpeditionOrders)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("expedition_order_fk_citizen");

            entity.HasMany(d => d.IdExpeditionParts).WithMany(p => p.IdExpeditionOrders)
                .UsingEntity<Dictionary<string, object>>(
                    "ExpeditionPartOrder",
                    r => r.HasOne<ExpeditionPart>().WithMany()
                        .HasForeignKey("IdExpeditionPart")
                        .HasConstraintName("ExpeditionPartOrder_ibfk_2"),
                    l => l.HasOne<ExpeditionOrder>().WithMany()
                        .HasForeignKey("IdExpeditionOrder")
                        .HasConstraintName("ExpeditionPartOrder_ibfk_1"),
                    j =>
                    {
                        j.HasKey("IdExpeditionOrder", "IdExpeditionPart")
                            .HasName("PRIMARY")
                            .HasAnnotation("MySql:IndexPrefixLength", new[] { 0, 0 });
                        j.ToTable("ExpeditionPartOrder");
                        j.HasIndex(new[] { "IdExpeditionPart" }, "ExpeditionPartOrder_ibfk_2");
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

            entity.HasOne(d => d.IdExpeditionNavigation).WithMany(p => p.ExpeditionParts)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("ExpeditionPart_ibfk_1");
        });

        modelBuilder.Entity<HeroSkill>(entity =>
        {
            entity.HasKey(e => e.Name).HasName("PRIMARY");
        });

        modelBuilder.Entity<Item>(entity =>
        {
            entity.HasKey(e => e.IdItem).HasName("PRIMARY");

            entity.Property(e => e.IdItem).ValueGeneratedNever();

            entity.HasOne(d => d.IdCategoryNavigation).WithMany(p => p.Items).HasConstraintName("Item_ibfk_1");

            entity.HasMany(d => d.ActionNames).WithMany(p => p.IdItems)
                .UsingEntity<Dictionary<string, object>>(
                    "ItemAction",
                    r => r.HasOne<Action>().WithMany()
                        .HasForeignKey("ActionName")
                        .OnDelete(DeleteBehavior.ClientSetNull)
                        .HasConstraintName("ItemAction_ibfk_2"),
                    l => l.HasOne<Item>().WithMany()
                        .HasForeignKey("IdItem")
                        .OnDelete(DeleteBehavior.ClientSetNull)
                        .HasConstraintName("ItemAction_ibfk_1"),
                    j =>
                    {
                        j.HasKey("IdItem", "ActionName")
                            .HasName("PRIMARY")
                            .HasAnnotation("MySql:IndexPrefixLength", new[] { 0, 0 });
                        j.ToTable("ItemAction");
                        j.HasIndex(new[] { "ActionName" }, "actionName");
                        j.IndexerProperty<int>("IdItem")
                            .HasColumnType("int(11)")
                            .HasColumnName("idItem");
                        j.IndexerProperty<string>("ActionName")
                            .HasColumnName("actionName")
                            .UseCollation("utf8_general_ci")
                            .HasCharSet("utf8");
                    });

            entity.HasMany(d => d.PropertyNames).WithMany(p => p.IdItems)
                .UsingEntity<Dictionary<string, object>>(
                    "ItemProperty",
                    r => r.HasOne<Property>().WithMany()
                        .HasForeignKey("PropertyName")
                        .OnDelete(DeleteBehavior.ClientSetNull)
                        .HasConstraintName("ItemProperty_ibfk_2"),
                    l => l.HasOne<Item>().WithMany()
                        .HasForeignKey("IdItem")
                        .OnDelete(DeleteBehavior.ClientSetNull)
                        .HasConstraintName("ItemProperty_ibfk_1"),
                    j =>
                    {
                        j.HasKey("IdItem", "PropertyName")
                            .HasName("PRIMARY")
                            .HasAnnotation("MySql:IndexPrefixLength", new[] { 0, 0 });
                        j.ToTable("ItemProperty");
                        j.HasIndex(new[] { "PropertyName" }, "propertyName");
                        j.IndexerProperty<int>("IdItem")
                            .HasColumnType("int(11)")
                            .HasColumnName("idItem");
                        j.IndexerProperty<string>("PropertyName")
                            .HasColumnName("propertyName")
                            .UseCollation("utf8_general_ci")
                            .HasCharSet("utf8");
                    });
        });

        modelBuilder.Entity<ItemComplet>(entity =>
        {
            entity.ToView("ItemComplet");
        });

        modelBuilder.Entity<LastUpdateInfo>(entity =>
        {
            entity.HasKey(e => e.IdLastUpdateInfo).HasName("PRIMARY");

            entity.HasOne(d => d.IdUserNavigation).WithMany(p => p.LastUpdateInfos).HasConstraintName("LastUpdateInfo_ibfk_1");
        });

        modelBuilder.Entity<MapCell>(entity =>
        {
            entity.HasKey(e => e.IdCell).HasName("PRIMARY");

            entity.Property(e => e.IsDryed).HasDefaultValueSql("b'0'");
            entity.Property(e => e.IsNeverVisited).HasDefaultValueSql("b'1'");
            entity.Property(e => e.IsTown).HasDefaultValueSql("b'0'");
            entity.Property(e => e.IsVisitedToday).HasDefaultValueSql("b'0'");

            entity.HasOne(d => d.IdLastUpdateInfoNavigation).WithMany(p => p.MapCells).HasConstraintName("MapCell_ibfk_2");

            entity.HasOne(d => d.IdRuinNavigation).WithMany(p => p.MapCells).HasConstraintName("MapCell_ibfk_3");

            entity.HasOne(d => d.IdTownNavigation).WithMany(p => p.MapCells).HasConstraintName("MapCell_ibfk_1");
        });

        modelBuilder.Entity<MapCellComplet>(entity =>
        {
            entity.ToView("MapCellComplet");

            entity.Property(e => e.IdCell).HasDefaultValueSql("'0'");
            entity.Property(e => e.IsDryed).HasDefaultValueSql("b'0'");
            entity.Property(e => e.IsItemBroken).HasDefaultValueSql("b'0'");
            entity.Property(e => e.IsNeverVisited).HasDefaultValueSql("b'1'");
            entity.Property(e => e.IsTown).HasDefaultValueSql("b'0'");
            entity.Property(e => e.IsVisitedToday).HasDefaultValueSql("b'0'");
        });

        modelBuilder.Entity<MapCellDig>(entity =>
        {
            entity.HasKey(e => new { e.IdCell, e.IdUser, e.Day })
                .HasName("PRIMARY")
                .HasAnnotation("MySql:IndexPrefixLength", new[] { 0, 0, 0 });

            entity.HasOne(d => d.IdCellNavigation).WithMany(p => p.MapCellDigs)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("MapCellDig_ibfk_2");

            entity.HasOne(d => d.IdLastUpdateInfoNavigation).WithMany(p => p.MapCellDigs).HasConstraintName("MapCellDig_ibfk_3");

            entity.HasOne(d => d.IdUserNavigation).WithMany(p => p.MapCellDigs)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("MapCellDig_ibfk_1");
        });

        modelBuilder.Entity<MapCellDigUpdate>(entity =>
        {
            entity.HasKey(e => new { e.IdTown, e.Day })
                .HasName("PRIMARY")
                .HasAnnotation("MySql:IndexPrefixLength", new[] { 0, 0 });

            entity.HasOne(d => d.IdTownNavigation).WithMany(p => p.MapCellDigUpdates)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("MapCellDigUpdate_ibfk_1");
        });

        modelBuilder.Entity<MapCellItem>(entity =>
        {
            entity.HasKey(e => new { e.IdCell, e.IdItem, e.IsBroken })
                .HasName("PRIMARY")
                .HasAnnotation("MySql:IndexPrefixLength", new[] { 0, 0, 0 });

            entity.Property(e => e.IsBroken).HasDefaultValueSql("b'0'");

            entity.HasOne(d => d.IdCellNavigation).WithMany(p => p.MapCellItems)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("MapCellItem_ibfk_2");

            entity.HasOne(d => d.IdItemNavigation).WithMany(p => p.MapCellItems)
                .OnDelete(DeleteBehavior.ClientSetNull)
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
        });

        modelBuilder.Entity<RecipeComplet>(entity =>
        {
            entity.ToView("RecipeComplet");
        });

        modelBuilder.Entity<RecipeItemComponent>(entity =>
        {
            entity.HasKey(e => new { e.RecipeName, e.IdItem })
                .HasName("PRIMARY")
                .HasAnnotation("MySql:IndexPrefixLength", new[] { 0, 0 });

            entity.HasOne(d => d.IdItemNavigation).WithMany(p => p.RecipeItemComponents)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("RecipeItemComponent_ibfk_2");

            entity.HasOne(d => d.RecipeNameNavigation).WithMany(p => p.RecipeItemComponents)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("RecipeItemComponent_ibfk_1");
        });

        modelBuilder.Entity<RecipeItemResult>(entity =>
        {
            entity.HasKey(e => new { e.RecipeName, e.IdItem, e.Probability })
                .HasName("PRIMARY")
                .HasAnnotation("MySql:IndexPrefixLength", new[] { 0, 0, 0 });

            entity.HasOne(d => d.IdItemNavigation).WithMany(p => p.RecipeItemResults)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("RecipeItemResult_ibfk_2");

            entity.HasOne(d => d.RecipeNameNavigation).WithMany(p => p.RecipeItemResults)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("RecipeItemResult_ibfk_1");
        });

        modelBuilder.Entity<Ruin>(entity =>
        {
            entity.HasKey(e => e.IdRuin).HasName("PRIMARY");

            entity.Property(e => e.IdRuin).ValueGeneratedNever();
            entity.Property(e => e.Capacity).HasDefaultValueSql("'100'");
        });

        modelBuilder.Entity<RuinBlueprint>(entity =>
        {
            entity.HasKey(e => new { e.IdRuin, e.IdBuilding })
                .HasName("PRIMARY")
                .HasAnnotation("MySql:IndexPrefixLength", new[] { 0, 0 });

            entity.HasOne(d => d.IdRuinNavigation).WithMany(p => p.RuinBlueprints)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("RuinBlueprint_ibfk_1");
        });

        modelBuilder.Entity<RuinComplete>(entity =>
        {
            entity.ToView("RuinComplete");

            entity.Property(e => e.RuinCapacity).HasDefaultValueSql("'100'");
        });

        modelBuilder.Entity<RuinItemDrop>(entity =>
        {
            entity.HasKey(e => new { e.IdRuin, e.IdItem })
                .HasName("PRIMARY")
                .HasAnnotation("MySql:IndexPrefixLength", new[] { 0, 0 });

            entity.HasOne(d => d.IdItemNavigation).WithMany(p => p.RuinItemDrops)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("RuinItemDrop_ibfk_2");

            entity.HasOne(d => d.IdRuinNavigation).WithMany(p => p.RuinItemDrops).HasConstraintName("RuinItemDrop_ibfk_1");
        });

        modelBuilder.Entity<Town>(entity =>
        {
            entity.HasKey(e => e.IdTown).HasName("PRIMARY");

            entity.Property(e => e.IdTown).ValueGeneratedNever();

            entity.HasOne(d => d.IdUserWishListUpdaterNavigation).WithMany(p => p.Towns).HasConstraintName("Town_fkuserwishlist");
        });

        modelBuilder.Entity<TownBankItem>(entity =>
        {
            entity.HasKey(e => new { e.IdTown, e.IdItem, e.IdLastUpdateInfo, e.IsBroken })
                .HasName("PRIMARY")
                .HasAnnotation("MySql:IndexPrefixLength", new[] { 0, 0, 0, 0 });

            entity.Property(e => e.IsBroken).HasDefaultValueSql("b'0'");

            entity.HasOne(d => d.IdItemNavigation).WithMany(p => p.TownBankItems)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("TownBankItem_ibfk_2");

            entity.HasOne(d => d.IdLastUpdateInfoNavigation).WithMany(p => p.TownBankItems)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("TownBankItem_ibfk_3");

            entity.HasOne(d => d.IdTownNavigation).WithMany(p => p.TownBankItems)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("TownBankItem_ibfk_1");
        });

        modelBuilder.Entity<TownCadaver>(entity =>
        {
            entity.HasKey(e => new { e.IdTown, e.IdUser })
                .HasName("PRIMARY")
                .HasAnnotation("MySql:IndexPrefixLength", new[] { 0, 0 });

            entity.HasOne(d => d.CauseOfDeathNavigation).WithMany(p => p.TownCadavers).HasConstraintName("TownCadaver_ibfk_3");

            entity.HasOne(d => d.CleanUpNavigation).WithMany(p => p.TownCadavers).HasConstraintName("TownCadaver_ibfk_4");

            entity.HasOne(d => d.IdLastUpdateInfoNavigation).WithMany(p => p.TownCadavers).HasConstraintName("TownCadaver_ibfk_2");

            entity.HasOne(d => d.IdTownNavigation).WithMany(p => p.TownCadavers)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("town_cadaver_fk_town");

            entity.HasOne(d => d.IdUserNavigation).WithMany(p => p.TownCadavers)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("TownCadaver_ibfk_1");
        });

        modelBuilder.Entity<TownCadaverCleanUp>(entity =>
        {
            entity.HasKey(e => e.IdCleanUp).HasName("PRIMARY");
        });

        modelBuilder.Entity<TownCadaverCleanUpType>(entity =>
        {
            entity.HasKey(e => e.IdType).HasName("PRIMARY");

            entity.Property(e => e.IdType).ValueGeneratedNever();
        });

        modelBuilder.Entity<TownCitizen>(entity =>
        {
            entity.HasKey(e => new { e.IdTown, e.IdUser, e.IdLastUpdateInfo })
                .HasName("PRIMARY")
                .HasAnnotation("MySql:IndexPrefixLength", new[] { 0, 0, 0 });

            entity.Property(e => e.Apagcharges).HasDefaultValueSql("-1");
            entity.Property(e => e.ChestLevel).HasDefaultValueSql("'0'");
            entity.Property(e => e.Dead).HasDefaultValueSql("b'0'");
            entity.Property(e => e.GhoulVoracity).HasDefaultValueSql("-1");
            entity.Property(e => e.HasLock).HasDefaultValueSql("b'0'");
            entity.Property(e => e.HouseLevel).HasDefaultValueSql("-1");
            entity.Property(e => e.IsShunned).HasDefaultValueSql("b'0'");
            entity.Property(e => e.KitchenLevel).HasDefaultValueSql("-1");
            entity.Property(e => e.LaboLevel).HasDefaultValueSql("-1");
            entity.Property(e => e.RenfortLevel).HasDefaultValueSql("-1");
            entity.Property(e => e.RestLevel).HasDefaultValueSql("-1");

            entity.HasOne(d => d.IdBagNavigation).WithMany(p => p.TownCitizens).HasConstraintName("TownCitizen_ibfk_4");

            entity.HasOne(d => d.IdLastUpdateInfoNavigation).WithMany(p => p.TownCitizenIdLastUpdateInfoNavigations)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("TownCitizen_ibfk_3");

            entity.HasOne(d => d.IdLastUpdateInfoGhoulStatusNavigation).WithMany(p => p.TownCitizenIdLastUpdateInfoGhoulStatusNavigations).HasConstraintName("TownCitizen_ibfk_8");

            entity.HasOne(d => d.IdLastUpdateInfoHeroicActionNavigation).WithMany(p => p.TownCitizenIdLastUpdateInfoHeroicActionNavigations).HasConstraintName("TownCitizen_ibfk_5");

            entity.HasOne(d => d.IdLastUpdateInfoHomeNavigation).WithMany(p => p.TownCitizenIdLastUpdateInfoHomeNavigations).HasConstraintName("TownCitizen_ibfk_6");

            entity.HasOne(d => d.IdLastUpdateInfoStatusNavigation).WithMany(p => p.TownCitizenIdLastUpdateInfoStatusNavigations).HasConstraintName("TownCitizen_ibfk_7");

            entity.HasOne(d => d.IdTownNavigation).WithMany(p => p.TownCitizens)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("TownCitizen_ibfk_1");

            entity.HasOne(d => d.IdUserNavigation).WithMany(p => p.TownCitizens)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("TownCitizen_ibfk_2");
        });

        modelBuilder.Entity<TownCitizenBath>(entity =>
        {
            entity.HasKey(e => new { e.IdTown, e.IdUser, e.IdLastUpdateInfo, e.Day })
                .HasName("PRIMARY")
                .HasAnnotation("MySql:IndexPrefixLength", new[] { 0, 0, 0, 0 });

            entity.HasOne(d => d.IdLastUpdateInfoNavigation).WithMany(p => p.TownCitizenBaths).HasConstraintName("TownCitizenBath_ibfk_3");

            entity.HasOne(d => d.IdTownNavigation).WithMany(p => p.TownCitizenBaths).HasConstraintName("TownCitizenBath_ibfk_1");

            entity.HasOne(d => d.IdUserNavigation).WithMany(p => p.TownCitizenBaths).HasConstraintName("TownCitizenBath_ibfk_2");
        });

        modelBuilder.Entity<TownEstimation>(entity =>
        {
            entity.HasKey(e => new { e.IdTown, e.Day, e.IsPlanif })
                .HasName("PRIMARY")
                .HasAnnotation("MySql:IndexPrefixLength", new[] { 0, 0, 0 });

            entity.HasOne(d => d.IdLastUpdateInfoNavigation).WithMany(p => p.TownEstimations).HasConstraintName("TownEstimation_ibfk_2");

            entity.HasOne(d => d.IdTownNavigation).WithMany(p => p.TownEstimations)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("TownEstimation_ibfk_1");
        });

        modelBuilder.Entity<TownWishListItem>(entity =>
        {
            entity.HasKey(e => new { e.IdTown, e.IdItem, e.ZoneXpa })
                .HasName("PRIMARY")
                .HasAnnotation("MySql:IndexPrefixLength", new[] { 0, 0, 0 });

            entity.Property(e => e.ShouldSignal).HasDefaultValueSql("b'0'");

            entity.HasOne(d => d.IdItemNavigation).WithMany(p => p.TownWishListItems)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("TownWishListItem_ibfk_2");

            entity.HasOne(d => d.IdTownNavigation).WithMany(p => p.TownWishListItems)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("TownWishListItem_ibfk_1");
        });

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.IdUser).HasName("PRIMARY");

            entity.Property(e => e.IdUser).ValueGeneratedNever();
        });

        modelBuilder.Entity<WishlistCategorie>(entity =>
        {
            entity.HasKey(e => e.IdCategory).HasName("PRIMARY");

            entity.HasOne(d => d.IdUserAuthorNavigation).WithMany(p => p.WishlistCategories).HasConstraintName("WishlistCategorie_ibfk_1");

            entity.HasMany(d => d.IdItems).WithMany(p => p.IdCategories)
                .UsingEntity<Dictionary<string, object>>(
                    "WishlistCategorieItem",
                    r => r.HasOne<Item>().WithMany()
                        .HasForeignKey("IdItem")
                        .OnDelete(DeleteBehavior.ClientSetNull)
                        .HasConstraintName("WishlistCategorieItem_ibfk_1"),
                    l => l.HasOne<WishlistCategorie>().WithMany()
                        .HasForeignKey("IdCategory")
                        .OnDelete(DeleteBehavior.ClientSetNull)
                        .HasConstraintName("WishlistCategorieItem_ibfk_2"),
                    j =>
                    {
                        j.HasKey("IdCategory", "IdItem")
                            .HasName("PRIMARY")
                            .HasAnnotation("MySql:IndexPrefixLength", new[] { 0, 0 });
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
