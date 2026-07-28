namespace MyHordesOptimizerApiUnitTests.MyHordesContract
{
    /// <summary>
    /// Un champ demandé dans une chaîne <c>fields=</c>, avec ses éventuels sous-champs.
    /// Reflète la structure produite par <c>SURLL_parser</c> côté MyHordes.
    /// </summary>
    public sealed record SurllField(string Name, IReadOnlyList<SurllField> Fields)
    {
        public override string ToString() => Fields.Count == 0
            ? Name
            : $"{Name}.fields({string.Join(',', Fields)})";
    }
}
