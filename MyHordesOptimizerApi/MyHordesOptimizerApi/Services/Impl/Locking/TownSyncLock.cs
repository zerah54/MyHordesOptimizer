using System;
using System.Collections.Concurrent;
using System.Threading;
using System.Threading.Tasks;

namespace MyHordesOptimizerApi.Services.Impl.Locking
{
    /// <summary>
    /// Exclusion mutuelle des écritures de synchronisation de ville.
    /// <para>
    /// Remplace l'ancien verrou global unique (<c>MyHordesFetcherService.Lock</c>), qui sérialisait
    /// TOUTES les synchronisations du serveur : au pic de connexions la file dépassait le délai de
    /// nginx et l'API renvoyait des 502. Deux synchronisations ne se gênent que si elles portent sur
    /// la MÊME ville, ce que traduit le verrou par ville.
    /// </para>
    /// <para>
    /// Un import qui écrit sur plusieurs villes à la fois ne peut pas prendre N verrous de ville sans
    /// risque d'interblocage : il prend le verrou global en exclusif (<see cref="AcquireAllTownsAsync"/>),
    /// que les synchronisations tiennent en partagé. Le tourniquet <c>_entryGate</c> donne la priorité
    /// à l'écrivain : sans lui, un flux continu de connexions l'affamerait indéfiniment.
    /// </para>
    /// </summary>
    public sealed class TownSyncLock
    {
        /// <summary>Tenu par l'écrivain global pendant toute son attente : bloque les nouveaux lecteurs.</summary>
        private readonly SemaphoreSlim _entryGate = new(1, 1);
        /// <summary>Protège <see cref="_readerCount"/>.</summary>
        private readonly SemaphoreSlim _readerCountGate = new(1, 1);
        /// <summary>Pris par le premier lecteur et relâché par le dernier ; pris tel quel par l'écrivain.</summary>
        private readonly SemaphoreSlim _writeGate = new(1, 1);
        private int _readerCount;

        /// <summary>
        /// Un sémaphore par ville. Jamais retiré : une entrée pèse quelques dizaines d'octets et le
        /// nombre de villes vues par une instance reste de l'ordre du millier, alors qu'un retrait
        /// concurrent d'un sémaphore en cours d'acquisition serait une source de bugs subtils.
        /// </summary>
        private readonly ConcurrentDictionary<int, SemaphoreSlim> _townGates = new();

        /// <summary>
        /// Réserve l'écriture sur une ville. Le verrou global n'est tenu qu'en partagé : les autres
        /// villes continuent de se synchroniser en parallèle.
        /// </summary>
        public async Task<IAsyncDisposable> AcquireTownAsync(int townId)
        {
            await AcquireSharedAsync();
            var townGate = _townGates.GetOrAdd(townId, _ => new SemaphoreSlim(1, 1));
            try
            {
                await townGate.WaitAsync();
            }
            catch
            {
                await ReleaseSharedAsync();
                throw;
            }
            return new Releaser(this, townGate);
        }

        /// <summary>
        /// Réserve l'écriture sur l'ensemble des villes, pour un traitement qui en touche plusieurs
        /// (import de l'historique d'un joueur). Attend que toutes les synchronisations en cours
        /// soient terminées et empêche les suivantes de démarrer.
        /// </summary>
        public async Task<IAsyncDisposable> AcquireAllTownsAsync()
        {
            await _entryGate.WaitAsync();
            try
            {
                await _writeGate.WaitAsync();
            }
            catch
            {
                _entryGate.Release();
                throw;
            }
            return new Releaser(this, townGate: null);
        }

        private async Task AcquireSharedAsync()
        {
            // Le tourniquet est tenu pendant toute la section : un écrivain qui l'obtient est certain
            // qu'aucun lecteur ne peut plus incrémenter le compteur derrière lui.
            await _entryGate.WaitAsync();
            try
            {
                await _readerCountGate.WaitAsync();
                try
                {
                    if (++_readerCount == 1)
                    {
                        await _writeGate.WaitAsync();
                    }
                }
                finally
                {
                    _readerCountGate.Release();
                }
            }
            finally
            {
                _entryGate.Release();
            }
        }

        private async Task ReleaseSharedAsync()
        {
            await _readerCountGate.WaitAsync();
            try
            {
                if (--_readerCount == 0)
                {
                    _writeGate.Release();
                }
            }
            finally
            {
                _readerCountGate.Release();
            }
        }

        private void ReleaseExclusive()
        {
            _writeGate.Release();
            _entryGate.Release();
        }

        private sealed class Releaser : IAsyncDisposable
        {
            private readonly TownSyncLock _owner;
            private readonly SemaphoreSlim _townGate;
            private bool _released;

            public Releaser(TownSyncLock owner, SemaphoreSlim townGate)
            {
                _owner = owner;
                _townGate = townGate;
            }

            public async ValueTask DisposeAsync()
            {
                if (_released)
                {
                    return;
                }
                _released = true;
                if (_townGate == null)
                {
                    _owner.ReleaseExclusive();
                    return;
                }
                _townGate.Release();
                await _owner.ReleaseSharedAsync();
            }
        }
    }
}
