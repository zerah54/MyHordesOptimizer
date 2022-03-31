using AStar;
using AStar.Options;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Extensions;
using MyHordesOptimizerApi.Services.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;

namespace MyHordesOptimizerApi.Services.Impl
{
    public class MyHordesRuineService : IMyHordesRuineService
    {
        public List<Position> OptimizeRuinePath(RuineOptiPathRequestDto requestDto)
        {
            var tiles = To2D(requestDto.Map);
            var pathfinderOptions = new PathFinderOptions
            {
                PunishChangeDirection = true,
                UseDiagonals = false,
            };

            var worldGrid = new WorldGrid(tiles);
            var pathfinder = new PathFinder(worldGrid, pathfinderOptions);

            var entreSortie = new Position(requestDto.Entrance.RowIndex, requestDto.Entrance.ColIndex);
            var portes = new List<Position>();
            foreach(var porte in requestDto.Doors)
            {
                portes.Add(new Position(porte.RowIndex, porte.ColIndex));
            }

            var cheminsPlusCourt = new List<List<Position[]>>();
            var tailleCheminPlusCourt = int.MaxValue;
            var combinaisonsPortes = portes.Permute();
            var hehe = 0;
            foreach (var combinaison in combinaisonsPortes)
            {
                var chemin = new List<Position[]>();
                bool isPlusCourt = true;
                var taille = 0;
                var path = pathfinder.FindPath(entreSortie, combinaison.First());
                chemin.Add(path);
                taille += path.Length;
                for (int i = 1; i < combinaison.Count(); i++)
                {
                    path = pathfinder.FindPath(combinaison.ElementAt(i - 1), combinaison.ElementAt(i));
                    chemin.Add(path);
                    taille += path.Length;
                    if(taille > tailleCheminPlusCourt)
                    {
                        isPlusCourt = false;
                        break;
                    }
                }
                path = pathfinder.FindPath(combinaison.Last(), entreSortie);
                chemin.Add(path);
                taille += path.Length;
                if(isPlusCourt && taille < tailleCheminPlusCourt)
                {
                    tailleCheminPlusCourt = taille;
                    cheminsPlusCourt.Clear();
                    cheminsPlusCourt.Add(chemin);
                }else if(taille == tailleCheminPlusCourt)
                {
                    cheminsPlusCourt.Add(chemin);
                }
                hehe++;
            }

            var positions = new List<Position[]>();
            var minDistinctCase = int.MaxValue;
            foreach(var cheminPlusCourt in cheminsPlusCourt)
            {
                var courrantDistinctCase = cheminPlusCourt.Distinct().Count();
                if (courrantDistinctCase < minDistinctCase)
                {
                    positions = cheminPlusCourt;
                    minDistinctCase = courrantDistinctCase;
                }
            }
            var result = new List<Position>(positions.First());
            for(var i = 1;i < positions.Count;i++)
            {
                result.AddRange(positions[i].Skip(1));
            }
            return result;
        }

        static T[,] To2D<T>(T[][] source)
        {
            try
            {
                int FirstDim = source.Length;
                int SecondDim = source.GroupBy(row => row.Length).Single().Key; // throws InvalidOperationException if source is not rectangular

                var result = new T[FirstDim, SecondDim];
                for (int i = 0; i < FirstDim; ++i)
                    for (int j = 0; j < SecondDim; ++j)
                        result[i, j] = source[i][j];

                return result;
            }
            catch (InvalidOperationException)
            {
                throw new InvalidOperationException("The given jagged array is not rectangular.");
            }
        }
    }
}
