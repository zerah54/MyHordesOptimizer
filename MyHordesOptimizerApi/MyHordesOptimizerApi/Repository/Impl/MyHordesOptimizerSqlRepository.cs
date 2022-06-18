using Dapper;
using MyHordesOptimizerApi.Dtos.MyHordes.MyHordesOptimizer;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Models;
using MyHordesOptimizerApi.Repository.Interfaces;
using System;
using System.Collections.Generic;
using System.Data.SqlClient;

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

        public void PatchItems(List<Item> items)
        {
            using var connection = new SqlConnection(Configuration.ConnectionString);
            connection.Open();
            foreach (var item in items)
            {
                var category = connection.QueryFirst<CategoryModel>(@$"SELECT idCategory AS IdCategory
                                                                    ,name AS Name
                                                                    ,label_fr AS LabelFr
                                                                    ,label_en AS LabelEn
                                                                    ,label_es AS LabelEs
                                                                    ,label_de AS LabelDe
                                                                    ,ordering AS Ordering
                                                                    WHERE name = {item.Category}");
                var hehe = connection.ExecuteScalar<int?>($"SELECT idItem FROM Item where idItem = {item.XmlId}");
                if (hehe.HasValue)
                {
                    connection.Execute($@"UPDATE Item
                                           SET idCategory = {category.IdCategory}
                                              ,uid = {item.JsonIdName}
                                              ,deco = {item.Deco}
                                              ,label_fr = {item.Label["fr"]}
                                              ,label_en = {item.Label["en"]}
                                              ,label_es = {item.Label["es"]}
                                              ,label_de = {item.Label["de"]}
                                              ,description_fr = {item.Description["fr"]}
                                              ,description_en = {item.Description["en"]}
                                              ,description_es = {item.Description["es"]}
                                              ,description_de = {item.Description["de"]}
                                              ,guard = {item.Guard}
                                              ,img = {item.Img}
                                              ,isHeaver = {item.IsHeaver}
                                         WHERE idItem = {item.XmlId}");
                }
                else
                {
                    connection.Execute($@"INSERT INTO Item
                                           (idItem
                                           ,idCategory
                                           ,uid
                                           ,deco
                                           ,label_fr
                                           ,label_en
                                           ,label_es
                                           ,label_de
                                           ,description_fr
                                           ,description_en
                                           ,description_es
                                           ,description_de
                                           ,guard
                                           ,img
                                           ,isHeaver)
                                     VALUES
                                           ({item.XmlId}
                                           ,{category.IdCategory}
                                           ,{item.JsonIdName}
                                           ,{item.Deco}
                                           ,{item.Label["fr"]}
                                           ,{item.Label["en"]}
                                           ,{item.Label["es"]}
                                           ,{item.Label["de"]}
                                           ,{item.Description["fr"]}
                                           ,{item.Description["en"]}
                                           ,{item.Description["es"]}
                                           ,{item.Description["de"]}
                                           ,{item.Guard}
                                           ,{item.Img}
                                           ,{item.IsHeaver}");
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
            foreach(var category in categories)
            {
                var exist = connection.ExecuteScalar<int?>($"SELECT idCategory FROM Category where name = @name", new { category.Name});
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
                    connection.Execute(sql, new { category.Name, category.LabelFr, category.LabelEn, category.LabelEs, category.LabelDe, category.Ordering, category.IdCategory});
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

        #endregion

    }
}
