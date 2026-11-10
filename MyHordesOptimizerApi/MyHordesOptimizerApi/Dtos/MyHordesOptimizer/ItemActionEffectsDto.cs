using System.Collections.Generic;
using Newtonsoft.Json.Converters;
using System.Text.Json.Serialization;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer
{
    /// <summary>Action d'un objet et ses issues probabilisées, décodées depuis actions.json.</summary>
    public class ItemActionEffectsDto
    {
        public string ActionName { get; set; } = null!;
        public ItemActionKind Kind { get; set; }
        public int? ApCost { get; set; }
        public BuildingConditionDto? BuildingCondition { get; set; }
        public bool? AppliesToTown { get; set; }
        public ItemSummaryDto? ViaLoadedForm { get; set; }
        public List<ActionOutcomeDto> Outcomes { get; set; } = new();
    }

    /// <summary>Une issue d'action avec sa probabilité (0 à 1).</summary>
    public class ActionOutcomeDto
    {
        public ActionOutcomeKind Kind { get; set; }
        public double Probability { get; set; }
        public ItemSummaryDto? Item { get; set; }
        public int? Quantity { get; set; }
        /// <summary>Zombies tués au minimum ; null/null sur une issue Kill = tous les zombies de la case.</summary>
        public int? KillMin { get; set; }
        /// <summary>Zombies tués au maximum ; null/null sur une issue Kill = tous les zombies de la case.</summary>
        public int? KillMax { get; set; }
    }

    public class BuildingConditionDto
    {
        public string BuildingUid { get; set; } = null!;
        public bool Built { get; set; }
    }

    public class ChargeChanceDto
    {
        public int Charges { get; set; }
        public double Probability { get; set; }
    }

    [Newtonsoft.Json.JsonConverter(typeof(StringEnumConverter))]
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public enum ItemActionKind
    {
        Open,
        Slaughter,
        Purify,
        Attack,
        Nightwatch,
    }

    [Newtonsoft.Json.JsonConverter(typeof(StringEnumConverter))]
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public enum ActionOutcomeKind
    {
        Consumed,
        Broken,
        Transformed,
        Produced,
        Kill,
    }
}
