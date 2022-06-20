using AutoMapper;
using Dapper;
using DapperExtensions;
using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.Dtos.MyHordes.MyHordesOptimizer;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Models;
using MyHordesOptimizerApi.Models.Views.Items;
using MyHordesOptimizerApi.Models.Views.Ruins;
using MyHordesOptimizerApi.Repository.Interfaces;
using System;
using System.Collections.Generic;
using System.Data.SqlClient;
using System.Linq;

namespace MyHordesOptimizerApi.Repository.Impl
{
    public class MyHordesOptimizerSqlRepository : IMyHordesOptimizerRepository
    {
        protected IMyHordesOptimizerSqlConfiguration Configuration { get; private set; }
        protected ILogger<MyHordesOptimizerSqlRepository> Logger { get; private set; }
        protected IMapper Mapper { get; private set; }
        public MyHordesOptimizerSqlRepository(IMyHordesOptimizerSqlConfiguration configuration,
            ILogger<MyHordesOptimizerSqlRepository> logger,
            IMapper mapper)
        {
            Configuration = configuration;
            Logger = logger;
            Mapper = mapper;
        }


        #region Town

        public void PatchTown(Town town)
        {
            throw new NotImplementedException();
        }

        public Town GetTown(int townId)
        {
            throw new NotImplementedException();
        }

        #endregion

        #region HeroSkill

        public void PatchHeroSkill(List<HeroSkillsModel> heroSkills)
        {
            using var connection = new SqlConnection(Configuration.ConnectionString);
            connection.Open();
            var existings = connection.Query<HeroSkillsModel>("SELECT * FROM HeroSkills");
            foreach (var skill in heroSkills)
            {
                if (existings.Any(s => s.Name == skill.Name))
                {
                    connection.Update(skill);
                }
                else
                {
                    connection.Insert(skill);
                }
            }
            connection.Close();
        }

        public Dictionary<string, HeroSkill> GetHeroSkills()
        {
            throw new NotImplementedException();
        }


        #endregion

        #region Items

        public void PatchItems(List<ItemModel> items)
        {
            using var connection = new SqlConnection(Configuration.ConnectionString);
            connection.Open();
            var existings = connection.Query<ItemModel>("SELECT * FROM Item");
            foreach (var item in items)
            {
                if (existings.Any(i => i.IdItem == item.IdItem))
                {
                    connection.Update(item);
                }
                else
                {
                    connection.Insert(item);
                }
            }
            connection.Close();
        }

        public List<Item> GetItems()
        {
            using var connection = new SqlConnection(Configuration.ConnectionString);
            connection.Open();
            var itemsComplets = connection.GetList<ItemCompletModel>();
            connection.Close();

            var items = Mapper.Map<List<Item>>(itemsComplets.Distinct(new ItemIdComparer()));
            foreach (var item in items)
            {
                IEnumerable<ItemCompletModel> matchingItemComplet = itemsComplets.Where(i => i.IdItem == item.Id);
                item.Actions = matchingItemComplet.Select(i => i.ActionName).Distinct();
                item.Properties = matchingItemComplet.Select(i => i.PropertyName).Distinct();
            }
            return items;
        }

        public Item GetItemsById(int itemId)
        {
            throw new NotImplementedException();
        }

        #endregion

        #region Recipes

        public void PatchRecipes(List<ItemRecipe> recipes)
        {
            throw new NotImplementedException();
        }

        public Dictionary<string, ItemRecipe> GetRecipes()
        {
            throw new NotImplementedException();
        }

        #endregion

        #region Bank

        public void PutBank(int townId, BankWrapper bank)
        {
            throw new NotImplementedException();
        }

        #endregion

        #region WishList

        public void PutWishList(int townId, WishListWrapper wishList)
        {
            throw new NotImplementedException();
        }

        #endregion

        #region Citizens

        public void PatchCitizen(int townId, CitizensWrapper wrapper)
        {
            throw new NotImplementedException();
        }

        #endregion

        #region Ruins

        public void PatchRuins(List<MyHordesOptimizerRuin> ruins)
        {
            var model = Mapper.Map<List<RuinModel>>(ruins);
            using var connection = new SqlConnection(Configuration.ConnectionString);
            connection.Open();
            var existings = connection.Query<RuinModel>("SELECT * FROM Ruin");
            foreach (var ruin in model)
            {
                if (existings.Any(r => r.IdRuin == ruin.IdRuin))
                {
                    connection.Update(ruin);
                }
                else
                {
                    connection.Insert(ruin);
                }
            }

            connection.Execute("DELETE FROM RuinItemDrop");
            foreach (var ruin in ruins)
            {
                foreach (var drop in ruin.Drops)
                {
                    var exist = connection.ExecuteScalar<string>("SELECT idRuin, idItem FROM RuinItemDrop WHERE idRuin = @IdRuin AND idItem = @IdItem", new { IdRuin = ruin.Id, IdItem = drop.Item.Id });
                    if (exist != null)
                    {
                        var sql = $@"UPDATE RuinItemDrop
                                SET weight = @Weight
                                WHERE probability = @Probability";
                        connection.Execute(sql, new { Weight = drop.Weight, Probability = drop.Probability });
                    }
                    else
                    {
                        connection.Execute($@"INSERT INTO RuinItemDrop
                                           (idRuin
                                           ,idItem
                                           ,weight
                                           ,probability)
                                     VALUES
                                           (@IdRuin
                                           ,@IdItem
                                           ,@Weight
                                           ,@Probability)", new { IdRuin = ruin.Id, IdItem = drop.Item.Id, Weight = drop.Weight, Probability = drop.Probability });
                    }
                }
            }
            connection.Close();
        }

        public List<MyHordesOptimizerRuin> GetRuins()
        {
            var items = GetItems();
            using var connection = new SqlConnection(Configuration.ConnectionString);
            connection.Open();
            var ruinsComplet = connection.GetList<RuinCompletModel>();
            connection.Close();

            var ruins = Mapper.Map<List<MyHordesOptimizerRuin>>(ruinsComplet.Distinct(new RuinIdComparer()));
            foreach (var ruin in ruins)
            {
                IEnumerable<RuinCompletModel> matchingComplet = ruinsComplet.Where(i => i.IdRuin == ruin.Id);
                var dropComplet = matchingComplet.Select(r => new { r.IdItem, r.DropWeight, r.DropProbability });
                foreach(var drop in dropComplet)
                {
                    ruin.Drops.Add(new ItemResult()
                    {
                        Item = items.First(i => i.Id == drop.IdItem),
                        Probability = drop.DropProbability,
                        Weight = drop.DropWeight
                    });
                }
            }
            return ruins;
        }

        #endregion

        #region Categories

        public void PatchCategories(List<CategoryModel> categories)
        {
            using var connection = new SqlConnection(Configuration.ConnectionString);
            connection.Open();
            foreach (var category in categories)
            {
                var exist = connection.ExecuteScalar<int?>($"SELECT idCategory FROM Category where name = @name", new { category.Name });
                if (exist.HasValue)
                {
                    var sql = $@"UPDATE Category
                                SET name = @Name
                                    ,label_fr = @LabelFr
                                    ,label_en = @LabelEn
                                    ,label_es = @LabelEs
                                    ,label_de = @LabelDe
                                    ,ordering = @Ordering
                                WHERE idCategory = @IdCategory";
                    connection.Execute(sql, new { category.Name, category.LabelFr, category.LabelEn, category.LabelEs, category.LabelDe, category.Ordering, category.IdCategory });
                }
                else
                {
                    connection.Execute($@"INSERT INTO Category
                                           (name
                                           ,label_fr
                                           ,label_en
                                           ,label_es
                                           ,label_de
                                           ,ordering)
                                     VALUES
                                           (@Name
                                           ,@LabelFr
                                           ,@LabelEn
                                           ,@LabelEs
                                           ,@LabelDe
                                           ,@Ordering)", new { category.Name, category.LabelFr, category.LabelEn, category.LabelEs, category.LabelDe, category.Ordering });
                }
            }
            connection.Close();
        }

        public IEnumerable<CategoryModel> GetCategories()
        {
            using var connection = new SqlConnection(Configuration.ConnectionString);
            connection.Open();
            var categories = connection.GetList<CategoryModel>();
            connection.Close();
            return categories;
        }

        #endregion

        #region Properties

        public void PatchProperties(List<string> properties)
        {
            using var connection = new SqlConnection(Configuration.ConnectionString);
            connection.Open();
            foreach (var propertie in properties)
            {
                var exist = connection.ExecuteScalar<string>("SELECT name FROM Property WHERE name = @Name", new { Name = propertie });
                if (exist != null)
                {
                    var sql = $@"UPDATE Property
                                SET name = @Name
                                WHERE name = @Name";
                    connection.Execute(sql, new { Name = propertie });
                }
                else
                {
                    connection.Execute($@"INSERT INTO Property
                                           (name)
                                     VALUES
                                           (@Name)", new { Name = propertie });
                }
            }
            connection.Close();
        }

        public void DeleteAllPropertiesItem()
        {
            using var connection = new SqlConnection(Configuration.ConnectionString);
            connection.Open();
            connection.Execute("DELETE FROM ItemProperty");
            connection.Close();
        }

        public void PatchPropertiesItem(string itemUid, List<string> properties)
        {
            using var connection = new SqlConnection(Configuration.ConnectionString);
            connection.Open();
            try
            {
                var existingItem = connection.QuerySingle<ItemModel>($@"SELECT * FROM Item WHERE uid = @itemUid", new { itemUid });
                foreach (var propertie in properties)
                {
                    var exist = connection.ExecuteScalar<int>("SELECT  count(*) FROM ItemProperty WHERE idItem = @idItem AND propertyName = @propertyName", new { idItem = existingItem.IdItem, propertyName = propertie });
                    if (exist == 0)
                    {
                        connection.Execute($@"INSERT INTO ItemProperty
                                           (idItem
                                           ,propertyName)
                                     VALUES
                                           (@idItem
                                            ,@propertyName)", new { idItem = existingItem.IdItem, propertyName = propertie });
                    }
                }
            }
            catch (Exception e)
            {
                Logger.LogError($@"{e}{Environment.NewLine}{itemUid}", e);
            }
            connection.Close();
        }

        #endregion

        #region Actions


        public void PatchActions(List<string> allActions)
        {
            using var connection = new SqlConnection(Configuration.ConnectionString);
            connection.Open();
            foreach (var action in allActions)
            {
                var exist = connection.ExecuteScalar<string>("SELECT name FROM Action WHERE name = @Name", new { Name = action });
                if (exist != null)
                {
                    var sql = $@"UPDATE Action
                                SET name = @Name
                                WHERE name = @Name";
                    connection.Execute(sql, new { Name = action });
                }
                else
                {
                    connection.Execute($@"INSERT INTO Action
                                           (name)
                                     VALUES
                                           (@Name)", new { Name = action });
                }
            }
            connection.Close();
        }

        public void DeleteAllActionsItem()
        {
            using var connection = new SqlConnection(Configuration.ConnectionString);
            connection.Open();
            connection.Execute("DELETE FROM ItemAction");
            connection.Close();
        }

        public void PatchActionsItem(string itemUid, List<string> actions)
        {
            using var connection = new SqlConnection(Configuration.ConnectionString);
            connection.Open();
            try
            {
                var existingItem = connection.QuerySingle<ItemModel>($@"SELECT * FROM Item WHERE uid = @itemUid", new { itemUid });
                foreach (var action in actions)
                {
                    var exist = connection.ExecuteScalar<int>("SELECT  count(*) FROM ItemAction WHERE idItem = @idItem AND actionName = @actionName", new { idItem = existingItem.IdItem, actionName = action });
                    if (exist == 0)
                    {
                        connection.Execute($@"INSERT INTO ItemAction
                                           (idItem
                                           ,actionName)
                                     VALUES
                                           (@idItem
                                            ,@actionName)", new { idItem = existingItem.IdItem, actionName = action });
                    }
                }
            }
            catch (Exception e)
            {
                Logger.LogError($@"{e}{Environment.NewLine}{itemUid}", e);
            }
            connection.Close();
        }

        #endregion
    }
}
