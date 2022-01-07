using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;
using MyHordesOptimizerApi.Attributes.Firebase;
using MyHordesOptimizerApi.Configuration.Interfaces;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
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

            foreach (var citizen in town.MyHordesMap.Citizens)
            {
                url = $"{Configuration.Url}/{_townCollection}/{town.Id}/{nameof(town.Citizens)}/{citizen.Name}.json";
                url = AddParameterToQuery(url, "auth", Configuration.Secret);
                base.Patch(url: url, body: citizen);
            }
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

        #endregion

        private string AddAuthentication(string url)
        {
            url = AddParameterToQuery(url, _parameterAuth, Configuration.Secret);
            return url;
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
