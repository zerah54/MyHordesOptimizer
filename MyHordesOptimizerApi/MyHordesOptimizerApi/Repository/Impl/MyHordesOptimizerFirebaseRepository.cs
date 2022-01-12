using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;
using MyHordesOptimizerApi.Attributes.Firebase;
using MyHordesOptimizerApi.Configuration.Interfaces;
using MyHordesOptimizerApi.Dtos.MyHordes;
using MyHordesOptimizerApi.Dtos.MyHordes.MyHordesOptimizer;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Extensions;
using MyHordesOptimizerApi.Repository.Abstract;
using MyHordesOptimizerApi.Repository.Interfaces;
using Org.BouncyCastle.Crypto.Parameters;
using Org.BouncyCastle.OpenSsl;
using Org.BouncyCastle.Security;
using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.IO;
using System.Net.Http;
using System.Net.Mime;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace MyHordesOptimizerApi.Repository.Impl
{
    public class MyHordesOptimizerFirebaseRepository : AbstractWebApiRepositoryBase, IMyHordesOptimizerFirebaseRepository
    {
        protected IMyHordesOptimizerFirebaseConfiguration Configuration { get; set; }

        public override string HttpClientName => nameof(MyHordesOptimizerFirebaseRepository);

        private const string _townCollection = "towns";
        private const string _heroSkillCollection = "Wiki/heroSkills";
        private const string _itemCollection = "Wiki/items";
        private const string _recipeCollection = "Wiki/recipes";
        private const string _parameterAuth = "auth";

        public MyHordesOptimizerFirebaseRepository(ILogger<AbstractWebApiRepositoryBase> logger,
            IHttpClientFactory httpClientFactory,
            IMyHordesOptimizerFirebaseConfiguration configuration) : base(logger, httpClientFactory)
        {
            Configuration = configuration;
        }

        #region Town

        public void PatchTown(Town town)
        {
            var url = $"{Configuration.Url}/{_townCollection}/{town.Id}/{nameof(town.MyHordesMap)}.json";
            url = AddAuthentication(url);
            base.Patch(url: url, body: town.MyHordesMap);

            PatchCitizen(town.Id, town.Citizens);
            PutBank(town.Id, town.Bank);
        }

        public Town GetTown(int townId)
        {
            var url = $"{Configuration.Url}/{_townCollection}/{townId}.json";
            url = AddAuthentication(url);
            return base.Get<Town>(url);
        }

        #endregion

        #region HeroSkill

        public void PatchHeroSkill(IEnumerable<HeroSkill> heroSkills)
        {
            foreach (var heroSkill in heroSkills)
            {
                foreach (var prop in typeof(HeroSkill).GetProperties())
                {
                    var hehe = prop.GetCustomAttributes(typeof(FirebaseIgnoreOnPatch), inherit: true);
                    if (hehe.Length == 0)
                    {
                        var value = prop.GetValue(heroSkill);
                        var url = $"{Configuration.Url}/{_heroSkillCollection}/{heroSkill.Name}/{prop.Name}.json";
                        url = AddAuthentication(url);
                        base.Put(url: url, body: value);
                    }
                }
            }
        }

        public Dictionary<string, HeroSkill> GetHeroSkills()
        {
            var url = $"{Configuration.Url}/{_heroSkillCollection}.json";
            url = AddAuthentication(url);
            return base.Get<Dictionary<string, HeroSkill>>(url);
        }


        #endregion

        #region Items

        public void PatchItems(List<Item> items)
        {
            foreach (var item in items)
            {
                var url = $"{Configuration.Url}/{_itemCollection}/{item.XmlId}.json";
                url = AddAuthentication(url);
                base.Patch(url: url, body: item);
            }
        }

        public List<Item> GetItems()
        {
            var url = $"{Configuration.Url}/{_itemCollection}.json";
            url = AddAuthentication(url);
            var list = base.Get<List<Item>>(url);
            list.RemoveAll(x => x == null);
            return list;
        }

        public Item GetItemsById(int itemId)
        {
            var url = $"{Configuration.Url}/{_itemCollection}/{itemId}.json";
            url = AddAuthentication(url);
            var item = base.Get<Item>(url);
            return item;
        }

        #endregion

        #region Recipes

        public void PatchRecipes(List<ItemRecipe> recipes)
        {
            foreach (var recipe in recipes)
            {
                var url = $"{Configuration.Url}/{_recipeCollection}/{recipe.Name}.json";
                url = AddAuthentication(url);
                base.Patch(url: url, body: recipe);
            }
        }

        public Dictionary<string, ItemRecipe> GetRecipes()
        {
            var url = $"{Configuration.Url}/{_recipeCollection}.json";
            url = AddAuthentication(url);
            return base.Get<Dictionary<string, ItemRecipe>>(url);
        }

        #endregion

        #region Bank

        public void PutBank(int townId, BankWrapper bank)
        {
            var url = $"{Configuration.Url}/{_townCollection}/{townId}/{nameof(Town.Bank)}.json";
            url = AddParameterToQuery(url, "auth", Configuration.Secret);
            base.Put(url: url, body: bank);
        }

        #endregion

        #region WishList

        public void PutWishList(int townId, WishListWrapper wishList)
        {
            var url = $"{Configuration.Url}/{_townCollection}/{townId}/{nameof(WishListWrapper.WishList)}.json";
            url = AddParameterToQuery(url, "auth", Configuration.Secret);
            base.Put(url: url, body: wishList);
        }

        #endregion

        #region Citizens

        public void PatchCitizen(int townId, CitizensWrapper wrapper)
        {
            foreach (var citizen in wrapper.Citizens)
            {
                var url = $"{Configuration.Url}/{_townCollection}/{townId}/{nameof(Town.Citizens)}/{nameof(CitizensWrapper.Citizens)}/{citizen.Value.Name}.json";
                url = AddParameterToQuery(url, "auth", Configuration.Secret);
                base.Patch(url: url, body: citizen.Value);
            }

            var urlLastUpdate = $"{Configuration.Url}/{_townCollection}/{townId}/{nameof(Town.Citizens)}/{nameof(CitizensWrapper.LastUpdateInfo)}.json";
            urlLastUpdate = AddParameterToQuery(urlLastUpdate, "auth", Configuration.Secret);
            base.Patch(url: urlLastUpdate, body: wrapper.LastUpdateInfo);
        }

        #endregion

        private string AddAuthentication(string url)
        {
            url = AddParameterToQuery(url, _parameterAuth, Configuration.Secret);
            return url;
        }

        protected override HttpContent GenerateJsonContent(object body)
        {
            var stringBody = body?.ToFirebaseJson();
            if (stringBody == null)
            {
                stringBody = string.Empty;
            }
            Logger.LogDebug($"Request [HttpBody={stringBody}]");
            return new StringContent(stringBody, Encoding.UTF8, MediaTypeNames.Application.Json);
        }

        // Ne marche pas
        #region tentative de token

        private string GenerateToken()
        {
            using RSA rsa = RSA.Create();
            var rsaParams = GetRsaParameters(Configuration.PrivateKey);
            rsa.ImportParameters(rsaParams);

            RsaSecurityKey key = new RsaSecurityKey(rsa);
            key.KeyId = Configuration.PrivateKeyId;
            var signingCredentials = new SigningCredentials(key, SecurityAlgorithms.RsaSha256)
            {
                CryptoProviderFactory = new CryptoProviderFactory { CacheSignatureProviders = false },
            };

            // Create a collection of optional claims
            var now = DateTimeOffset.UtcNow;
            var claims = new Claim[]
            {
            new Claim(JwtRegisteredClaimNames.Sub, Configuration.ClientEmail),
            new Claim(JwtRegisteredClaimNames.Iat, now.ToUnixTimeSeconds().ToString(), ClaimValueTypes.Integer64),
            new Claim("uid", Configuration.ClientId, ClaimValueTypes.String),
            new Claim("premium_account", "true", ClaimValueTypes.Boolean)
            };

            var myAudience = Configuration.TokenUri;

            var tokenHandler = new JwtSecurityTokenHandler();
            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Expires = DateTime.UtcNow.AddDays(7),
                Issuer = Configuration.ClientEmail,
                Audience = "https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit",
                SigningCredentials = signingCredentials,
            };

            var token = tokenHandler.CreateToken(tokenDescriptor);
            return tokenHandler.WriteToken(token);
        }

        private static RSAParameters GetRsaParameters(string rsaPrivateKey)
        {
            var byteArray = Encoding.ASCII.GetBytes(rsaPrivateKey);
            RsaPrivateCrtKeyParameters keyPair;
            using (var sr = new StringReader(rsaPrivateKey))
            {
                PemReader pr = new PemReader(sr);
                keyPair = (RsaPrivateCrtKeyParameters)pr.ReadObject();
            }

            RSAParameters rsaParams = DotNetUtilities.ToRSAParameters(keyPair);
            return rsaParams;
        }

        #endregion
    }
}
