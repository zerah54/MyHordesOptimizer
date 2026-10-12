using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Camping;
using System;
using System.Numerics;

namespace MyHordesOptimizerApi.Services.Impl
{
    /// <summary>
    /// Meilleur ordre de cachette. La chance d'un campeur ne dépend que de son rang (la foule de ceux
    /// cachés avant lui, la place dans le bâtiment) : c'est une affectation campeurs -> rangs, résolue
    /// exactement par programmation dynamique sur les sous-ensembles de campeurs (2^n * n).
    /// </summary>
    public static class CampingOrder
    {
        /// <summary>
        /// <paramref name="probabilities"/>[campeur, rang] : chance bornée du campeur caché à ce rang.
        /// Renvoie, pour chaque rang, le campeur qui s'y cache. Maximise la somme des chances ; à
        /// égalité, garde le plus de campeurs à leur rang actuel (l'ordre actuel s'il est optimal).
        /// </summary>
        public static int[] Best(int[,] probabilities)
        {
            var count = probabilities.GetLength(0);
            if (count != probabilities.GetLength(1))
            {
                throw new ArgumentException("Il faut une chance par campeur et par rang.", nameof(probabilities));
            }
            if (count > CampingGroupParametersDto.MaxCampers)
            {
                throw new ArgumentException($"{count} campeurs : trop pour chercher le meilleur ordre.", nameof(probabilities));
            }

            // État : l'ensemble des campeurs déjà placés, aux premiers rangs
            var states = 1 << count;
            var bestSum = new int[states];
            var bestKept = new int[states];
            var lastCamper = new int[states];
            Array.Fill(bestSum, int.MinValue);
            bestSum[0] = 0;

            for (var placed = 0; placed < states - 1; placed++)
            {
                var rank = BitOperations.PopCount((uint)placed);
                for (var camper = 0; camper < count; camper++)
                {
                    var bit = 1 << camper;
                    if ((placed & bit) != 0)
                    {
                        continue;
                    }

                    var next = placed | bit;
                    var sum = bestSum[placed] + probabilities[camper, rank];
                    var kept = bestKept[placed] + (camper == rank ? 1 : 0);
                    if (sum > bestSum[next] || (sum == bestSum[next] && kept > bestKept[next]))
                    {
                        bestSum[next] = sum;
                        bestKept[next] = kept;
                        lastCamper[next] = camper;
                    }
                }
            }

            var order = new int[count];
            var state = states - 1;
            for (var rank = count - 1; rank >= 0; rank--)
            {
                var camper = lastCamper[state];
                order[rank] = camper;
                state &= ~(1 << camper);
            }
            return order;
        }
    }
}
