using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;
using Newtonsoft.Json;
using System;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;

namespace MyHordesOptimizerApi.Extensions
{
    public static class AuthorizationExtension
    {
        /// <summary>
        /// Extension method to add jwt auth
        /// </summary>
        /// <param name="services"></param>
        /// <param name="configuration"></param>
        public static IServiceCollection AddBearerAuthentication(this IServiceCollection services, IConfiguration configuration)
        {
            var secret = configuration["Authentication:Jwt:Secret"];
            var issuer = configuration["Authentication:Jwt:Issuer"];
            var audiences = configuration["Authentication:Jwt:Audience"];

            var validationParams = new TokenValidationParameters()
            {
                ValidIssuer = issuer,
                ValidAudiences = [audiences],
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.ASCII.GetBytes(secret)),
                ValidateIssuer = true,
                ValidateAudience = true,
                ClockSkew = TimeSpan.Zero
            };

            var events = new JwtBearerEvents()
            {
                // invoked when the token validation fails
                OnAuthenticationFailed = (context) =>
                {
                    context.NoResult();
                    if (!context.Response.HasStarted)
                    {
                        context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                        context.Response.ContentType = "application/json";

                        var response = new JsonResult(
                            new { errorType = "Authentication error", errorMessage = context.Exception.Message });


                        if (context.Exception.GetType() == typeof(SecurityTokenExpiredException))
                        {
                            context.Response.Headers.Add("Token-Expired", "true");
                            response = new JsonResult(
                                new { errorType = "Authentication error", errorMessage = "The access token provided has expired." });
                        }
                        context.Response.WriteAsync(JsonConvert.SerializeObject(response.Value));
                    }
                    return Task.CompletedTask;
                },

                // invoked when a request is received
                OnMessageReceived = (context) =>
                {
                    return Task.CompletedTask;
                },

                // invoked when token is validated
                OnTokenValidated = (context) =>
                {
                    var jwtToken = (JsonWebToken)context.SecurityToken;

                    var clone = context.Principal.Clone();
                    var newIdentity = (ClaimsIdentity)clone.Identity;
                    foreach (var tokenClaim in jwtToken.Claims)
                    {
                        newIdentity.AddClaim(tokenClaim);
                    }
                    return Task.CompletedTask;
                },

                OnForbidden = (context) =>
                {
                    return Task.CompletedTask;
                },

                OnChallenge = (context) =>
                {
                    return Task.CompletedTask;
                }
            };

            services.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme
                    = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultChallengeScheme
                    = JwtBearerDefaults.AuthenticationScheme;
            })
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = validationParams;
                options.Events = events;
            });

            return services;
        }
    }
}
