namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.MapRoutes
{
    /// <summary>
    /// Événement temps réel « tracé modifié » : ni contenu ni visibilité, pour ne rien révéler d'un tracé privé.
    /// Chaque client relit GET MapRoutes/{mapId}/{id} (404 = tracé à retirer).
    /// </summary>
    public class MapRouteChangeDto
    {
        public int Id { get; set; }
        public int Version { get; set; }
    }
}
