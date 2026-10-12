namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Map
{
    /// <summary>Saisie de l'aménagement d'une zone pour le camping.</summary>
    public class CampImprovementUpdateDto
    {
        public const int MaxCount = 100;
        public const int MaxLevel = 1000;

        public int X { get; set; }
        public int Y { get; set; }

        /// <summary>Améliorations ajoutées (+5 chacune), négatif pour annuler.</summary>
        public int Improvements { get; set; }

        /// <summary>Objets de défense installés (+9 chacun), négatif pour annuler.</summary>
        public int DefenseObjects { get; set; }

        /// <summary>Niveau constaté aujourd'hui, qui remplace le niveau connu avant les ajouts. <c>null</c> : on part du niveau connu.</summary>
        public int? Level { get; set; }
    }
}
