using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.Configuration;
using System;

namespace MyHordesOptimizerApi.Attributes
{
    /// <summary>
    /// Authentification Basic des endpoints d'administration et d'import.
    /// </summary>
    /// <remarks>
    /// Un en-tête <c>Authorization</c> malformé doit valoir 401, jamais 500 : c'est une requête
    /// non authentifiée comme une autre, pas une panne du serveur. La version précédente décodait
    /// sans garde et offrait trois façons de la faire tomber en 500 SANS être authentifié — en-tête
    /// non-Basic (constaté en envoyant un jeton Bearer), en-tête plus court que le préfixe, ou
    /// Basic valide sans « : ». D'où l'analyse en étapes vérifiées plutôt qu'en une expression.
    /// </remarks>
    public class BasicAuthenticationAttribute : ActionFilterAttribute
    {
        private const string Prefixe = "Basic ";

        public override void OnActionExecuting(ActionExecutingContext filterContext)
        {
            if (!EstAutorise(filterContext))
            {
                filterContext.Result = new UnauthorizedResult();
            }
        }

        private static bool EstAutorise(ActionExecutingContext filterContext)
        {
            var identifiants = LireIdentifiants(filterContext.HttpContext.Request.Headers["Authorization"].ToString());
            if (identifiants == null)
            {
                return false;
            }

            var configuration = filterContext.HttpContext.RequestServices.GetService(typeof(IConfiguration)) as IConfiguration;
            var section = configuration?.GetSection("Authentication");
            var username = section?.GetValue<string>("Username");
            var password = section?.GetValue<string>("Password");
            // Une configuration vide n'autorise personne : sans ce garde-fou, un déploiement mal
            // configuré laisserait passer une requête sans identifiants.
            if (string.IsNullOrEmpty(username) || string.IsNullOrEmpty(password))
            {
                return false;
            }

            return identifiants.Value.Nom == username && identifiants.Value.MotDePasse == password;
        }

        /// <summary>
        /// Extrait le couple identifiant / mot de passe d'un en-tête Basic, ou null si l'en-tête
        /// n'en est pas un — quelle qu'en soit la raison.
        /// </summary>
        public static (string Nom, string MotDePasse)? LireIdentifiants(string entete)
        {
            if (string.IsNullOrEmpty(entete) || !entete.StartsWith(Prefixe, StringComparison.OrdinalIgnoreCase))
            {
                return null;
            }

            var encode = entete.Substring(Prefixe.Length).Trim();
            if (encode.Length == 0)
            {
                return null;
            }

            byte[] octets;
            try
            {
                octets = Convert.FromBase64String(encode);
            }
            catch (FormatException)
            {
                return null;
            }

            // Le séparateur est le PREMIER « : » : un mot de passe a parfaitement le droit d'en
            // contenir, découper sur tous les deux-points le tronquerait.
            var decode = System.Text.Encoding.UTF8.GetString(octets);
            var separateur = decode.IndexOf(':');
            if (separateur < 0)
            {
                return null;
            }

            return (decode.Substring(0, separateur), decode.Substring(separateur + 1));
        }
    }
}
