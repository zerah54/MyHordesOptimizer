namespace MyHordesOptimizerApiUnitTests.MyHordesContract
{
    /// <summary>
    /// Un appel du <c>MyHordesApiRepository</c> : l'endpoint visé, le type désérialisé et la
    /// chaîne <c>fields=</c> transmise.
    /// </summary>
    public sealed record MhCall(string Name, string Endpoint, Type DtoType, string Fields);
}
