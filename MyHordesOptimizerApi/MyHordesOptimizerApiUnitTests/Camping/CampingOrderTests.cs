using FluentAssertions;
using MyHordesOptimizerApi.Services.Impl;
using Xunit;

namespace MyHordesOptimizerApiUnitTests.Camping
{
    /// <summary>Meilleur ordre de cachette : affectation campeurs -> rangs maximisant la somme des chances.</summary>
    public class CampingOrderTests
    {
        [Fact]
        public void Best_EgaliteAvecLOrdreActuel_GardeLOrdreActuel()
        {
            // Sans plafond atteint, la foule pèse pareil quel que soit l'ordre
            var probabilities = new[,]
            {
                { 80, 70, 50 },
                { 60, 50, 30 },
                { 40, 30, 10 }
            };

            CampingOrder.Best(probabilities).Should().Equal(0, 1, 2);
        }

        [Fact]
        public void Best_LePlafondAbsorbeLaFoule_PlaceLeCampeurPlafonneEnDernier()
        {
            // Campeur 0 plafonné à 90 quel que soit son rang ; campeur 1 perd 20 au second rang
            var probabilities = new[,]
            {
                { 90, 90 },
                { 70, 50 }
            };

            var order = CampingOrder.Best(probabilities);

            order.Should().Equal(1, 0);
            Sum(probabilities, order).Should().Be(160);
        }

        [Fact]
        public void Best_UnSeulCampeur()
        {
            CampingOrder.Best(new[,] { { 42 } }).Should().Equal(0);
        }

        [Fact]
        public void Best_EgaleLaRechercheExhaustive()
        {
            var random = new Random(20261011);
            for (var count = 1; count <= 7; count++)
            {
                for (var sample = 0; sample < 30; sample++)
                {
                    var probabilities = new int[count, count];
                    for (var camper = 0; camper < count; camper++)
                    {
                        // Chances décroissantes avec le rang, plafonnées : le cas réel
                        var start = random.Next(0, 140);
                        var cap = random.Next(2) == 0 ? 90 : 100;
                        for (var rank = 0; rank < count; rank++)
                        {
                            probabilities[camper, rank] = Math.Clamp(start - (rank * random.Next(0, 25)), 0, cap);
                        }
                    }

                    var order = CampingOrder.Best(probabilities);

                    order.Should().OnlyHaveUniqueItems().And.HaveCount(count);
                    Sum(probabilities, order).Should().Be(BruteForceBest(probabilities));
                }
            }
        }

        private static int Sum(int[,] probabilities, int[] order)
        {
            var sum = 0;
            for (var rank = 0; rank < order.Length; rank++)
            {
                sum += probabilities[order[rank], rank];
            }
            return sum;
        }

        private static int BruteForceBest(int[,] probabilities)
        {
            var count = probabilities.GetLength(0);
            var order = Enumerable.Range(0, count).ToArray();
            var best = int.MinValue;
            Permute(order, 0, current => best = Math.Max(best, Sum(probabilities, current)));
            return best;
        }

        private static void Permute(int[] order, int from, Action<int[]> visit)
        {
            if (from == order.Length)
            {
                visit(order);
                return;
            }
            for (var index = from; index < order.Length; index++)
            {
                (order[from], order[index]) = (order[index], order[from]);
                Permute(order, from + 1, visit);
                (order[from], order[index]) = (order[index], order[from]);
            }
        }
    }
}
