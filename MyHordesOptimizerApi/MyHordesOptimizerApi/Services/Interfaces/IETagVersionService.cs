namespace MyHordesOptimizerApi.Services.Interfaces
{
    /// <summary>
    /// Ressources versionnables par <see cref="MyHordesOptimizerApi.Controllers.ActionFillters.ETagCacheFilter"/>.
    /// Ajouter un endpoint = une valeur ici + une branche dans ETagVersionService, jamais une nouvelle classe.
    /// </summary>
    public enum ETagResource
    {
        Bank,
        Citizens,
        WishList,
        Map,
        MapDigs,
        NoteMyTown,
        NoteMyUser,
        NoteUser,
        NoteMyCitizen,
        NoteMyCitizenForUser
    }

    /// <summary>
    /// Calcule une clé de version bon marché (jamais le payload complet) pour une ressource GET.
    /// Toujours "count:max" sur la colonne IdLastUpdateInfo/horodatage concernée : le compte détecte
    /// les suppressions, que Max seul ne voit pas. Retourne null quand aucune version fiable n'existe
    /// (ville jamais synchronisée, townId absent) : le filtre saute alors l'ETag pour cette requête.
    /// </summary>
    public interface IETagVersionService
    {
        string? GetVersion(ETagResource resource, int? id, int currentUserId);
    }
}
