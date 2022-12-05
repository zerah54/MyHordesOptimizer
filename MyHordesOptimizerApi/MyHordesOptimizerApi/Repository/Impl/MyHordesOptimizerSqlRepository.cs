using AutoMapper;
using Dapper;
using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.Dtos.MyHordes.MyHordesOptimizer;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Citizens;
using MyHordesOptimizerApi.Extensions;
using MyHordesOptimizerApi.Models;
using MyHordesOptimizerApi.Models.Views.Citizens;
using MyHordesOptimizerApi.Models.Views.Items;
using MyHordesOptimizerApi.Models.Views.Items.Bank;
using MyHordesOptimizerApi.Models.Views.Items.Citizen;
using MyHordesOptimizerApi.Models.Views.Items.Wishlist;
using MyHordesOptimizerApi.Models.Views.Recipes;
using MyHordesOptimizerApi.Models.Views.Ruins;
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

        public void PatchTown(Town town)
        {
            var sw = new Stopwatch();
            sw.Start();
            InsertTown(town.Id);
            Logger.LogTrace($"Insertion de la ville : {sw.ElapsedMilliseconds}");
            PatchCitizen(town.Id, town.Citizens);
            Logger.LogTrace($"PatchCitizen : {sw.ElapsedMilliseconds}");
            PutBank(town.Id, town.Bank);
            Logger.LogTrace($"PutBank : {sw.ElapsedMilliseconds}");
            sw.Stop();
        }

        private void InsertTown(int townId)
        {
            using var connection = new MySqlConnection(Configuration.ConnectionString);
            connection.Open();
            var exist = connection.ExecuteScalar<int?>("SELECT idTown FROM Town WHERE idTown = @TownId", new { TownId = townId });
            if (!exist.HasValue)
            {
                connection.Execute("INSERT INTO Town(idTown) VALUES(@TownId)", new { TownId = townId });
            }
            connection.Close();
        }

        public Town GetTown(int townId)
        {
            var town = new Town()
            {
                Id = townId
            };
            town.Citizens = GetCitizensWithBag(townId);
            town.Bank = GetBank(townId);
            town.WishList = GetWishList(townId);
            return town;
        }

        #endregion

        #region HeroSkill

        public void PatchHeroSkill(List<HeroSkillsModel> heroSkills)
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

        public List<HeroSkill> GetHeroSkills()
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
            var heroSkills = Mapper.Map<List<HeroSkill>>(models);
            return heroSkills;
        }


        #endregion

        #region Items

        public void PatchItems(List<ItemModel> items)
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

        public List<Item> GetItems()
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

            var items = Mapper.Map<List<Item>>(itemsComplets.Distinct(new ItemIdComparer()));
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

        public void PatchRecipes(List<RecipeModel> recipes)
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

        public void PatchRecipeComponents(string recipeName, List<string> componentUids)
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

        public void PatchRecipeResults(List<RecipeItemResultModel> results)
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

        public List<ItemRecipe> GetRecipes()
        {
            var items = GetItems();
            using var connection = new MySqlConnection(Configuration.ConnectionString);
            connection.Open();
            var recipeCompletModels = connection.Query<RecipeCompletModel>("SELECT * FROM RecipeComplet");
            connection.Close();

            var recipes = Mapper.Map<List<ItemRecipe>>(recipeCompletModels.Distinct(new RecipeNameComparer()));
            foreach (var recipe in recipes)
            {
                IEnumerable<RecipeCompletModel> matchingComplet = recipeCompletModels.Where(r => r.RecipeName == recipe.Name);
                recipe.Components = items.Where(i => matchingComplet.Any(x => x.ComponentItemId == i.Id)).Distinct().ToList();
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
            InsertTown(townId);
            using var connection = new MySqlConnection(Configuration.ConnectionString);
            connection.Open();

            var lastUpdateInfo = Mapper.Map<LastUpdateInfoModel>(bank.LastUpdateInfo);
            var idLastUpdateInfo = connection.ExecuteScalar<int>(@"INSERT INTO LastUpdateInfo(dateUpdate, idUser)
                                                                   VALUES (@DateUpdate, @IdUser); SELECT LAST_INSERT_ID()", new { DateUpdate = lastUpdateInfo.DateUpdate, IdUser = lastUpdateInfo.IdUser });
            Logger.LogTrace($"[PutBank] Insert LastUpdate : {sw.ElapsedMilliseconds}");

            var townBankItemModels = Mapper.Map<List<TownBankItemModel>>(bank.Bank);
            townBankItemModels.ForEach(x => { x.IdTown = townId; x.IdLastUpdateInfo = idLastUpdateInfo; });
            Logger.LogTrace($"[PutBank] Automapper TownBankItemModel : {sw.ElapsedMilliseconds}");
            var dico = new Dictionary<string, Func<TownBankItemModel, object>>() { { "idTown", x => x.IdTown }, { "idItem", x => x.IdItem }, { "count", x => x.Count }, { "isBroken", x => x.IsBroken }, { "idLastUpdateInfo", x => x.IdLastUpdateInfo } };
            connection.BulkInsert("TownBankItem", dico, townBankItemModels);
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

            var banksItems = Mapper.Map<List<BankItem>>(group);
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

        public void AddItemToWishlist(int townId, int itemId, int userId)
        {
            InsertTown(townId);
            var query = @"CALL AddItemToWishList(@TownId, @UserId, @ItemId, @DateUpdate)";
            using var connection = new MySqlConnection(Configuration.ConnectionString);
            connection.Open();
            connection.Execute(query, new { TownId = townId, UserId = userId, ItemId = itemId, DateUpdate = DateTime.UtcNow });
            connection.Close();
        }

        public void PutWishList(int townId, int userId, List<TownWishlistItemModel> items)
        {
            InsertTown(townId);
            items.ForEach(x => x.IdTown = townId);
            var updateTownQuery = @"UPDATE Town SET idUserWishListUpdater = @UserId, wishlistDateUpdate = @DateUpdate WHERE idTown = @TownId;";
            var cleanWishListQuery = @"DELETE FROM TownWishListItem WHERE idTown = @TownId;";
            var dico = new Dictionary<string, Func<TownWishlistItemModel, object>>() { { "idTown", x => x.IdTown }, { "idItem", x => x.IdItem }, { "count", x => x.Count }, { "priority", x => x.Priority }, { "depot", x => x.Depot } };
            using var connection = new MySqlConnection(Configuration.ConnectionString);
            connection.Open();
            connection.Execute(updateTownQuery, new { UserId = userId, DateUpdate = DateTime.UtcNow, TownId = townId });
            connection.Execute(cleanWishListQuery, new { TownId = townId });
            connection.BulkInsert(tableName: "TownWishListItem", dico: dico, models: items);
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
								 ,twi.depot AS WishlistDepot
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

            var wishListItem = Mapper.Map<List<WishListItem>>(group);
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
                WishList = wishListItem
            };
            return wishlistWrapper;
        }

        #endregion

        #region Citizens

        public void PatchCitizen(int townId, CitizensWrapper wrapper)
        {
            InsertTown(townId);
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

            var townCitizenModels = Mapper.Map<List<TownCitizenModel>>(wrapper.Citizens);
            townCitizenModels.ForEach(x => { x.IdTown = townId; x.IdLastUpdateInfo = idLastUpdateInfo; });

            var dico = new Dictionary<string, Func<TownCitizenModel, object>>() { { "idTown", x => x.IdTown }, { "idUser", x => x.IdUser }, { "homeMessage", x => x.HomeMessage }, { "jobName", x => x.JobName }, { "jobUID", x => x.JobUID }, { "positionX", x => x.PositionX }, { "positionY", x => x.PositionY }, { "isGhost", x => x.IsGhost }, { "idLastUpdateInfo", x => x.IdLastUpdateInfo }, { "avatar", x => x.Avatar } };

            var existings = connection.Query("SELECT idUser, idBag FROM TownCitizen WHERE idTown = @IdTown", new { IdTown = townId });

            var townCitizenModelsToInsert = townCitizenModels.Where(x => !existings.Any(existing => existing.idUser == x.IdUser)).ToList();
            connection.BulkInsert("TownCitizen", dico, townCitizenModelsToInsert);

            var townCitizenModelsToUpdate = townCitizenModels.Where(x => existings.Any(existing => existing.idUser == x.IdUser)).ToList();
            foreach (var citizenToUpdate in townCitizenModelsToUpdate)
            {
                citizenToUpdate.IdBag = existings.Single(existing => existing.idUser == citizenToUpdate.IdUser).idBag;
                var keys = new Dictionary<string, Func<TownCitizenModel, object>>() { { "idTown", x => x.IdTown }, { "idUser", x => x.IdUser } };
                connection.Update(citizenToUpdate, keys);
            }
            //connection.ExecuteScalar("DELETE FROM TownCitizen WHERE idTown = @IdTown AND idLastUpdateInfo != @IdLastUpdateInfo", new { IdTown = townId, IdLastUpdateInfo = idLastUpdateInfo });
            connection.Close();
        }

        public CitizensWrapper GetCitizensWithBag(int townId)
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
                                  ,tc.idLastUpdateInfo AS LastUpdateInfoId
                                  ,tc.avatar
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
                                  ,tc.idBag AS BagId
                              FROM TownCitizen tc
                              INNER JOIN Users citizen ON citizen.idUser = tc.idUser
                              INNER JOIN LastUpdateInfo lui ON lui.idLastUpdateInfo = tc.idLastUpdateInfo 
                              INNER JOIN Users userUpdater ON userUpdater.idUser = lui.idUser
                              LEFT JOIN Bag bag ON bag.idBag = tc.idBag
                              LEFT JOIN LastUpdateInfo bagLui ON bagLui.idLastUpdateInfo = bag.idLastUpdateInfo 
                              LEFT JOIN Users bagLuiUser ON bagLuiUser.idUser = bagLui.idUser
                              LEFT JOIN BagItem bi on bi.idBag = bag.idBag
                              LEFT JOIN ItemComplet i ON i.idItem = bi.idItem
                              WHERE tc.idTown = @idTown";
            using var connection = new MySqlConnection(Configuration.ConnectionString);
            var citizens = connection.Query<TownCitizenBagItemCompletModel>(query, new { idTown = townId });
            var mostRecent = citizens.Max(x => x.LastUpdateDateUpdate);
            citizens = citizens.Where(x => x.LastUpdateDateUpdate == mostRecent);
            connection.Close();


            //  var distinctCitizenItem = citizens.Where(x => x.IdItem != 0).Distinct(new TownCitizenItemComparer());
            var distinctCitizenItem = citizens.Where(x => x.IdItem != 0).Distinct(new TownCitizenItemComparer());
            var items = Mapper.Map<List<Item>>(citizens.Where(x => x.IdItem != 0).Distinct(new ItemIdComparer()));

            foreach (var item in items)
            {
                IEnumerable<TownCitizenBagItemCompletModel> matchingItemComplet = citizens.Where(i => i.IdItem == item.Id);
                item.Actions = matchingItemComplet.Where(i => !string.IsNullOrEmpty(i.ActionName)).Select(i => i.ActionName).Distinct();
                item.Properties = matchingItemComplet.Where(i => !string.IsNullOrEmpty(i.PropertyName)).Select(i => i.PropertyName).Distinct();
            }
            var citizenWrapper = new CitizensWrapper()
            {
                LastUpdateInfo = Mapper.Map<LastUpdateInfo>(citizens.First()),
                Citizens = Mapper.Map<List<Citizen>>(citizens.Distinct(new CitizenIdComparer()))
            };
            citizenWrapper.Citizens.ForEach(citizen =>
            {
                var citizenItems = distinctCitizenItem.Where(x => x.CitizenId == citizen.Id);
                citizen.Bag = Mapper.Map<CitizenBag>(citizenItems);
                if (!citizenItems.Any()) // Si y'a pas d'item dans le sac, il faut aller chercher l'info du last update dans la liste sans le distinct !
                {
                    var c = citizens.First(x => x.CitizenId == citizen.Id);
                    citizen.Bag.LastUpdateDateUpdate = c.BagLastUpdateDateUpdate;
                    citizen.Bag.LastUpdateUserName = c.BagLastUpdateUserName;
                    citizen.Bag.IdBag = c.BagId;
                }
            });
            return citizenWrapper;
        }

        #endregion

        #region Ruins

        public void PatchRuins(List<MyHordesOptimizerRuin> ruins)
        {
            var model = Mapper.Map<List<RuinModel>>(ruins);
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

        public List<MyHordesOptimizerRuin> GetRuins()
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

            var ruins = Mapper.Map<List<MyHordesOptimizerRuin>>(ruinsComplet.Distinct(new RuinIdComparer()));
            foreach (var ruin in ruins)
            {
                IEnumerable<RuinCompletModel> matchingComplet = ruinsComplet.Where(i => i.IdRuin == ruin.Id);
                var dropComplet = matchingComplet.Select(r => new { r.IdItem, r.DropWeight, r.DropProbability });
                foreach (var drop in dropComplet)
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

        public void PatchProperties(List<string> properties)
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

        public void PatchPropertiesItem(string itemUid, List<string> properties)
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


        public void PatchActions(List<string> allActions)
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

        public void PatchActionsItem(string itemUid, List<string> actions)
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

        public void PatchCitizenBags(int townId, LastUpdateInfo lastUpdateInfo, List<Citizen> citizens)
        {
            using var connection = new MySqlConnection(Configuration.ConnectionString);
            connection.Open();
            var idLastUpdateInfo = connection.ExecuteScalar<int>(@"INSERT INTO LastUpdateInfo(dateUpdate, idUser)
                                                                   VALUES (@DateUpdate, @IdUser); SELECT LAST_INSERT_ID()", new { DateUpdate = lastUpdateInfo.UpdateTime, IdUser = lastUpdateInfo.UserId });

            var param = new DynamicParameters();
            StringBuilder inBuilder = GenerateInQuery(citizens.Select(x => x.Bag.IdBag), param);
            connection.ExecuteScalar($"DELETE FROM BagItem WHERE idBag {inBuilder}", param);

            var dico = new Dictionary<string, Func<BagItem, object>>() { { "idBag", x => x.IdBag }, { "idItem", x => x.IdItem }, { "count", x => x.Count }, { "isBroken", x => x.IsBroken } };
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
                connection.BulkInsert("BagItem", dico, modeles);
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

        #endregion
    }
}
