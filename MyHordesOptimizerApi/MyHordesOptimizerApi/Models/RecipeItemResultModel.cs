using System.ComponentModel.DataAnnotations.Schema;

namespace MyHordesOptimizerApi.Models
{
    [Table("RecipeItemResult")]
    public class RecipeItemResultModel
    {
        [Column("recipeName")]
        public string RecipeName { get; set; }
        [Column("idItem")]
        public int IdItem { get; set; }
        [Column("weight")]
        public int Weight { get; set; }
        [Column("probability")]
        public float Probability { get; set; }

    }
}
