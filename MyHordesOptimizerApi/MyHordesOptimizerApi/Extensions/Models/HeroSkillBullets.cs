using System.Collections.Generic;

namespace MyHordesOptimizerApi.Extensions.Models
{
    /// <summary>
    /// Avantages d'un niveau de l'arbre de compétences héros (« bullets » de capacities.json), stockés par langue
    /// en tableau JSON dans les colonnes bullets_fr/en/es/de de HeroSkills.
    /// </summary>
    public static class HeroSkillBullets
    {
        /// <summary>Tableau JSON des puces, ou null s'il n'y en a aucune (compétence hors de l'arbre).</summary>
        public static string? Serialize(IReadOnlyCollection<string>? bullets)
        {
            return bullets is null || bullets.Count == 0 ? null : bullets.ToJson();
        }

        /// <summary>Puces relues depuis la colonne ; liste vide, jamais null, quand la colonne est vide.</summary>
        public static List<string> Deserialize(string? json)
        {
            if (string.IsNullOrWhiteSpace(json))
            {
                return new List<string>();
            }
            return json.FromJson<List<string>?>() ?? new List<string>();
        }
    }
}
