using System.Collections.Generic;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer
{
    public class SimpleMeDto
    {
        public int Id { get; set; }
        public string UserName { get; set; }
        public string? Avatar { get; set; }
        public SimpleMeTownDetailDto TownDetails { get; set; }
        public SimpleMeJobDetailDto JobDetails { get; set; }

        public SimpleMeDto()
        {
            TownDetails = new SimpleMeTownDetailDto();
            JobDetails = new SimpleMeJobDetailDto();
        }
    }

    public class SimpleMeTownDetailDto
    {
        public int TownId { get; set; }
        public int TownX { get; set; }
        public int TownY { get; set; }
        public int TownMaxX { get; set; }
        public int TownMaxY { get; set; }
        public bool IsDevaste { get; set; }
        public bool IsChaos { get; set; }
        public string TownType { get; set; }
        public int Day { get; set; }

        /// <summary>
        /// La ville a-t-elle activé l'option d'API externe de MyHordes ? Null tant qu'on ne l'a pas
        /// constaté.
        /// </summary>
        /// <remarks>
        /// Le site s'en sert pour n'autoriser la saisie manuelle du niveau de maison que là où la
        /// donnée ne peut pas arriver : sans API externe, pas de <c>baseDef</c>, donc pas de niveau
        /// déduit. Partout ailleurs une saisie serait écrasée à la synchronisation suivante.
        /// </remarks>
        public bool? HasExternalApi { get; set; }
    }

    public class SimpleMeJobDetailDto
    {
        public string Uid { get; set;}
        public int Id { get; set;}
        public IDictionary<string, string> Description { get; set; }
        public IDictionary<string, string> Label { get; set; }

    }
}
