namespace MyHordesOptimizerApi.Models;

/// <summary>Correspondance entre l'id d'une pré-ville et les clés de sa ville fantôme (Town.IdTown / Town.MapId).</summary>
public static class PreTownIds
{
    public const int Offset = 1_000_000_000;

    public static int ToMapId(int preTownId) => Offset + preTownId;

    public static int ToIdTown(int preTownId) => -(Offset + preTownId);

    public static bool IsPreTownMapId(int mapId) => mapId > Offset;

    public static bool IsPreTownIdTown(int idTown) => idTown < -Offset;
}
