namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Map
{
    /// <summary>Aménagement d'une zone pour le camping après une saisie.</summary>
    public class CampImprovementDto
    {
        /// <summary>Niveau au jour de la ville.</summary>
        public int Level { get; set; }

        /// <summary>Jour de la ville, celui de la saisie.</summary>
        public int Day { get; set; }
    }
}
