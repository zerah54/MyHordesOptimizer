using System.Collections.Generic;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.BuildingPlans
{
    /// <summary>Contenu JSON d'une proposition de plan ; stocké tel quel dans <c>TownBuildingPlan.Content</c>.</summary>
    public class BuildingPlanContentDto
    {
        /// <summary>Null = attaque pré-remplie côté site (affinage, sinon estimation).</summary>
        public int? AttackOverride { get; set; }
        public int AllowedOverflow { get; set; }
        /// <summary><c>Building.IdBuilding</c> du chantier voté le soir, ou null.</summary>
        public int? EveningVoteBuildingId { get; set; }
        /// <summary>Second chantier voté le soir, compté seulement si le Brasier Sacrificiel est construit ; null sinon.</summary>
        public int? EveningSecondVoteBuildingId { get; set; }
        /// <summary>Gestion des bannis activée à la main sur cette proposition.</summary>
        public bool ManageBanned { get; set; }
        public int BasePa { get; set; } = 19;
        public List<PlanCitizenDto> Citizens { get; set; } = new();
        public List<PlanTownLineDto> TownLines { get; set; } = new();
        public PlanProgramsDto Programs { get; set; } = new();
        public List<PlanDefenseSourceDto> DefenseSources { get; set; } = new();
        /// <summary>Consignes du jour (texte libre).</summary>
        public string? Instructions { get; set; }
        /// <summary>Niveau de plan estimé (0-2) par <c>Building.IdBuilding</c>, utilisé en Pandémonium.</summary>
        public Dictionary<int, int> PlanTiers { get; set; } = new();
        /// <summary>Pertes prévues cette nuit : chantier laissé détruire ou bonus d'évolution perdu.</summary>
        public List<PlanLossDto> Losses { get; set; } = new();
        /// <summary><c>simple</c> ou <c>detailed</c> ; null = détaillé.</summary>
        public string? BudgetMode { get; set; }
        /// <summary>Palier de PA de base du mode simple : <c>b6</c> ou <c>b7</c> ; null = non choisi.</summary>
        public string? BasePaTier { get; set; }
        /// <summary>PA de rab prévus pour les expéditions (mode simple).</summary>
        public int ExpeditionRab { get; set; }
        /// <summary>Budget figé à la validation du plan (tous modes de budget) ; null = non validé.</summary>
        public ValidatedBudgetDto? ValidatedBudget { get; set; }
    }
    public class ValidatedBudgetDto
    {
        /// <summary>Date ISO de la validation.</summary>
        public string ValidatedAt { get; set; } = "";
        /// <summary>Budget et coût par poche (<c>banned</c> / <c>regular</c>).</summary>
        public Dictionary<string, ValidatedPoolDto> Pools { get; set; } = new();
        public List<ValidatedStepDto> Steps { get; set; } = new();
    }
    public class ValidatedPoolDto
    {
        public int Budget { get; set; }
        public int Cost { get; set; }
    }
    public class ValidatedStepDto
    {
        /// <summary><c>Building.IdBuilding</c> du chantier.</summary>
        public int BuildingId { get; set; }
        /// <summary><c>build</c> ou <c>repair</c>.</summary>
        public string Kind { get; set; } = "build";
        /// <summary>Poche de l'étape : <c>banned</c> ou <c>regular</c>.</summary>
        public string Pool { get; set; } = "regular";
        public int PaCost { get; set; }
        /// <summary>PA déjà investis dans le chantier au moment de la validation.</summary>
        public int Invested { get; set; }
        /// <summary>PV du chantier au moment de la validation (réparations) ; 0 pour une construction.</summary>
        public int Life { get; set; }
    }
    public class PlanLossDto
    {
        /// <summary><c>Building.IdBuilding</c> du chantier construit concerné.</summary>
        public int BuildingId { get; set; }
        /// <summary><c>destroyed</c> (détruit pendant l'attaque, perdu dès le lendemain) ou <c>bonus</c> (bonus d'évolution perdu la nuit même).</summary>
        public string Kind { get; set; } = "destroyed";
    }

    public class PlanCitizenDto
    {
        public int UserId { get; set; }
        public int? BasePaOverride { get; set; }
        /// <summary>Ouvrier (mode simple).</summary>
        public bool Worker { get; set; }
        /// <summary>Goule simulée dans ce plan ; null = état renseigné dans la page citoyens.</summary>
        public bool? Ghoul { get; set; }
        /// <summary>Bannissement simulé dans ce plan ; null = état réel du citoyen.</summary>
        public bool? Banned { get; set; }
        public List<PlanTaskDto> Tasks { get; set; } = new();
    }

    public class PlanTaskDto
    {
        /// <summary>Identifiant stable de la consigne (clé des coches « fait »), unique pour un citoyen.</summary>
        public string? Id { get; set; }
        /// <summary><c>home</c>, <c>homeUpgrade</c>, <c>action</c> ou <c>free</c>.</summary>
        public string Kind { get; set; } = "free";
        public string? Ref { get; set; }
        public int? Level { get; set; }
        /// <summary>Action utilisable plusieurs fois par jour (fouilles des galeries du Fouineur) : utilisations prévues ; null = une.</summary>
        public int? Count { get; set; }
        public string? Label { get; set; }
        public int Pa { get; set; }
    }

    public class PlanTownLineDto
    {
        public string Label { get; set; } = "";
        /// <summary><c>banned</c> ou <c>regular</c>.</summary>
        public string Pool { get; set; } = "regular";
        /// <summary>Positif = PA ajoutés au budget, négatif = PA retirés.</summary>
        public int Pa { get; set; }
    }

    public class PlanProgramsDto
    {
        public List<PlanStepDto> Banned { get; set; } = new();
        public List<PlanStepDto> Regular { get; set; } = new();
    }

    public class PlanStepDto
    {
        /// <summary><c>Building.IdBuilding</c> ; null pour une consigne.</summary>
        public int? BuildingId { get; set; }
        /// <summary><c>build</c>, <c>repair</c> ou <c>instruction</c>.</summary>
        public string Kind { get; set; } = "build";
        /// <summary><c>finish</c>, <c>leave</c> ou <c>survive</c> ; null pour un contenu antérieur (déduit de <see cref="TargetRemaining"/>).</summary>
        public string? Mode { get; set; }
        /// <summary>Mode <c>leave</c> : PA restants (construction) ou PV manquants (réparation) après l'étape.</summary>
        public int TargetRemaining { get; set; }
        /// <summary>Note courte attachée à une étape de chantier.</summary>
        public string? Note { get; set; }
        /// <summary>Texte d'une consigne.</summary>
        public string? Text { get; set; }
    }

    public class PlanDefenseSourceDto
    {
        public string Label { get; set; } = "";
        public int Pa { get; set; }
        public int Def { get; set; }
        public int Qty { get; set; } = 1;
    }
}
