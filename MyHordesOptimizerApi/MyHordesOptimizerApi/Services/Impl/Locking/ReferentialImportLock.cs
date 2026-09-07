using System.Threading;
using System.Threading.Tasks;

namespace MyHordesOptimizerApi.Services.Impl.Locking
{
    /// <summary>
    /// Exclusion mutuelle des imports référentiels globaux (objets, bâtiments, ruines). Ces imports
    /// vident puis réécrivent des tables sans <c>IdTown</c> (ItemProperty, BuildingRessources,
    /// RecipeItemComponent, ItemAction, RecipeItemResult, RuinItemDrop) : <see cref="TownSyncLock"/>,
    /// verrou par ville, ne peut rien y coordonner. Sans exclusion, deux imports concurrents
    /// verrouillent ces tables côté MySQL dans un ordre non garanti d'une transaction à l'autre —
    /// risque de deadlock, en plus de la course sur les <c>DELETE FROM</c> sans clause <c>WHERE</c>.
    /// </summary>
    /// <remarks>
    /// Une seule ressource à protéger (pas une par ville) : un simple sémaphore global suffit, sur le
    /// même principe que l'ancien verrou statique d'<c>ExpeditionService</c> avant sa migration vers
    /// <see cref="TownSyncLock"/> — sans la cérémonie <c>IAsyncDisposable</c> de celui-ci, inutile ici.
    /// </remarks>
    public sealed class ReferentialImportLock
    {
        private readonly SemaphoreSlim _gate = new(1, 1);

        public Task WaitAsync() => _gate.WaitAsync();

        public void Release() => _gate.Release();
    }
}
