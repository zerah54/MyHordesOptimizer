using System.Text.RegularExpressions;
using MyHordesOptimizerApi.Dtos.MyHordes;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;

namespace MyHordesOptimizerApi.Extensions
{
    public static class MyHordesExtensions
    {
        /// <summary>
        /// Retire l'empreinte de build que MyHordes insère dans le nom de ses images
        /// (« pictos/r_santac.fc5dfc02.gif » → « pictos/r_santac.gif »).
        /// Indispensable avant de stocker un chemin d'image : les fichiers servis par le site sont
        /// ceux du dépôt local (public/img/hordes_img/), qui ne portent pas cette empreinte — et
        /// celle-ci change à chaque déploiement de leur côté.
        /// Un nom déjà dépourvu d'empreinte est renvoyé tel quel.
        /// </summary>
        public static string RemoveImageFingerprint(string img)
        {
            return string.IsNullOrEmpty(img) ? img : Regex.Replace(img, @"(.*)\.(.*)\.(.*)", "$1.$3");
        }

        public static TownType GetTownType(this MyHordesMap map)
        {
            if (map.City.Hard)
            {
                return TownType.PANDE;
            }
            else if (map.Wid >= 25)
            {
                return TownType.RE;
            }
            else
            {
                return TownType.RNE;
            }
        }
    }
}
