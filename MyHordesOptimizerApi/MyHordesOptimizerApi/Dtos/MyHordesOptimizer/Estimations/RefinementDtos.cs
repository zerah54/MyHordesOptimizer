using MyHordesOptimizerApi.Services.Impl.Estimations.Refinement;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Estimations
{
    /// <summary>Envoi d'un scan : entrées reçues de GET input et seeds candidats (base64 d'uint32 petit-boutistes).</summary>
    public class RefinementUploadDto
    {
        public RefinementInput Input { get; set; } = new();
        public string Candidates { get; set; } = "";
    }

    public enum RefinementStatus
    {
        None,
        Valid,
        Invalid
    }

    /// <summary>Vue partagée d'un affinage : la plage, jamais les seeds.</summary>
    public class RefinementViewDto
    {
        public RefinementStatus Status { get; set; }
        public int? AttackMin { get; set; }
        public int? AttackMax { get; set; }
        public int? ReductionMin { get; set; }
        public int? ReductionMax { get; set; }
        public bool NoCompatibleConfiguration { get; set; }
        public LastUpdateInfoDto? LastUpdateInfo { get; set; }
    }

    /// <summary>Les saisies ont changé de façon incompatible pendant le scan.</summary>
    public class RefinementConflictException : System.Exception
    {
    }
}
