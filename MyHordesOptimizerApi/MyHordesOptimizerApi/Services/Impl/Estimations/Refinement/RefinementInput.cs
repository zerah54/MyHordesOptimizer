namespace MyHordesOptimizerApi.Services.Impl.Estimations.Refinement
{
    /// <summary>Paramètres du modèle MyHordes pour un jour d'attaque (RefinerParams du site, sans soul_attack).</summary>
    public sealed record RefinementParams
    {
        public int BaseLoRand { get; init; }
        public int BaseHiRand { get; init; }
        public int OffSum { get; init; }
        public int Protect { get; init; }
        public int Blocks { get; init; }
        public double[] SoulTdg { get; init; } = new double[25];
        public double[] SoulPlanif { get; init; } = new double[25];
        public double ShiftSpan { get; init; }
        public int ShiftSteps { get; init; }
        public int MinGlobal { get; init; }
        public int MaxGlobal { get; init; }
        public bool ReboundPossible { get; init; }
        public bool Fireworks { get; init; }
    }

    /// <summary>
    /// Entrées d'un scan : 100 contraintes (tour min 0..24 / max 25..49, planif min 50..74 / max 75..99,
    /// NoConstraint si non saisi) et, sous feux d'artifice, les paliers planif pré-explosion.
    /// </summary>
    public sealed record RefinementInput
    {
        public int[] Observed { get; init; } = new int[100];
        public int[]? ObservedPlanif { get; init; }
        public RefinementParams Params { get; init; } = new();

        /// <summary>Tailles attendues des tableaux (une entrée reçue d'un client peut être malformée).</summary>
        public bool IsWellFormed() =>
            Observed?.Length == 100 && (ObservedPlanif is null || ObservedPlanif.Length == 100)
            && Params?.SoulTdg?.Length == 25 && Params.SoulPlanif?.Length == 25;
    }
}
