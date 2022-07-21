using MyHordesOptimizerApi.Dtos.MyHordes.MyHordesOptimizer;
using System;
using System.Collections;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.Diagnostics.CodeAnalysis;

namespace MyHordesOptimizerApi.Models.Views.Recipes
{
    [Table("RecipeComplet")]
    public class RecipeCompletModel
    {
        [Column("recipeName")]
        public string RecipeName { get; set; }
        [Column("actionFr")]
        public string ActionFr { get; set; }
        [Column("actionEn")]
        public string ActionEn { get; set; }
        [Column("actionDe")]
        public string ActionDe { get; set; }
        [Column("actionEs")]
        public string ActionEs { get; set; }
        [Column("type")]
        public string Type { get; set; }
        [Column("pictoUid")]
        public string PictoUid { get; set; }
        [Column("stealthy")]
        public bool Stealthy { get; set; }
        [Column("componentItemId")]
        public int ComponentItemId { get; set; }
        [Column("componentCount")]
        public int ComponentCount { get; set; }
        [Column("resultItemId")]
        public int ResultItemId { get; set; }
        [Column("resultProbability")]
        public float ResultProbability { get; set; }
        [Column("resultWeight")]
        public int ResultWeight { get; set; }

    }


    public class RecipeCompletModel_ResultItemEqualityComparer : IEqualityComparer<RecipeCompletModel>
    {
        public bool Equals([AllowNull] RecipeCompletModel x, [AllowNull] RecipeCompletModel y)
        {
            return x.ResultItemId == y.ResultItemId;
        }

        public int GetHashCode([DisallowNull] RecipeCompletModel obj)
        {
            return HashCode.Combine(obj.ResultItemId);
        }
    }

    public class RecipeCompletModel_ComponentItemEqualityComparer : IEqualityComparer<RecipeCompletModel>
    {
        public bool Equals([AllowNull] RecipeCompletModel x, [AllowNull] RecipeCompletModel y)
        {
            return x.ComponentItemId == y.ComponentItemId && x.ComponentCount == y.ComponentCount;
        }

        public int GetHashCode([DisallowNull] RecipeCompletModel obj)
        {
            return HashCode.Combine(obj.ComponentItemId, obj.ComponentCount);
        }
    }
}
