using Dapper;
using DapperExtensions;
using MyHordesOptimizerApi.Dtos.MyHordes.MyHordesOptimizer;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Models;
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
        public MyHordesOptimizerSqlRepository(IMyHordesOptimizerSqlConfiguration configuration)
        {
            Configuration = configuration;
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

        public void PatchHeroSkill(IEnumerable<HeroSkill> heroSkills)
        {
            throw new NotImplementedException();
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
            var toInsert = new List<ItemModel>();
            var toUpdate = new List<ItemModel>();
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
            throw new NotImplementedException();
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
            throw new NotImplementedException();
        }

        public Dictionary<string, MyHordesOptimizerRuin> GetRuins()
        {
            throw new NotImplementedException();
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

    }
}
