using Microsoft.EntityFrameworkCore;
using MyHordesOptimizerApi.Models;

namespace MyHordesOptimizerApi.Services.Impl.Users
{
    /// <summary>Création du joueur absent de Users, depuis l'identité de son jeton.</summary>
    public static class UserCreation
    {
        /// <summary>
        /// Insère (idUser, name) si la ligne manque, sans jamais modifier une ligne existante, même insérée
        /// entre-temps par une requête concurrente. Ne fait rien sans identifiant ou sans pseudo.
        /// </summary>
        public static void EnsureExists(MhoContext db, int userId, string? name)
        {
            if (userId <= 0 || string.IsNullOrEmpty(name)) return;
            // Seul le doublon de clé est toléré, contrairement à INSERT IGNORE qui masquerait aussi une troncature.
            db.Database.ExecuteSqlInterpolated($"INSERT INTO Users (idUser, name) VALUES ({userId}, {name}) ON DUPLICATE KEY UPDATE idUser = idUser");
        }
    }
}
