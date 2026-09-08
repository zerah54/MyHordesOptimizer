using FluentAssertions;
using MyHordesOptimizerApi.Services.Impl.Locking;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Xunit;

namespace MyHordesOptimizerApiUnitTests.Locking
{
    /// <summary>
    /// AcquireTownsAsync remplace AcquireAllTownsAsync pour l'import de pictos (touche plusieurs
    /// villes à la fois) : verrouiller uniquement les villes concernées plutôt que tout le serveur.
    /// Le tri interne (ordre fixe) est ce qui évite l'interblocage entre deux imports concurrents
    /// aux ensembles de villes qui se chevauchent, sans avoir à prendre un verrou global.
    /// </summary>
    public class TownSyncLockAcquireTownsAsyncTests
    {
        private static readonly TimeSpan ShortWait = TimeSpan.FromMilliseconds(300);

        [Fact]
        public async Task AcquireTownsAsync_VilleDuSet_BloqueUnAcquireTownAsyncConcurrentSurCetteVille()
        {
            var townSyncLock = new TownSyncLock();
            var multiLock = await townSyncLock.AcquireTownsAsync(new[] { 1, 2 });

            var singleLockTask = townSyncLock.AcquireTownAsync(2);

            var winner = await Task.WhenAny(singleLockTask, Task.Delay(ShortWait));
            winner.Should().NotBeSameAs(singleLockTask, "la ville 2 fait partie du set verrouillé");

            await multiLock.DisposeAsync();
            var singleLock = await singleLockTask;
            await singleLock.DisposeAsync();
        }

        [Fact]
        public async Task AcquireTownsAsync_VilleHorsDuSet_NeBloquePasUnAcquireTownAsyncConcurrent()
        {
            var townSyncLock = new TownSyncLock();
            var multiLock = await townSyncLock.AcquireTownsAsync(new[] { 1, 2 });

            var singleLockTask = townSyncLock.AcquireTownAsync(3);

            var winner = await Task.WhenAny(singleLockTask, Task.Delay(ShortWait));
            winner.Should().BeSameAs(singleLockTask, "la ville 3 n'appartient pas au set verrouillé, elle ne doit pas attendre");

            var singleLock = await singleLockTask;
            await singleLock.DisposeAsync();
            await multiLock.DisposeAsync();
        }

        [Fact]
        public async Task AcquireTownsAsync_IdsEnDoublonEtDesordonnes_NePlantePasEtVerrouilleChaqueIdUneFois()
        {
            var townSyncLock = new TownSyncLock();

            var multiLock = await townSyncLock.AcquireTownsAsync(new[] { 5, 1, 5, 3, 1 });

            var townOne = townSyncLock.AcquireTownAsync(1);
            var townThree = townSyncLock.AcquireTownAsync(3);
            var townFive = townSyncLock.AcquireTownAsync(5);

            (await Task.WhenAny(townOne, Task.Delay(ShortWait))).Should().NotBeSameAs(townOne);
            (await Task.WhenAny(townThree, Task.Delay(ShortWait))).Should().NotBeSameAs(townThree);
            (await Task.WhenAny(townFive, Task.Delay(ShortWait))).Should().NotBeSameAs(townFive);

            await multiLock.DisposeAsync();

            await (await townOne).DisposeAsync();
            await (await townThree).DisposeAsync();
            await (await townFive).DisposeAsync();
        }

        [Fact]
        public async Task AcquireTownsAsync_EnsemblesChevauchantsEnOrdreInverse_NeSeBloquentPasMutuellementEnDeadlock()
        {
            var townSyncLock = new TownSyncLock();

            var taskA = Task.Run(async () =>
            {
                await using var lockA = await townSyncLock.AcquireTownsAsync(new[] { 1, 2, 3 });
                await Task.Delay(50);
            });
            var taskB = Task.Run(async () =>
            {
                await using var lockB = await townSyncLock.AcquireTownsAsync(new[] { 3, 2, 1 });
                await Task.Delay(50);
            });

            var bothDone = Task.WhenAll(taskA, taskB);
            var completed = await Task.WhenAny(bothDone, Task.Delay(TimeSpan.FromSeconds(5)));
            completed.Should().BeSameAs(bothDone, "les deux imports doivent finir par se sérialiser, jamais s'interbloquer");
            await taskA;
            await taskB;
        }

        [Fact]
        public async Task AcquireTownsAsync_EnsembleVide_NeVerrouilleRienEtNePlanteJamais()
        {
            var townSyncLock = new TownSyncLock();

            var multiLock = await townSyncLock.AcquireTownsAsync(Array.Empty<int>());
            var singleLockTask = townSyncLock.AcquireTownAsync(1);

            var winner = await Task.WhenAny(singleLockTask, Task.Delay(ShortWait));
            winner.Should().BeSameAs(singleLockTask);

            await (await singleLockTask).DisposeAsync();
            await multiLock.DisposeAsync();
        }
    }
}
