using Microsoft.IdentityModel.Tokens;
using MyHordesOptimizerApi.Configuration.Interfaces;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Repository.Interfaces;
using Org.BouncyCastle.Crypto;
using Org.BouncyCastle.Crypto.Parameters;
using Org.BouncyCastle.OpenSsl;
using Org.BouncyCastle.Security;
using System;
using System.IdentityModel.Tokens.Jwt;
using System.IO;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace MyHordesOptimizerApi.Repository.Impl
{
    public class MyHordesOptimizerFirebaseRepository : IMyHordesOptimizerFirebaseRepository
    {
        protected IMyHordesOptimizerFirebaseConfiguration Configuration { get; set; }

        public MyHordesOptimizerFirebaseRepository(IMyHordesOptimizerFirebaseConfiguration configuration)
        {
            Configuration = configuration;
        }

        public void PatchTown(Town town)
        {
            var token = GenerateToken();
        }

        private string GenerateToken()
        {
            using RSA rsa = RSA.Create();
            var rsaParams = GetRsaParameters(Configuration.PrivateKey);
            rsa.ImportParameters(rsaParams);

            var signingCredentials = new SigningCredentials(new RsaSecurityKey(rsa), SecurityAlgorithms.RsaSha256)
            {
                CryptoProviderFactory = new CryptoProviderFactory { CacheSignatureProviders = false }
            };

            var myIssuer = Configuration.ClientEmail;
            var myAudience = Configuration.TokenUri;

            var tokenHandler = new JwtSecurityTokenHandler();
            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Expires = DateTime.UtcNow.AddDays(7),
                Issuer = myIssuer,
                Audience = myAudience,
                SigningCredentials = signingCredentials
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
    }
}
