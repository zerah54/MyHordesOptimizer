using AutoMapper;
using Dapper;
using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.Dtos.MyHordes.MyHordesOptimizer;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Citizens;
using MyHordesOptimizerApi.Extensions;
using MyHordesOptimizerApi.Models;
using MyHordesOptimizerApi.Models.Citizen;
using MyHordesOptimizerApi.Models.Citizen.Bags;
using MyHordesOptimizerApi.Models.Estimations;
using MyHordesOptimizerApi.Models.Map;
using MyHordesOptimizerApi.Models.Views.Citizens;
using MyHordesOptimizerApi.Models.Views.Items;
using MyHordesOptimizerApi.Models.Views.Items.Bank;
using MyHordesOptimizerApi.Models.Views.Items.Citizen;
using MyHordesOptimizerApi.Models.Views.Items.Wishlist;
using MyHordesOptimizerApi.Models.Views.Recipes;
using MyHordesOptimizerApi.Models.Views.Ruins;
using MyHordesOptimizerApi.Models.Wishlist;
using MyHordesOptimizerApi.Repository.Interfaces;
using MySqlConnector;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Text;

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

        public void PatchTown(TownModel town)
        {
            using var connection = new MySqlConnection(Configuration.ConnectionString);
            connection.Open();
            connection.InsertOrUpdate("Town", town, ignoreNullOnUpdate: true);
            connection.Close();
        }

        public TownModel GetTownModel(int townId)
        {
            using var connection = new MySqlConnection(Configuration.ConnectionString);
            connection.Open();
            var town = connection.QuerySingleOrDefault<TownModel>("SELECT * FROM Town WHERE idTown = @idTown", new { idTown = townId });
            connection.Close();
            return town;
        }

        public Town GetTown(int townId)
        {
            var town = new Town()
            {
                Id = townId
            };
            town.Citizens = GetCitizens(townId);
            town.Bank = GetBank(townId);
            town.WishList = GetWishList(townId);
            return town;
        }

        #endregion

        #region HeroSkill

        public void PatchHeroSkill(IEnumerable<HeroSkillsModel> heroSkills)
        {
            using var connection = new MySqlConnection(Configuration.ConnectionString);
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

        public IEnumerable<HeroSkill> GetHeroSkills()
        {
            using var connection = new MySqlConnection(Configuration.ConnectionString);
            connection.Open();
            var models = connection.Query<HeroSkillsModel>(@"SELECT name
                                                              ,daysNeeded
                                                              ,description_fr AS DescriptionFr
                                                              ,description_en AS DescriptionEn
                                                              ,description_es AS DescriptionEs
                                                              ,description_de AS DescriptionDe
                                                              ,icon
                                                              ,label_fr AS LabelFr
                                                              ,label_en AS LabelEn
                                                              ,label_es AS LabelEs
                                                              ,label_de AS LabelDe
                                                              ,nbUses
                                                          FROM HeroSkills");
            connection.Close();
            var heroSkills = Mapper.Map<IEnumerable<HeroSkill>>(models);
            return heroSkills;
        }


        #endregion

        #region CauseOfDeath

        public void PatchCauseOfDeath(IEnumerable<CauseOfDeathModel> causesOfDeath)
        {
            using var connection = new MySqlConnection(Configuration.ConnectionString);
            connection.Open();
            var existings = connection.Query<CauseOfDeathModel>("SELECT * FROM CauseOfDeath");
            foreach (var cause in causesOfDeath)
            {
                if (existings.Any(s => s.Dtype == cause.Dtype))
                {
                    connection.Update(cause);
                }
                else
                {
                    connection.Insert(cause);
                }
            }
            connection.Close();
        }

        public IEnumerable<CauseOfDeath> GetCausesOfDeath()
        {
            using var connection = new MySqlConnection(Configuration.ConnectionString);
            connection.Open();
            var models = connection.Query<CauseOfDeathModel>(@"SELECT dtype
                                                              ,ref
                                                              ,description_fr AS DescriptionFr
                                                              ,description_en AS DescriptionEn
                                                              ,description_es AS DescriptionEs
                                                              ,description_de AS DescriptionDe
                                                              ,icon
                                                              ,label_fr AS LabelFr
                                                              ,label_en AS LabelEn
                                                              ,label_es AS LabelEs
                                                              ,label_de AS LabelDe
                                                          FROM CauseOfDeath");
            connection.Close();
            var causesOfDeath = Mapper.Map<IEnumerable<CauseOfDeath>>(models);
            return causesOfDeath;
        }


        #endregion

        #region CleanUp

        public void PatchCleanUpType(IEnumerable<CleanUpTypeModel> cleanUpTypes)
        {
            using var connection = new MySqlConnection(Configuration.ConnectionString);
            connection.Open();
            var existings = connection.Query<CleanUpTypeModel>("SELECT * FROM TownCadaverCleanUpType");
            foreach (var type in cleanUpTypes)
            {
                if (existings.Any(s => s.IdType == type.IdType))
                {
                    connection.Update(type);
                }
                else
                {
                    connection.Insert(type);
                }
            }
            connection.Close();
        }

        public IEnumerable<CleanUpType> GetCleanUpTypes()
        {
            using var connection = new MySqlConnection(Configuration.ConnectionString);
            connection.Open();
            var models = connection.Query<CleanUpTypeModel>(@"SELECT idType
                                                              ,typeName
                                                              ,myHordesApiName
                                                          FROM TownCadaverCleanUpType");
            connection.Close();
            var cleanUpTypes = Mapper.Map<IEnumerable<CleanUpType>>(models);
            return cleanUpTypes;
        }

        public IEnumerable<CleanUp> GetCleanUps()
        {
            using var connection = new MySqlConnection(Configuration.ConnectionString);
            connection.Open();
            var models = connection.Query<CleanUpTypeModel>(@"SELECT idCleanUp
                                                              ,idCleanUpType
                                                              ,idUserCleanUp
                                                          FROM TownCadaverCleanUp");
            connection.Close();
            var cleanUps = Mapper.Map<IEnumerable<CleanUp>>(models);
            return cleanUps;
        }

        #endregion

        #region Items

        public void PatchItems(IEnumerable<ItemModel> items)
        {
            using var connection = new MySqlConnection(Configuration.ConnectionString);
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

        public IEnumerable<Item> GetItems()
        {
            using var connection = new MySqlConnection(Configuration.ConnectionString);
            connection.Open();
            var itemsComplets = connection.Query<ItemCompletModel>(@"SELECT idItem
                                                                  ,idCategory
                                                                  ,itemUid
                                                                  ,itemDeco
                                                                  ,itemLabel_fr AS ItemLabelFr
                                                                  ,itemLabel_en AS ItemLabelEn
                                                                  ,itemLabel_es AS ItemLabelEs
                                                                  ,itemLabel_de AS ItemLabelDe
                                                                  ,itemDescription_fr AS ItemDescriptionFr
                                                                  ,itemDescription_en AS ItemDescriptionEn
                                                                  ,itemDescription_es AS ItemDescriptionEs
                                                                  ,itemDescription_de AS ItemDescriptionDe
                                                                  ,itemGuard
                                                                  ,itemImg
                                                                  ,itemIsHeaver
                                                                  ,itemDropRate_praf AS ItemDropRatePraf
                                                                  ,itemDropRate_notPraf AS ItemDropRateNotPraf
                                                                  ,catName
                                                                  ,catOrdering
                                                                  ,catLabel_fr AS CatLabelFr
                                                                  ,catLabel_en AS CatLabelEn
                                                                  ,catLabel_es AS CatLabelEs
                                                                  ,catLabel_de AS CatLabelDe
                                                                  ,actionName
                                                                  ,propertyName
                                                                  ,dropRate_praf AS DropRatePraf
                                                                  ,dropRate_notPraf AS DropRateNotPraf
                                                              FROM ItemComplet");
            connection.Close();

            var items = Mapper.Map<IEnumerable<Item>>(itemsComplets.Distinct(new ItemIdComparer()));
            foreach (var item in items)
            {
                IEnumerable<ItemCompletModel> matchingItemComplet = itemsComplets.Where(i => i.IdItem == item.Id);
                item.Actions = matchingItemComplet.Where(i => !string.IsNullOrEmpty(i.ActionName)).Select(i => i.ActionName).Distinct();
                item.Properties = matchingItemComplet.Where(i => !string.IsNullOrEmpty(i.PropertyName)).Select(i => i.PropertyName).Distinct();
            }
            return items;
        }

        #endregion

        #region Recipes

        public void PatchRecipes(IEnumerable<RecipeModel> recipes)
        {
            using var connection = new MySqlConnection(Configuration.ConnectionString);
            connection.Open();
            var existings = connection.Query<RecipeModel>("SELECT * FROM Recipe");
            foreach (var recipe in recipes)
            {
                if (existings.Any(r => r.Name == recipe.Name))
                {
                    connection.Update(recipe);
                }
                else
                {
                    connection.Insert(recipe);
                }
            }
            connection.Close();
        }

        public void DeleteAllRecipeComponents()
        {
            using var connection = new MySqlConnection(Configuration.ConnectionString);
            connection.Open();
            connection.Execute("DELETE FROM RecipeItemComponent");
            connection.Close();
        }

        public void DeleteAllRecipeResults()
        {
            using var connection = new MySqlConnection(Configuration.ConnectionString);
            connection.Open();
            connection.Execute("DELETE FROM RecipeItemResult");
            connection.Close();
        }

        public void PatchRecipeComponents(string recipeName, IEnumerable<string> componentUids)
        {
            using var connection = new MySqlConnection(Configuration.ConnectionString);
            connection.Open();
            var grouping = componentUids.GroupBy(x => x).Select(x => new { Count = x.Count(), Uid = x.Key });
            foreach (var group in grouping)
            {
                var existingItem = connection.QuerySingle<ItemModel>($@"SELECT * FROM Item WHERE uid = @ItemUid", new { ItemUid = group.Uid });
                var exist = connection.ExecuteScalar<int>("SELECT  count(*) FROM RecipeItemComponent WHERE idItem = @IdItem AND recipeName = @RecipeName", new { IdItem = existingItem.IdItem, RecipeName = recipeName });
                if (exist == 0)
                {
                    connection.Execute($@"INSERT INTO RecipeItemComponent
                                           (idItem
                                           ,recipeName
                                           ,count)
                                     VALUES
                                           (@IdItem
                                            ,@RecipeName
                                            ,@Count)", new { IdItem = existingItem.IdItem, RecipeName = recipeName, Count = group.Count });
                }
            }
            connection.Close();
        }

        public void PatchRecipeResults(IEnumerable<RecipeItemResultModel> results)
        {
            using var connection = new MySqlConnection(Configuration.ConnectionString);
            connection.Open();
            foreach (var result in results)
            {
                var existingItem = connection.QuerySingle<ItemModel>($@"SELECT * FROM Item WHERE idItem = @IdItem", new { IdItem = result.IdItem });
                var exist = connection.ExecuteScalar<int>("SELECT  count(*) FROM RecipeItemResult WHERE idItem = @IdItem AND recipeName = @RecipeName", new { IdItem = existingItem.IdItem, RecipeName = result.RecipeName });
                if (exist == 0)
                {
                    connection.Execute($@"INSERT INTO RecipeItemResult
                                           (idItem
                                           ,recipeName
                                           ,weight
                                           ,probability)
                                     VALUES
                                           (@IdItem
                                            ,@RecipeName
                                            ,@Weight
                                            ,@Probability)", new { IdItem = existingItem.IdItem, RecipeName = result.RecipeName, Weight = result.Weight, Probability = result.Probability });
                }
            }
            connection.Close();
        }

        public IEnumerable<ItemRecipe> GetRecipes()
        {
            var items = GetItems();
            using var connection = new MySqlConnection(Configuration.ConnectionString);
            connection.Open();
            var recipeCompletModels = connection.Query<RecipeCompletModel>("SELECT * FROM RecipeComplet");
            connection.Close();

            var recipes = Mapper.Map<IEnumerable<ItemRecipe>>(recipeCompletModels.Distinct(new RecipeNameComparer()));
            foreach (var recipe in recipes)
            {
                IEnumerable<RecipeCompletModel> matchingComplet = recipeCompletModels.Where(r => r.RecipeName == recipe.Name);
                recipe.Components = items.Aggregate(new List<Item>(), (acc, item) =>
                {
                    var originalRecipeItemModels = matchingComplet.Where(x => x.ComponentItemId == item.Id);
                    if (originalRecipeItemModels != null && originalRecipeItemModels.Any())
                    {
                        var originalRecipeItemModel = originalRecipeItemModels.First();
                        for (int i = 0; i < originalRecipeItemModel.ComponentCount; i++)
                        {
                            acc.Add(item);
                        }
                    }

                    return acc;
                });

                var resultsAsItems = items.Where(i => matchingComplet.Any(x => x.ResultItemId == i.Id)).Distinct();
                var itemResults = matchingComplet.Where(x => resultsAsItems.Any(i => i.Id == x.ResultItemId)).Distinct(new RecipeCompletModel_ResultItemEqualityComparer()).Select(x => new ItemResult()
                {
                    Item = items.First(i => i.Id == x.ResultItemId),
                    Probability = x.ResultProbability,
                    Weight = x.ResultWeight
                }).ToList();
                recipe.Result = itemResults;
            }
            return recipes;
        }

        #endregion

        #region Bank

        public void PutBank(int townId, BankWrapper bank)
        {
            var sw = new Stopwatch();
            sw.Start();
            using var connection = new MySqlConnection(Configuration.ConnectionString);
            connection.Open();

            var lastUpdateInfo = Mapper.Map<LastUpdateInfoModel>(bank.LastUpdateInfo);
            var idLastUpdateInfo = connection.ExecuteScalar<int>(@"INSERT INTO LastUpdateInfo(dateUpdate, idUser)
                                                                   VALUES (@DateUpdate, @IdUser); SELECT LAST_INSERT_ID()", new { DateUpdate = lastUpdateInfo.DateUpdate, IdUser = lastUpdateInfo.IdUser });
            Logger.LogTrace($"[PutBank] Insert LastUpdate : {sw.ElapsedMilliseconds}");

            var townBankItemModels = Mapper.Map<IEnumerable<TownBankItemModel>>(bank.Bank).ToList();
            townBankItemModels.ForEach(x => { x.IdTown = townId; x.IdLastUpdateInfo = idLastUpdateInfo; });
            Logger.LogTrace($"[PutBank] Automapper TownBankItemModel : {sw.ElapsedMilliseconds}");
            connection.BulkInsert("TownBankItem", townBankItemModels);
            connection.ExecuteScalar("DELETE FROM TownBankItem WHERE idTown = @IdTown AND idLastUpdateInfo != @IdLastUpdateInfo", new { IdTown = townId, IdLastUpdateInfo = idLastUpdateInfo });
            connection.Close();
            Logger.LogTrace($"[PutBank] Insert TownBankItem : {sw.ElapsedMilliseconds}");
            sw.Stop();
        }

        public BankWrapper GetBank(int townId)
        {
            var query = @$"SELECT idTown AS TownId
                                 ,item.idItem AS ItemId
                                 ,item.uid AS ItemUid
								 ,item.deco AS ItemDeco
							     ,item.label_fr AS ItemLabelFr
							     ,item.label_en AS ItemLabelEn
							     ,item.label_es AS ItemLabelEs
							     ,item.label_de AS ItemLabelDe
							     ,item.description_fr AS ItemDescriptionFr
							     ,item.description_en AS ItemDescriptionEn
							     ,item.description_es AS ItemDescriptionEs
							     ,item.description_de AS ItemDescriptionDe
							     ,item.guard AS ItemGuard
							     ,item.img AS ItemImg
							     ,item.isHeaver AS ItemIsHeaver
							     ,category.idCategory AS CategoryId
							     ,category.label_fr AS CategoryLabelFr
							     ,category.label_en AS CategoryLabelEn
							     ,category.label_es AS CategoryLabelEs
							     ,category.label_de AS CategoryLabelDe
							     ,category.name AS CategoryName
							     ,category.ordering AS CategoryOrdering
							     ,itemAction.actionName AS ActionName
							     ,itemProperty.propertyName AS PropertyName
                                 ,tb.count AS BankCount
				                 ,tb.isBroken AS BankIsBroken
                                 ,tb.idLastUpdateInfo AS LastUpdateInfoId
	                             ,lui.idUser AS LastUpdateInfoUserId
	                             ,lui.dateUpdate AS LastUpdateDateUpdate
	                             ,userUpdater.name AS LastUpdateInfoUserName
                              FROM TownBankItem tb
                              LEFT JOIN Item item ON item.idItem = tb.idItem
                              LEFT JOIN Category category ON category.idCategory = item.idCategory
                              LEFT JOIN ItemAction itemAction ON itemAction.idItem = item.idItem
                              LEFT JOIN ItemProperty itemProperty ON itemProperty.idItem = item.idItem
                              LEFT JOIN LastUpdateInfo lui ON lui.idLastUpdateInfo = tb.idLastUpdateInfo
                              LEFT JOIN Users userUpdater ON userUpdater.idUser = lui.idUser
                              WHERE tb.idTown = @idTown";
            using var connection = new MySqlConnection(Configuration.ConnectionString);
            var townBankItem = connection.Query<BankItemCompletModel>(query, new { idTown = townId });
            connection.Close();

            if (!townBankItem.Any())
            {
                return new BankWrapper();
            }
            var mostRecent = townBankItem.Max(x => x.LastUpdateDateUpdate);
            townBankItem = townBankItem.Where(x => x.LastUpdateDateUpdate == mostRecent);
            var group = townBankItem.GroupBy(x => new BankItemCompletKeyModel(x)).ToList();

            var banksItems = Mapper.Map<IEnumerable<BankItem>>(group).ToList();
            banksItems.ForEach(bankItemComplet =>
            {
                IEnumerable<BankItemCompletModel> bankItemCompletAssocie = townBankItem.Where(x => x.ItemId == bankItemComplet.Item.Id && x.BankIsBroken == bankItemComplet.IsBroken);
                var item = Mapper.Map<Item>(bankItemCompletAssocie.First());
                item.Properties = new List<string>(bankItemCompletAssocie.Select(x => x.PropertyName).Distinct());
                item.Actions = new List<string>(bankItemCompletAssocie.Select(x => x.ActionName).Distinct());
                bankItemComplet.Item = item;
            });
            var bankWrapper = new BankWrapper()
            {
                LastUpdateInfo = Mapper.Map<LastUpdateInfo>(townBankItem.First()),
                Bank = banksItems
            };
            return bankWrapper;
        }

        #endregion

        #region WishList

        public void AddItemToWishlist(int townId, int itemId, int userId, int zoneXPa)
        {
            var query = @"CALL AddItemToWishList(@TownId, @UserId, @ItemId, @ZoneXPa, @DateUpdate)";
            using var connection = new MySqlConnection(Configuration.ConnectionString);
            connection.Open();
            connection.Execute(query, new { TownId = townId, UserId = userId, ItemId = itemId, ZoneXPa = zoneXPa, DateUpdate = DateTime.UtcNow });
            connection.Close();
        }

        public void PutWishList(int townId, int userId, IEnumerable<TownWishlistItemModel> items)
        {
            var models = items.ToList();
            models.ForEach(x => x.IdTown = townId);
            var updateTownQuery = @"UPDATE Town SET idUserWishListUpdater = @UserId, wishlistDateUpdate = @DateUpdate WHERE idTown = @TownId;";
            var cleanWishListQuery = @"DELETE FROM TownWishListItem WHERE idTown = @TownId;";
            using var connection = new MySqlConnection(Configuration.ConnectionString);
            connection.Open();
            connection.Execute(updateTownQuery, new { UserId = userId, DateUpdate = DateTime.UtcNow, TownId = townId });
            connection.Execute(cleanWishListQuery, new { TownId = townId });
            connection.BulkInsert(tableName: "TownWishListItem", models: models);
            connection.Close();
        }

        public WishListWrapper GetWishList(int townId)
        {
            var query = @"SELECT twi.idTown AS TownId
                                 ,item.idItem AS ItemId
                                 ,item.uid AS ItemUid
								 ,item.deco AS ItemDeco
							     ,item.label_fr AS ItemLabelFr
							     ,item.label_en AS ItemLabelEn
							     ,item.label_es AS ItemLabelEs
							     ,item.label_de AS ItemLabelDe
							     ,item.description_fr AS ItemDescriptionFr
							     ,item.description_en AS ItemDescriptionEn
							     ,item.description_es AS ItemDescriptionEs
							     ,item.description_de AS ItemDescriptionDe
							     ,item.guard AS ItemGuard
							     ,item.img AS ItemImg
							     ,item.isHeaver AS ItemIsHeaver
							     ,category.idCategory AS CategoryId
							     ,category.label_fr AS CategoryLabelFr
							     ,category.label_en AS CategoryLabelEn
							     ,category.label_es AS CategoryLabelEs
							     ,category.label_de AS CategoryLabelDe
							     ,category.name AS CategoryName
							     ,category.ordering AS CategoryOrdering
							     ,itemAction.actionName AS ActionName
							     ,itemProperty.propertyName AS PropertyName
                                 ,twi.count AS WishlistCount
				                 ,twi.priority AS WishlistPriority
                                 ,twi.zoneXPa AS WishlistZoneXPa
                                 ,twi.depot AS WishlistDepot
                                 ,twi.shouldSignal AS WishlistShouldSignal
	                             ,t.idUserWishListUpdater AS LastUpdateInfoUserId
	                             ,t.wishlistDateUpdate AS LastUpdateDateUpdate
	                             ,userUpdater.name AS LastUpdateInfoUserName
                              FROM TownWishListItem twi
                              LEFT JOIN Item item ON item.idItem = twi.idItem
                              LEFT JOIN Category category ON category.idCategory = item.idCategory
                              LEFT JOIN ItemAction itemAction ON itemAction.idItem = item.idItem
                              LEFT JOIN ItemProperty itemProperty ON itemProperty.idItem = item.idItem
                              LEFT JOIN Town t ON t.idTown = twi.idTown
                              LEFT JOIN Users userUpdater ON userUpdater.idUser = t.idUserWishListUpdater
                              WHERE twi.idTown = @TownId";

            using var connection = new MySqlConnection(Configuration.ConnectionString);
            var townWishlistItem = connection.Query<TownWishlistItemCompletModel>(query, new { TownId = townId });
            var group = townWishlistItem.GroupBy(x => new TownWishlistItemCompletKeyModel(x)).ToList();
            connection.Close();

            var wishListItem = Mapper.Map<IEnumerable<WishListItem>>(group).ToList();
            wishListItem.ForEach(wishListItemComplet =>
            {
                IEnumerable<TownWishlistItemCompletModel> wishListItemCompletAssocie = townWishlistItem.Where(x => x.ItemId == wishListItemComplet.Item.Id);
                var item = Mapper.Map<Item>(wishListItemCompletAssocie.First());
                item.Properties = new List<string>(wishListItemCompletAssocie.Select(x => x.PropertyName).Distinct());
                item.Actions = new List<string>(wishListItemCompletAssocie.Select(x => x.ActionName).Distinct());
                wishListItemComplet.Item = item;
            });
            var wishlistWrapper = new WishListWrapper()
            {
                LastUpdateInfo = Mapper.Map<LastUpdateInfo>(townWishlistItem.FirstOrDefault()),
                WishList = wishListItem.GroupBy(x => x.ZoneXPa).ToDictionary(g => g.Key, g => g.ToList())
            };
            return wishlistWrapper;
        }

        public void PatchWishlistCategories(List<WishlistCategorieModel> categories)
        {
            using var connection = new MySqlConnection(Configuration.ConnectionString);
            connection.Open();
            connection.BulkInsertOrUpdate("WishlistCategorie", categories);
            connection.Close();
        }

        public void PatchWishlistItemCategories(List<WishlistCategorieItemModel> itemsCategorie)
        {
            using var connection = new MySqlConnection(Configuration.ConnectionString);
            connection.Open();
            connection.BulkInsertOrUpdate("WishlistCategorieItem", itemsCategorie);
            connection.Close();
        }

        public IEnumerable<WishlistCategorieCompletModel> GetWishListCategories()
        {
            using var connection = new MySqlConnection(Configuration.ConnectionString);
            connection.Open();
            var modeles = connection.Query<WishlistCategorieCompletModel>(@"SELECT wc.idCategory
                                                                            ,wc.idUserAuthor
                                                                            ,wc.name
                                                                            ,wc.label_fr AS LabelFr
                                                                            ,wc.label_en AS LabelEn
                                                                            ,wc.label_es AS LabelEs
                                                                            ,wc.label_de AS LabelDe
                                                                            ,wci.idItem
                                                                            FROM WishlistCategorie wc
                                                                            RIGHT JOIN WishlistCategorieItem wci ON wc.idCategory = wci.idCategory");
            connection.Close();
            return modeles;
        }

        public void PatchDefaultWishlistItems(List<DefaultWishlistItemModel> modeles)
        {
            using var connection = new MySqlConnection(Configuration.ConnectionString);
            connection.Open();
            connection.BulkInsertOrUpdate("DefaultWishlistItem", modeles);
            connection.Close();
        }

        public IEnumerable<DefaultWishlistItemModel> GetWishListTemplate(int templateId)
        {
            using var connection = new MySqlConnection(Configuration.ConnectionString);
            connection.Open();
            var itemTemplates = connection.Query<DefaultWishlistItemModel>(@"SELECT * FROM DefaultWishlistItem WHERE idDefaultWishlist = @templateId", new { TemplateId = templateId });
            connection.Close();
            return itemTemplates;
        }

        public IEnumerable<DefaultWishlistItemModel> GetWishListTemplates()
        {
            using var connection = new MySqlConnection(Configuration.ConnectionString);
            connection.Open();
            var itemTemplates = connection.Query<DefaultWishlistItemModel>(@"SELECT idDefaultWishlist
                                                                            ,idUserAuthor
                                                                            ,name
                                                                            ,label_fr AS LabelFr
                                                                            ,label_en AS LabelEn
                                                                            ,label_es AS LabelEs
                                                                            ,label_de AS LabelDe
                                                                            ,idItem
                                                                            ,count
                                                                            ,priority
                                                                            ,depot
                                                                            ,shouldSignal
                                                                            ,zoneXPa
                                                                            FROM DefaultWishlistItem");
            connection.Close();
            return itemTemplates;
        }

        #endregion

        #region Citizens

        public void PatchCitizen(int townId, CitizensWrapper wrapper)
        {
            using var connection = new MySqlConnection(Configuration.ConnectionString);
            connection.Open();
            var userIds = wrapper.Citizens.Select(x => x.Id).ToList();
            var existingUsers = connection.Query<UsersModel>("SELECT * FROM Users WHERE idUser IN @UserIds", new { UserIds = userIds });
            //  var insertBuilder = new StringBuilder("INSERT INTO User(idUser,name,userKey) VALUES ");
            foreach (var citizen in wrapper.Citizens)
            {
                var userModel = Mapper.Map<UsersModel>(citizen);
                var existingUser = existingUsers.FirstOrDefault(x => x.IdUser == citizen.Id);
                if (existingUser != null && existingUser.Name != citizen.Name)
                {
                    // On devrait pas souvent faire des updates, alors on est pas obliger de bulk
                    connection.Execute("UPDATE Users SET name = @Name WHERE idUser = @UserId", new { Name = userModel.Name, UserId = userModel.IdUser });
                }
                else if (existingUser == null)
                {
                    connection.Insert(userModel);
                }
            }
            var lastUpdateInfo = Mapper.Map<LastUpdateInfoModel>(wrapper.LastUpdateInfo);
            var idLastUpdateInfo = connection.ExecuteScalar<int>(@"INSERT INTO LastUpdateInfo(dateUpdate, idUser)
                                                                   VALUES (@DateUpdate, @IdUser); SELECT LAST_INSERT_ID()", new { DateUpdate = lastUpdateInfo.DateUpdate, IdUser = lastUpdateInfo.IdUser });

            var townCitizenModels = Mapper.Map<IEnumerable<TownCitizenModel>>(wrapper.Citizens).ToList();
            townCitizenModels.ForEach(x => { x.IdTown = townId; x.IdLastUpdateInfo = idLastUpdateInfo; });

            var existings = connection.Query("SELECT idUser, idBag FROM TownCitizen WHERE idTown = @IdTown", new { IdTown = townId });

            var townCitizenModelsToInsert = townCitizenModels.Where(x => !existings.Any(existing => existing.idUser == x.IdUser)).ToList();
            connection.BulkInsert("TownCitizen", townCitizenModelsToInsert);

            var townCitizenModelsToUpdate = townCitizenModels.Where(x => existings.Any(existing => existing.idUser == x.IdUser)).ToList();
            foreach (var citizenToUpdate in townCitizenModelsToUpdate)
            {
                citizenToUpdate.IdBag = existings.Single(existing => existing.idUser == citizenToUpdate.IdUser).idBag;
                connection.Execute(@"UPDATE TownCitizen 
                                     SET HomeMessage = @HomeMessage, JobName = @JobName, JobUID = @JobUID, Avatar = @Avatar, PositionX = @PositionX, PositionY = @PositionY, IsGhost = @IsGhost, Dead = @Dead, IdLastUpdateInfo = @IdLastUpdateInfo 
                                     WHERE IdTown = @IdTown AND IdUser = @IdUser", new { HomeMessage = citizenToUpdate.HomeMessage, JobName = citizenToUpdate.JobName, JobUID = citizenToUpdate.JobUID, Avatar = citizenToUpdate.Avatar, PositionX = citizenToUpdate.PositionX, PositionY = citizenToUpdate.PositionY, IsGhost = citizenToUpdate.IsGhost, Dead = citizenToUpdate.Dead, IdLastUpdateInfo = citizenToUpdate.IdLastUpdateInfo, IdTown = townId, IdUser = citizenToUpdate.IdUser });
            }

            connection.Close();
        }

        public void PatchCitizenDetail(TownCitizenDetailModel citizenDetail)
        {
            using var connection = new MySqlConnection(Configuration.ConnectionString);
            connection.Open();
            var keys = new Dictionary<string, Func<TownCitizenDetailModel, object>>() { { "idTown", x => x.IdTown }, { "idUser", x => x.IdUser } };
            connection.Update(citizenDetail, keys, ignoreNull: true);
            connection.Close();
        }

        public CitizensWrapper GetCitizens(int townId)
        {
            var query = $@"SELECT tc.idTown AS TownId
                                  ,citizen.idUser AS CitizenId
	                              ,citizen.name AS CitizenName
                                  ,homeMessage AS CitizenHomeMessage
                                  ,jobName AS CitizenJobName
                                  ,jobUID AS CitizenJobUID
                                  ,positionX AS CitizenPositionX
                                  ,positionY AS CitizenPositionY
                                  ,isGhost AS CitizenIsGhost
                                  ,dead AS CitizenIsDead
                                  ,cleanUp.idCleanUp AS CitizenIdCleanUp
                                  ,tc.idLastUpdateInfo AS LastUpdateInfoId
                                  ,tc.avatar
                                  ,tc.hasRescue
                                  ,tc.APAGcharges
                                  ,tc.hasUppercut
                                  ,tc.hasSecondWind
                                  ,tc.hasLuckyFind
                                  ,tc.hasCheatDeath
                                  ,tc.hasHeroicReturn
                                  ,tc.hasBreakThrough
                                  ,tc.hasBrotherInArms
                                  ,tc.houseLevel
                                  ,tc.hasAlarm
                                  ,tc.chestLevel
                                  ,tc.hasCurtain
                                  ,tc.renfortLevel
                                  ,tc.hasFence
                                  ,tc.kitchenLevel
                                  ,tc.laboLevel
                                  ,tc.hasLock
                                  ,tc.restLevel
                                  ,tc.isCleanBody
                                  ,tc.isCamper
                                  ,tc.isAddict
                                  ,tc.isDrugged
                                  ,tc.isDrunk
                                  ,tc.isQuenched
                                  ,tc.isConvalescent
                                  ,tc.isSated
                                  ,tc.isCheatingDeathActive
                                  ,tc.isHungOver
                                  ,tc.isImmune
                                  ,tc.isInfected
                                  ,tc.isTerrorised
                                  ,tc.isThirsty
                                  ,tc.isDesy
                                  ,tc.isTired
                                  ,tc.isHeadWounded
                                  ,tc.isHandWounded
                                  ,tc.isArmWounded
                                  ,tc.isLegWounded
                                  ,tc.isEyeWounded
                                  ,tc.isFootWounded
	                              ,lui.idUser AS LastUpdateInfoUserId
	                              ,lui.dateUpdate AS LastUpdateDateUpdate
	                              ,userUpdater.name AS LastUpdateInfoUserName
								  ,i.idItem
								  ,i.idCategory
								  ,i.itemUid
								  ,i.itemDeco
								  ,i.itemLabel_fr AS ItemLabelFr
								  ,i.itemLabel_en AS ItemLabelEn
								  ,i.itemLabel_es AS ItemLabelEs
								  ,i.itemLabel_de AS ItemLabelDe
								  ,i.itemDescription_fr AS ItemDescriptionFr
								  ,i.itemDescription_en AS ItemDescriptionEn
								  ,i.itemDescription_es AS ItemDescriptionEs
								  ,i.itemDescription_de AS ItemDescriptionDe
								  ,i.itemGuard
								  ,i.itemImg
								  ,i.itemIsHeaver
								  ,i.itemDropRate_praf AS ItemDropRatePraf
								  ,i.itemDropRate_notPraf AS ItemDropRateNotPraf
								  ,i.catName
								  ,i.catOrdering
								  ,i.catLabel_fr AS CatLabelFr
								  ,i.catLabel_en AS CatLabelEn
								  ,i.catLabel_es AS CatLabelEs
								  ,i.catLabel_de AS CatLabelDe
								  ,i.actionName
								  ,i.propertyName
								  ,i.dropRate_praf AS DropRatePraf
								  ,i.dropRate_notPraf AS DropRateNotPraf
                                  ,bi.count AS ItemCount
                                  ,bi.isBroken AS IsBroken
                                  ,bagLuiUser.name AS BagLastUpdateUserName
                                  ,bagLui.dateUpdate AS BagLastUpdateDateUpdate
                                  ,heroicActionLuiUser.name AS HeroicActionLastUpdateInfoUserName
                                  ,heroicActionLui.dateUpdate AS HeroicActionLastUpdateDateUpdate
                                  ,homeLuiUser.name AS HomeLastUpdateInfoUserName
                                  ,homeLui.dateUpdate AS HomeLastUpdateDateUpdate
                                  ,statusLuiUser.name AS StatusLastUpdateInfoUserName
                                  ,statusLui.dateUpdate AS StatusLastUpdateDateUpdate
                                  ,tc.idBag AS BagId
                                  ,tc.isGhoul
                                  ,tc.ghoulVoracity
                                  ,ghoulLuiUser.name AS GhoulStatusLastUpdateInfoUserName
                                  ,ghoulLui.dateUpdate AS GhoulStatusLastUpdateDateUpdate
                              FROM TownCitizen tc
                              INNER JOIN Users citizen ON citizen.idUser = tc.idUser
                              INNER JOIN LastUpdateInfo lui ON lui.idLastUpdateInfo = tc.idLastUpdateInfo 
                              INNER JOIN Users userUpdater ON userUpdater.idUser = lui.idUser
                              LEFT JOIN Bag bag ON bag.idBag = tc.idBag
                              LEFT JOIN LastUpdateInfo bagLui ON bagLui.idLastUpdateInfo = bag.idLastUpdateInfo 
                              LEFT JOIN Users bagLuiUser ON bagLuiUser.idUser = bagLui.idUser
                              LEFT JOIN BagItem bi on bi.idBag = bag.idBag
                              LEFT JOIN ItemComplet i ON i.idItem = bi.idItem
                              LEFT JOIN LastUpdateInfo heroicActionLui ON heroicActionLui.idLastUpdateInfo = tc.idLastUpdateInfoHeroicAction 
                              LEFT JOIN Users heroicActionLuiUser ON heroicActionLuiUser.idUser = heroicActionLui.idUser
                              LEFT JOIN LastUpdateInfo homeLui ON homeLui.idLastUpdateInfo = tc.idLastUpdateInfoHome 
                              LEFT JOIN Users homeLuiUser ON homeLuiUser.idUser = homeLui.idUser
                              LEFT JOIN LastUpdateInfo statusLui ON statusLui.idLastUpdateInfo = tc.idLastUpdateInfoStatus 
                              LEFT JOIN Users statusLuiUser ON statusLuiUser.idUser = statusLui.idUser
                              LEFT JOIN LastUpdateInfo ghoulLui ON ghoulLui.idLastUpdateInfo = tc.idLastUpdateInfoGhoulStatus 
                              LEFT JOIN Users ghoulLuiUser ON ghoulLuiUser.idUser = ghoulLui.idUser
                              LEFT JOIN TownCadaver tca ON tca.idCadaver = tc.idCadaver
                              LEFT JOIN TownCadaverCleanUp cleanUp ON cleanUp.idCleanUp = tca.cleanUp
                              WHERE tc.idTown = @idTown";
            using var connection = new MySqlConnection(Configuration.ConnectionString);
            var citizens = connection.Query<TownCitizenBagItemCompletModel>(query, new { idTown = townId });
            connection.Close();


            //  var distinctCitizenItem = citizens.Where(x => x.IdItem != 0).Distinct(new TownCitizenItemComparer());
            var distinctCitizenItem = citizens.Where(x => x.IdItem != 0).Distinct(new TownCitizenItemComparer());
            var items = Mapper.Map<IEnumerable<Item>>(citizens.Where(x => x.IdItem != 0).Distinct(new ItemIdComparer()));

            foreach (var item in items)
            {
                IEnumerable<TownCitizenBagItemCompletModel> matchingItemComplet = citizens.Where(i => i.IdItem == item.Id);
                item.Actions = matchingItemComplet.Where(i => !string.IsNullOrEmpty(i.ActionName)).Select(i => i.ActionName).Distinct();
                item.Properties = matchingItemComplet.Where(i => !string.IsNullOrEmpty(i.PropertyName)).Select(i => i.PropertyName).Distinct();
            }

            var citizenWrapper = new CitizensWrapper()
            {
                LastUpdateInfo = Mapper.Map<LastUpdateInfo>(citizens.FirstOrDefault()),
                Citizens = Mapper.Map<IEnumerable<Citizen>>(citizens.Distinct(new CitizenIdComparer())).ToList()
            };
            citizenWrapper.Citizens.ForEach(citizen =>
            {
                citizen.Cadaver.CleanUp.IdCleanUp = citizens.Where(x => x.CitizenId == citizen.Id).First().CitizenIdCleanUp;
                var citizenItems = distinctCitizenItem.Where(x => x.CitizenId == citizen.Id);
                citizen.Bag = Mapper.Map<CitizenBag>(citizenItems);
                if (!citizenItems.Any()) // Si y'a pas d'item dans le sac, il faut aller chercher l'info du last update dans la liste sans le distinct !
                {
                    var c = citizens.First(x => x.CitizenId == citizen.Id);
                    if (c.BagLastUpdateDateUpdate.HasValue)
                    {
                        citizen.Bag.LastUpdateInfo = new LastUpdateInfo()
                        {
                            UpdateTime = c.BagLastUpdateDateUpdate.Value,
                            UserName = c.BagLastUpdateUserName
                        };
                    }
                    citizen.Bag.IdBag = c.BagId;
                }
            });
            return citizenWrapper;
        }

        public void PatchCadaver(int townId, CadaversWrapper wrapper)
        {
            using var connection = new MySqlConnection(Configuration.ConnectionString);
            connection.Open();

            var lastUpdateInfo = Mapper.Map<LastUpdateInfoModel>(wrapper.LastUpdateInfo);
            var idLastUpdateInfo = connection.ExecuteScalar<int>(@"INSERT INTO LastUpdateInfo(dateUpdate, idUser)
                                                                   VALUES (@DateUpdate, @IdUser); SELECT LAST_INSERT_ID()", new { DateUpdate = lastUpdateInfo.DateUpdate, IdUser = lastUpdateInfo.IdUser });

            var existings = connection.Query(@"SELECT tca.idCadaver,
                                                      tca.idCitizen,
                                                      tca.cleanUp
                                                 FROM TownCadaver tca,
                                                      TownCitizen tci
                                                WHERE tca.idCitizen = tci.idUser
                                                  AND tci.idTown = @IdTown", new { IdTown = townId });

            var townCadaverModels = Mapper.Map<IEnumerable<TownCadaverModel>>(wrapper.Cadavers).ToList();
            townCadaverModels.ForEach(x =>
            {
                var existingCadaver = existings.Where(existing => existing.idCitizen == x.IdCitizen).FirstOrDefault();
                x.IdCadaver = existingCadaver != null ? existingCadaver.idCadaver : 0;
                x.IdLastUpdateInfo = idLastUpdateInfo;
                x.CauseOfDeath = Mapper.Map<CauseOfDeathModel>(wrapper.Cadavers.Where(y => y.Id == x.IdCitizen).First().CauseOfDeath);
                x.CleanUp = Mapper.Map<CleanUpModel>(wrapper.Cadavers.Where(y => y.Id == x.IdCitizen).First().CleanUp);
            });

            var townCadaversModelsToInsert = townCadaverModels.Where(x => !existings.Any(existing => existing.idCitizen == x.IdCitizen)).ToList();
            var townCadaversModelsToUpdate = townCadaverModels.Where(x => existings.Any(existing => existing.idCitizen == x.IdCitizen)).ToList();

            foreach (var cadaver in townCadaversModelsToInsert)
            {
                var idCleanUp = connection.ExecuteScalar<int>(@"INSERT INTO TownCadaverCleanUp( idUserCleanUp,
                                                                                                idCleanUpType )
                                                                                       VALUES ( @IdUserCleanUp,
                                                                                                @IdCleanUpType );
                                                                SELECT LAST_INSERT_ID()",
                                                            new
                                                            {
                                                                IdUserCleanUp = cadaver.CleanUp.IdUserCleanUp,
                                                                IdCleanUpType = cadaver.CleanUp.IdCleanUpType
                                                            });

                var idInsert = connection.ExecuteScalar<int>(@"INSERT INTO TownCadaver( idCitizen,
                                                                                        idLastUpdateInfo,
                                                                                        cadaverName,
                                                                                        avatar,
                                                                                        survivalDay,
                                                                                        score,
                                                                                        deathMessage,
                                                                                        townMessage,
                                                                                        causeOfDeath,
                                                                                        cleanUp )
                                                                               VALUES ( @IdCitizen,
                                                                                        @IdLastUpdateInfo,
                                                                                        @CadaverName,
                                                                                        @Avatar,
                                                                                        @SurvivalDay,
                                                                                        @Score,
                                                                                        @DeathMessage,
                                                                                        @TownMessage,
                                                                                        @Cod,
                                                                                        @CleanUp ); SELECT LAST_INSERT_ID()",
                                                            new
                                                            {
                                                                IdCitizen = cadaver.IdCitizen,
                                                                IdLastUpdateInfo = idLastUpdateInfo,
                                                                CadaverName = cadaver.Name,
                                                                Avatar = cadaver.Avatar,
                                                                SurvivalDay = cadaver.Survival,
                                                                Score = cadaver.Score,
                                                                DeathMessage = cadaver.Msg,
                                                                TownMessage = cadaver.TownMsg,
                                                                Cod = cadaver.CauseOfDeath.Dtype,
                                                                CleanUp = idCleanUp
                                                            });
                cadaver.IdCadaver = idInsert;

                connection.Execute(@"UPDATE TownCitizen
                                        SET dead = @Dead,
                                            idCadaver = @IdCadaver
                                      WHERE idUser = @IdUser
                                        AND idTown = @IdTown",
                                    new
                                    {
                                        Dead = 1,
                                        IdCadaver = idInsert,
                                        IdUser = cadaver.IdCitizen,
                                        IdTown = townId
                                    });
            }

            foreach (var cadaver in townCadaversModelsToUpdate)
            {
                connection.Execute(@"UPDATE TownCadaverCleanUp 
                                            SET idUserCleanUp = @IdUserCleanUp,
                                                idCleanUpType = @IdCleanUpType
                                          WHERE idCleanUp = @IdCleanUp",
                                        new
                                        {
                                            IdUserCleanUp = cadaver.CleanUp.IdUserCleanUp,
                                            IdCleanUpType = cadaver.CleanUp.IdCleanUpType,
                                            IdCleanUp = cadaver.CleanUp.IdCleanUp
                                        });

                connection.Execute(@"UPDATE TownCadaver
                                        SET idLastUpdateInfo = @IdLastUpdateInfo,
                                            deathMessage = @DeathMessage,
                                            townMessage = @TownMessage
                                      WHERE idCadaver = @IdCadaver",
                                new
                                {
                                    IdCadaver = cadaver.IdCadaver,
                                    idLastUpdateInfo = idLastUpdateInfo,
                                    DeathMessage = cadaver.Msg,
                                    TownMessage = cadaver.TownMsg
                                });
            }

            connection.Close();
        }

        public CadaversWrapper GetCadavers(int townId)
        {
            var citizenWrapper = new CadaversWrapper();

            return citizenWrapper;
        }

        public void UpdateCitizenLocation(int townId, int x, int y, IEnumerable<int> citizenId, int lastUpdateInfoId)
        {
            using var connection = new MySqlConnection(Configuration.ConnectionString);
            connection.Open();
            var param = new DynamicParameters();
            param.Add($"@PositionX", x);
            param.Add($"@PositionY", y);
            param.Add($"@IdTown", townId);
            param.Add($"@lastUpdateInfoId", lastUpdateInfoId);
            var inParamList = new List<string>();
            var idUserWhereClause = string.Empty;
            if (citizenId.Any())
            {
                foreach (var id in citizenId)
                {
                    inParamList.Add($"@{id}");
                    param.Add($"@{id}", id);
                }
                idUserWhereClause = $"idUser IN ({string.Join(",", inParamList)}) AND";
            }
            var query = $"UPDATE TownCitizen SET positionX = @positionX, positionY = @positionY, idLastUpdateInfo = @lastUpdateInfoId WHERE {idUserWhereClause} idTown = @idTown";
            connection.Query(query, param);
            connection.Close();
        }

        #endregion

        #region Ruins

        public void PatchRuins(IEnumerable<MyHordesOptimizerRuin> ruins)
        {
            var model = Mapper.Map<IEnumerable<RuinModel>>(ruins);
            using var connection = new MySqlConnection(Configuration.ConnectionString);
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

        public IEnumerable<MyHordesOptimizerRuin> GetRuins()
        {
            var items = GetItems();
            using var connection = new MySqlConnection(Configuration.ConnectionString);
            connection.Open();
            var ruinsComplet = connection.Query<RuinCompletModel>(@"SELECT idRuin
                                                                  ,ruinLabel_fr AS RuinLabelFr
                                                                  ,ruinLabel_en AS RuinLabelEn
                                                                  ,ruinLabel_es AS RuinLabelEs
                                                                  ,ruinLabel_de AS RuinLabelDe
                                                                  ,ruinDescription_fr AS RuinDescriptionFr
                                                                  ,ruinDescription_en AS RuinDescriptionEn
                                                                  ,ruinDescription_es AS RuinDescriptionEs
                                                                  ,ruinDescription_de AS RuinDescriptionDe
                                                                  ,ruinExplorable
                                                                  ,ruinImg
                                                                  ,ruinCamping
                                                                  ,ruinMinDist
                                                                  ,ruinMaxDist
                                                                  ,ruinChance
                                                                  ,idItem
                                                                  ,itemUid
                                                                  ,itemLabel_fr AS ItemLabelFr
                                                                  ,dropProbability
                                                                  ,dropWeight
                                                              FROM RuinComplete");
            connection.Close();

            var ruins = Mapper.Map<IEnumerable<MyHordesOptimizerRuin>>(ruinsComplet.Distinct(new RuinIdComparer()));
            foreach (var ruin in ruins)
            {
                IEnumerable<RuinCompletModel> matchingComplet = ruinsComplet.Where(i => i.IdRuin == ruin.Id);
                var dropComplet = matchingComplet.Select(r => new { r.IdItem, r.DropWeight, r.DropProbability });
                foreach (var drop in dropComplet)
                {
                    if (drop.IdItem != 0)
                    {
                        ruin.Drops.Add(new ItemResult()
                        {
                            Item = items.First(i => i.Id == drop.IdItem),
                            Probability = drop.DropProbability,
                            Weight = drop.DropWeight
                        });
                    }
                }
            }
            return ruins;
        }

        #endregion

        #region Categories

        public void PatchCategories(IEnumerable<CategoryModel> categories)
        {
            using var connection = new MySqlConnection(Configuration.ConnectionString);
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
            using var connection = new MySqlConnection(Configuration.ConnectionString);
            connection.Open();
            var categories = connection.Query<CategoryModel>(@"SELECT idCategory
                                                              ,name
                                                              ,label_fr AS LabelFr
                                                              ,label_en AS LabelEn
                                                              ,label_es AS LabelEs
                                                              ,label_de AS LabelDe
                                                              ,ordering
                                                          FROM Category");
            connection.Close();
            return categories;
        }

        #endregion

        #region Properties

        public void PatchProperties(IEnumerable<string> properties)
        {
            using var connection = new MySqlConnection(Configuration.ConnectionString);
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
            using var connection = new MySqlConnection(Configuration.ConnectionString);
            connection.Open();
            connection.Execute("DELETE FROM ItemProperty");
            connection.Close();
        }

        public void PatchPropertiesItem(string itemUid, IEnumerable<string> properties)
        {
            using var connection = new MySqlConnection(Configuration.ConnectionString);
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


        public void PatchActions(IEnumerable<string> allActions)
        {
            using var connection = new MySqlConnection(Configuration.ConnectionString);
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
            using var connection = new MySqlConnection(Configuration.ConnectionString);
            connection.Open();
            connection.Execute("DELETE FROM ItemAction");
            connection.Close();
        }

        public void PatchActionsItem(string itemUid, IEnumerable<string> actions)
        {
            using var connection = new MySqlConnection(Configuration.ConnectionString);
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

        #region Bags

        public void PatchCitizenBags(int townId, LastUpdateInfo lastUpdateInfo, IEnumerable<Citizen> citizens)
        {
            using var connection = new MySqlConnection(Configuration.ConnectionString);
            connection.Open();
            var idLastUpdateInfo = connection.ExecuteScalar<int>(@"INSERT INTO LastUpdateInfo(dateUpdate, idUser)
                                                                   VALUES (@DateUpdate, @IdUser); SELECT LAST_INSERT_ID()", new { DateUpdate = lastUpdateInfo.UpdateTime, IdUser = lastUpdateInfo.UserId });

            var param = new DynamicParameters();
            StringBuilder inBuilder = GenerateInQuery(citizens.Select(x => x.Bag.IdBag), param);
            connection.ExecuteScalar($"DELETE FROM BagItem WHERE idBag {inBuilder}", param);

            var modeles = new List<BagItem>();
            foreach (var citizen in citizens)
            {
                foreach (var item in citizen.Bag.Items)
                {
                    modeles.Add(new BagItem()
                    {
                        Count = item.Count,
                        IsBroken = item.IsBroken,
                        IdItem = item.Item.Id,
                        IdBag = citizen.Bag.IdBag.Value
                    });
                }
            }
            if (modeles.Any())
            {
                connection.BulkInsert("BagItem", modeles);
            }

            param = new DynamicParameters();
            param.Add("IdLastUpdateInfo", idLastUpdateInfo);
            inBuilder = GenerateInQuery(citizens.Select(x => x.Bag.IdBag), param);
            connection.ExecuteScalar($"UPDATE Bag SET idLastUpdateInfo = @IdLastUpdateInfo WHERE idBag {inBuilder}", param);

            connection.Close();
        }

        public IDictionary<int, int> GetCitizenBagsId(int townId, IEnumerable<int> userIds)
        {
            using var connection = new MySqlConnection(Configuration.ConnectionString);
            var param = new DynamicParameters();
            param.Add("IdTown", townId);
            connection.Open();
            var bagIds = new Dictionary<int, int>();
            StringBuilder inBuilder = GenerateInQuery(userIds, param);
            var dynamics = connection.Query($"SELECT idBag, idUser FROM TownCitizen WHERE idTown = @IdTown AND idUser {inBuilder.ToString()}", param);
            foreach (var result in dynamics)
            {
                if (result.idBag == null)
                {
                    var bagId = connection.ExecuteScalar<int>(@"INSERT INTO Bag() VALUES (); SELECT LAST_INSERT_ID()");
                    connection.ExecuteScalar("UPDATE TownCitizen SET idBag = @IdBag WHERE idUser = @IdUser", new { IdBag = bagId, IdUser = result.idUser });
                    bagIds.Add(result.idUser, bagId);
                }
                else
                {
                    bagIds.Add(result.idUser, result.idBag);
                }
            }
            connection.Close();
            return bagIds;
        }

        private static StringBuilder GenerateInQuery<TObject>(IEnumerable<TObject> objects, DynamicParameters param)
        {
            var inBuilder = new StringBuilder();
            if (objects.Any())
            {
                int count = 1;
                var list = new List<string>();
                foreach (var obj in objects)
                {
                    list.Add($"@{count}");
                    param.Add($"{count}", obj);
                    count++;
                }
                inBuilder.Append($"IN ({string.Join(",", list)})");
            }
            return inBuilder;
        }

        public int GetCitizenBagId(int townId, int userId)
        {
            using var connection = new MySqlConnection(Configuration.ConnectionString);
            connection.Open();
            var bagId = connection.QuerySingle<int?>("SELECT idBag FROM TownCitizen WHERE idTown = @IdTown AND idUser = @IdUser ", new { IdTown = townId, IdUser = userId });
            if (bagId == null)
            {
                bagId = connection.ExecuteScalar<int>(@"INSERT INTO Bag() VALUES (); SELECT LAST_INSERT_ID()");
                connection.ExecuteScalar("UPDATE TownCitizen SET idBag = @IdBag WHERE idUser = @IdUser", new { IdBag = bagId, IdUser = userId });
            }
            connection.Close();
            return bagId.Value;
        }

        public IEnumerable<BagItem> GetAllBagItems(int townId)
        {
            using var connection = new MySqlConnection(Configuration.ConnectionString);
            connection.Open();
            var bagsItems = connection.Query<BagItem>(@"SELECT bi.idItem
                                                               ,SUM(bi.count) AS Count
				                                               ,bi.isBroken
                                                              FROM BagItem bi
                                                              LEFT JOIN TownCitizen tc ON tc.idBag = bi.idBag
                                                              WHERE tc.idTown = @IdTown
                                                              GROUP BY  bi.idItem", new { IdTown = townId });
            connection.Close();
            return bagsItems;
        }

        #endregion

        #region Parameters

        public IEnumerable<ParametersModel> GetParameters()
        {
            using var connection = new MySqlConnection(Configuration.ConnectionString);
            connection.Open();
            var parameters = connection.Query<ParametersModel>("SELECT name, value FROM Parameters");
            connection.Close();
            return parameters;
        }

        public void PatchParameter(ParametersModel model)
        {
            using var connection = new MySqlConnection(Configuration.ConnectionString);
            connection.Open();
            connection.InsertOrUpdate("Parameters", model);
            connection.Close();
        }

        #endregion

        #region MapCells

        public void PatchMapCell(int townId, IEnumerable<MapCellModel> listCells, bool forceUpdate)
        {
            using var connection = new MySqlConnection(Configuration.ConnectionString);
            connection.Open();
            var existings = connection.Query<MapCellModel>("SELECT * FROM MapCell WHERE idTown = @IdTown", new { IdTown = townId });
            foreach (var cell in listCells)
            {
                var existingCell = existings.SingleOrDefault(existing => existing.X == cell.X && existing.Y == cell.Y);
                if (existingCell != null)
                {
                    cell.IdCell = existingCell.IdCell;
                    foreach (var prop in cell.GetType().GetProperties())
                    {
                        if (prop.GetValue(cell) == null)
                        {
                            prop.SetValue(cell, prop.GetValue(existingCell));
                        }
                    }
                }
            }
            var toUpdate = listCells;
            if (!forceUpdate)
            {
                toUpdate = listCells.Except(existings, new CellModelComparer());
            }
            connection.BulkInsertOrUpdate("MapCell", toUpdate);
            connection.Close();
        }

        public MapCellCompletModel GetCell(int townId, int x, int y)
        {
            using var connection = new MySqlConnection(Configuration.ConnectionString);
            connection.Open();
            var cells = connection.Query<MapCellCompletModel>(@"SELECT * FROM MapCellComplet
                                                                WHERE idTown = @idtown AND x = @x AND y = @y", new { idTown = townId, x = x, y = y });
            connection.Close();
            var cell = cells.Distinct(new CellIdComparer()).Single();
            return cell;
        }

        public IEnumerable<MapCellCompletModel> GetCells(int townId)
        {
            using var connection = new MySqlConnection(Configuration.ConnectionString);
            connection.Open();
            var cells = connection.Query<MapCellCompletModel>(@"SELECT * FROM MapCellComplet 
                                                                WHERE idTown = @idtown", new { idTown = townId });
            connection.Close();
            return cells;
        }

        public void PatchMapCellItem(int townId, IEnumerable<MapCellItemModel> listCellItems)
        {
            using var connection = new MySqlConnection(Configuration.ConnectionString);
            connection.Open();
            connection.BulkInsertOrUpdate("MapCellItem", listCellItems);
            connection.Close();
        }

        public void PatchCellDig(int townId, IEnumerable<MapCellDigModel> cellDigsToUpdate)
        {
            using var connection = new MySqlConnection(Configuration.ConnectionString);
            connection.Open();
            connection.BulkInsertOrUpdate("MapCellDig", cellDigsToUpdate);
            connection.Close();
        }

        public IEnumerable<MapCellDigCompletModel> GetCellsDigs(int townId)
        {
            using var connection = new MySqlConnection(Configuration.ConnectionString);
            connection.Open();
            var digs = connection.Query<MapCellDigCompletModel>(@"SELECT mcd.idCell AS CellId
	                                                              ,mcd.idUser AS DiggerId
                                                                  ,mcd.day 
                                                                  ,mcd.nbSucces
                                                                  ,mcd.nbTotalDig
                                                                  ,mc.x
                                                                  ,mc.y
                                                                  ,digger.name AS DiggerName
                                                                  ,lui.dateUpdate AS LastUpdateDateUpdate
                                                                  ,luiUser.name AS LastUpdateInfoUserName
                                                                  ,luiUser.idUser AS LastUpdateInfoUserId
                                                            FROM MapCellDig mcd
                                                            INNER JOIN MapCell mc ON mc.idCell = mcd.idCell
                                                            INNER JOIN Users digger on digger.idUser = mcd.idUser
                                                            INNER JOIN LastUpdateInfo lui ON lui.idLastUpdateInfo = mcd.idLastUpdateInfo
                                                            INNER JOIN Users luiUser ON luiUser.idUser = lui.idUser
                                                            WHERE mc.idTown = @idTown", new { idTown = townId });
            connection.Close();
            return digs;
        }

        public MapCellDigCompletModel GetCellDigs(int idCell, int idUser, int day)
        {
            using var connection = new MySqlConnection(Configuration.ConnectionString);
            connection.Open();
            var dig = connection.QuerySingleOrDefault<MapCellDigCompletModel>(@"SELECT mcd.idCell AS CellId
	                                                              ,mcd.idUser AS DiggerId
                                                                  ,mcd.day 
                                                                  ,mcd.nbSucces
                                                                  ,mcd.nbTotalDig
                                                                  ,mc.x
                                                                  ,mc.y
                                                                  ,digger.name AS DiggerName
                                                                  ,lui.dateUpdate AS LastUpdateDateUpdate
                                                                  ,luiUser.name AS LastUpdateInfoUserName
                                                                  ,luiUser.idUser AS LastUpdateInfoUserId
                                                            FROM MapCellDig mcd
                                                            INNER JOIN MapCell mc ON mc.idCell = mcd.idCell
                                                            INNER JOIN Users digger on digger.idUser = mcd.idUser
                                                            INNER JOIN LastUpdateInfo lui ON lui.idLastUpdateInfo = mcd.idLastUpdateInfo
                                                            INNER JOIN Users luiUser ON luiUser.idUser = lui.idUser
                                                            WHERE mcd.idCell = @idCell AND mcd.idUser = @idUser AND mcd.day = @day", new { idCell = idCell, idUser = idUser, day = day });
            connection.Close();
            return dig;
        }

        public MapCellDigUpdateModel GetMapCellDigUpdate(int townId, int day)
        {
            using var connection = new MySqlConnection(Configuration.ConnectionString);
            connection.Open();
            var update = connection.QuerySingleOrDefault<MapCellDigUpdateModel>("SELECT * FROM MapCellDigUpdate WHERE idTown = @idTown AND day = @day", new { idTown = townId, day = day });
            connection.Close();
            return update;
        }

        public IEnumerable<MapCellDigUpdateModel> GetMapUpdates(int townId)
        {
            using var connection = new MySqlConnection(Configuration.ConnectionString);
            connection.Open();
            var updates = connection.Query<MapCellDigUpdateModel>("SELECT * FROM MapCellDigUpdate WHERE idTown = @idTown", new { idTown = townId });
            connection.Close();
            return updates;
        }

        public void InsertMapCellDigUpdate(MapCellDigUpdateModel mapCellDigUpdate)
        {
            using var connection = new MySqlConnection(Configuration.ConnectionString);
            connection.Open();
            connection.Insert(mapCellDigUpdate);
            connection.Close();
        }

        public void PatchMapCellDig(List<MapCellDigModel> models)
        {
            using var connection = new MySqlConnection(Configuration.ConnectionString);
            connection.Open();
            connection.BulkInsertOrUpdate("MapCellDig", models);
            connection.Close();
        }

        public void DeleteMapCellDig(int idCell, int diggerId, int day)
        {
            using var connection = new MySqlConnection(Configuration.ConnectionString);
            connection.Open();
            connection.Query("DELETE FROM MapCellDig WHERE idCell = @idCell AND idUser = @idUser AND day = @day", new { idCell = idCell, idUser = diggerId, day = day });
            connection.Close();
        }

        public void ClearCellDig(IEnumerable<int> cellId)
        {
            using var connection = new MySqlConnection(Configuration.ConnectionString);
            connection.Open();
            connection.Query("DELETE FROM MapCellDig WHERE idCell IN @cellIds", new { cellIds = cellId });
            connection.Close();
        }

        public void ClearCellItem(int idCell, int idLastUpdateInfo)
        {
            using var connection = new MySqlConnection(Configuration.ConnectionString);
            connection.Open();
            connection.Query("DELETE FROM MapCellItem WHERE idCell = @idCell", new { idCell = idCell });
            connection.Execute(@"UPDATE MapCell SET idLastUpdateInfo = @idLastUpdateInfo WHERE idCell = @idCell", new { idLastUpdateInfo = idLastUpdateInfo, idCell = idCell });
            connection.Close();
        }

        #endregion

        public int CreateLastUpdateInfo(LastUpdateInfo lastUpdateInfo)
        {
            using var connection = new MySqlConnection(Configuration.ConnectionString);
            connection.Open();
            var idLastUpdateInfo = connection.ExecuteScalar<int>(@"INSERT INTO LastUpdateInfo(dateUpdate, idUser)
                                                                   VALUES (@DateUpdate, @IdUser); SELECT LAST_INSERT_ID()", new { DateUpdate = lastUpdateInfo.UpdateTime, IdUser = lastUpdateInfo.UserId });
            connection.Close();
            return idLastUpdateInfo;
        }

        #region Estimations 

        public void UpdateEstimation(int townId, TownEstimationModel estimation)
        {
            using var connection = new MySqlConnection(Configuration.ConnectionString);
            connection.Open();
            connection.InsertOrUpdate("TownEstimation", estimation);
            connection.Close();
        }

        public IEnumerable<TownEstimationModel> GetEstimations(int townId, int day)
        {
            using var connection = new MySqlConnection(Configuration.ConnectionString);
            connection.Open();
            var estimations = connection.Query<TownEstimationModel>("SELECT * FROM TownEstimation WHERE idTown = @idTown AND day = @day", new { idTown = townId, day = day });
            connection.Close();
            return estimations;
        }

        #endregion
    }
}
