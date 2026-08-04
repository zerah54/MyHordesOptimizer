using System;
using System.Collections.Generic;
using System.Linq;
using MyHordesOptimizerApi.Services.Interfaces;

namespace MyHordesOptimizerApi.Services.Impl;

/// <summary>
/// Port fidèle de minesweeper-generator.util.ts (lui-même porté de Simon Tatham's Puzzles — mines.c).
/// Garantit qu'un plateau est résolvable sans devinette depuis la case de départ. Déterministe :
/// mêmes paramètres + même seed = même plateau, y compris côté TypeScript (vérifié par vecteurs de
/// référence, voir MinesweeperBoardGeneratorTests).
/// </summary>
public sealed class MinesweeperBoardGenerator : IMinesweeperBoardGenerator
{
    private const sbyte Unknown = -2;
    private const sbyte KnownMine = -1;

    public GeneratedMinesweeperBoard Generate(int width, int height, int mineCount, int startX, int startY, uint seed)
    {
        var rng = new SeededRng(seed);
        byte[] mines = MineGen(width, height, mineCount, startX, startY, rng);

        byte[] adjacentCounts = new byte[width * height];
        for (int y = 0; y < height; y++)
        {
            for (int x = 0; x < width; x++)
            {
                if (mines[y * width + x] != 0) continue;
                int count = 0;
                for (int dy = -1; dy <= 1; dy++)
                {
                    for (int dx = -1; dx <= 1; dx++)
                    {
                        if (dx == 0 && dy == 0) continue;
                        int nx = x + dx;
                        int ny = y + dy;
                        if (nx >= 0 && nx < width && ny >= 0 && ny < height && mines[ny * width + nx] != 0) count++;
                    }
                }
                adjacentCounts[y * width + x] = (byte)count;
            }
        }

        return new GeneratedMinesweeperBoard { Mines = mines, AdjacentCounts = adjacentCounts, Width = width, Height = height };
    }

    private static byte[] MineGen(int width, int height, int nbMines, int startX, int startY, SeededRng rng)
    {
        byte[] mines = new byte[width * height];
        bool success;
        int ntries = 0;

        do
        {
            ntries++;
            Array.Clear(mines);

            var candidates = new List<int>();
            for (int y = 0; y < height; y++)
            {
                for (int x = 0; x < width; x++)
                {
                    if (Math.Abs(y - startY) > 1 || Math.Abs(x - startX) > 1)
                    {
                        candidates.Add(y * width + x);
                    }
                }
            }

            int k = candidates.Count;
            for (int i = 0; i < nbMines; i++)
            {
                int j = i + rng.Upto(k - i);
                (candidates[i], candidates[j]) = (candidates[j], candidates[i]);
                mines[candidates[i]] = 1;
            }

            var solveGrid = new sbyte[width * height];
            Array.Fill(solveGrid, Unknown);
            solveGrid[startY * width + startX] = (sbyte)MineOpen(mines, width, height, startX, startY);

            bool allowBigPerturbs = ntries > 100;

            int OpenFn(int x, int y) => MineOpen(mines, width, height, x, y);
            List<Perturbation>? PerturbFn(sbyte[] grid, int setX, int setY, int mask) =>
                MinePerturb(mines, grid, width, height, startX, startY, allowBigPerturbs, rng, setX, setY, mask);

            int prevret = -2;
            success = false;
            while (true)
            {
                Array.Fill(solveGrid, Unknown);
                solveGrid[startY * width + startX] = (sbyte)MineOpen(mines, width, height, startX, startY);

                int ret = MineSolve(width, height, nbMines, solveGrid, OpenFn, PerturbFn, rng);
                if (ret < 0 || (prevret >= 0 && ret >= prevret))
                {
                    success = false;
                    break;
                }
                if (ret == 0)
                {
                    success = true;
                    break;
                }
                prevret = ret;
            }
        } while (!success);

        return mines;
    }

    private static int MineOpen(byte[] mines, int width, int height, int x, int y)
    {
        if (mines[y * width + x] != 0) return -1;
        int n = 0;
        for (int dy = -1; dy <= 1; dy++)
        {
            for (int dx = -1; dx <= 1; dx++)
            {
                if (dx == 0 && dy == 0) continue;
                int nx = x + dx;
                int ny = y + dy;
                if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
                if (mines[ny * width + nx] != 0) n++;
            }
        }
        return n;
    }

    private readonly struct Square
    {
        public readonly int X;
        public readonly int Y;
        public readonly int Type;
        public readonly int Rand;

        public Square(int x, int y, int type, int rand)
        {
            X = x;
            Y = y;
            Type = type;
            Rand = rand;
        }
    }

    private readonly struct Perturbation
    {
        public readonly int X;
        public readonly int Y;
        public readonly int Delta;

        public Perturbation(int x, int y, int delta)
        {
            X = x;
            Y = y;
            Delta = delta;
        }
    }

    private static List<Perturbation>? MinePerturb(
        byte[] mines, sbyte[] grid, int width, int height,
        int startX, int startY, bool allowBigPerturbs, SeededRng rng,
        int setx, int sety, int mask)
    {
        if (mask == 0 && !allowBigPerturbs) return null;

        var candidates = new List<Square>();
        for (int y = 0; y < height; y++)
        {
            for (int x = 0; x < width; x++)
            {
                if (Math.Abs(y - startY) <= 1 && Math.Abs(x - startX) <= 1) continue;

                bool inSet = mask == 0
                    ? grid[y * width + x] == Unknown
                    : x >= setx && x < setx + 3 && y >= sety && y < sety + 3 &&
                      (mask & (1 << ((y - sety) * 3 + (x - setx)))) != 0;
                if (inSet) continue;

                int type;
                if (grid[y * width + x] != Unknown)
                {
                    type = 3;
                }
                else
                {
                    type = 2;
                    bool foundBoundary = false;
                    for (int dy = -1; dy <= 1 && !foundBoundary; dy++)
                    {
                        for (int dx = -1; dx <= 1; dx++)
                        {
                            if (x + dx >= 0 && x + dx < width && y + dy >= 0 && y + dy < height &&
                                grid[(y + dy) * width + (x + dx)] != Unknown)
                            {
                                type = 1;
                                foundBoundary = true;
                                break;
                            }
                        }
                    }
                }

                candidates.Add(new Square(x, y, type, rng.Bits31()));
            }
        }

        // Tri STABLE requis : JS Array.prototype.sort est stable (ES2019+) et l'algorithme en dépend
        // pour rester déterministe seed-à-seed. List<T>.Sort() ne l'est PAS — OrderBy/ThenBy l'est.
        List<Square> sorted = candidates.OrderBy(c => c.Type).ThenBy(c => c.Rand).ToList();

        int nfull = 0;
        int nempty = 0;
        if (mask != 0)
        {
            for (int dy = 0; dy < 3; dy++)
            {
                for (int dx = 0; dx < 3; dx++)
                {
                    if ((mask & (1 << (dy * 3 + dx))) != 0)
                    {
                        if (mines[(sety + dy) * width + (setx + dx)] != 0) nfull++;
                        else nempty++;
                    }
                }
            }
        }
        else
        {
            for (int y = 0; y < height; y++)
            {
                for (int x = 0; x < width; x++)
                {
                    if (grid[y * width + x] == Unknown)
                    {
                        if (mines[y * width + x] != 0) nfull++;
                        else nempty++;
                    }
                }
            }
        }

        var tofill = new List<Square>();
        var toempty = new List<Square>();
        foreach (Square sq in sorted)
        {
            if (mines[sq.Y * width + sq.X] != 0) toempty.Add(sq);
            else tofill.Add(sq);
            if (tofill.Count == nfull || toempty.Count == nempty) break;
        }

        List<Square> todo;
        int dtodo;
        int dset;
        List<int>? setIndices = null;

        if (tofill.Count == nfull)
        {
            todo = tofill;
            dtodo = +1;
            dset = -1;
        }
        else if (toempty.Count == nempty)
        {
            todo = toempty;
            dtodo = -1;
            dset = +1;
        }
        else
        {
            if (toempty.Count == 0) return null;

            var emptyInSet = new List<int>();
            if (mask != 0)
            {
                for (int dy = 0; dy < 3; dy++)
                {
                    for (int dx = 0; dx < 3; dx++)
                    {
                        if ((mask & (1 << (dy * 3 + dx))) != 0)
                        {
                            int idx = (sety + dy) * width + (setx + dx);
                            if (mines[idx] == 0) emptyInSet.Add(idx);
                        }
                    }
                }
            }
            else
            {
                for (int y = 0; y < height; y++)
                {
                    for (int x = 0; x < width; x++)
                    {
                        if (grid[y * width + x] == Unknown && mines[y * width + x] == 0) emptyInSet.Add(y * width + x);
                    }
                }
            }

            for (int k = 0; k < toempty.Count; k++)
            {
                int idx = k + rng.Upto(emptyInSet.Count - k);
                (emptyInSet[k], emptyInSet[idx]) = (emptyInSet[idx], emptyInSet[k]);
            }

            setIndices = emptyInSet.Take(toempty.Count).ToList();
            todo = toempty;
            dtodo = -1;
            dset = +1;
        }

        var changes = new List<Perturbation>();
        foreach (Square sq in todo) changes.Add(new Perturbation(sq.X, sq.Y, dtodo));

        if (setIndices != null)
        {
            foreach (int idx in setIndices) changes.Add(new Perturbation(idx % width, idx / width, dset));
        }
        else if (mask != 0)
        {
            for (int dy = 0; dy < 3; dy++)
            {
                for (int dx = 0; dx < 3; dx++)
                {
                    if ((mask & (1 << (dy * 3 + dx))) != 0)
                    {
                        int currval = mines[(sety + dy) * width + (setx + dx)] != 0 ? 1 : -1;
                        if (dset == -currval) changes.Add(new Perturbation(setx + dx, sety + dy, dset));
                    }
                }
            }
        }
        else
        {
            for (int y = 0; y < height; y++)
            {
                for (int x = 0; x < width; x++)
                {
                    if (grid[y * width + x] == Unknown)
                    {
                        int currval = mines[y * width + x] != 0 ? 1 : -1;
                        if (dset == -currval) changes.Add(new Perturbation(x, y, dset));
                    }
                }
            }
        }

        foreach (Perturbation ch in changes)
        {
            mines[ch.Y * width + ch.X] = ch.Delta > 0 ? (byte)1 : (byte)0;

            for (int dy = -1; dy <= 1; dy++)
            {
                for (int dx = -1; dx <= 1; dx++)
                {
                    int nx = ch.X + dx;
                    int ny = ch.Y + dy;
                    if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
                    if (grid[ny * width + nx] == Unknown) continue;

                    if (dx == 0 && dy == 0)
                    {
                        if (ch.Delta > 0)
                        {
                            grid[ny * width + nx] = KnownMine;
                        }
                        else
                        {
                            int count = 0;
                            for (int dy2 = -1; dy2 <= 1; dy2++)
                            {
                                for (int dx2 = -1; dx2 <= 1; dx2++)
                                {
                                    int nx2 = ch.X + dx2;
                                    int ny2 = ch.Y + dy2;
                                    if (nx2 >= 0 && nx2 < width && ny2 >= 0 && ny2 < height && mines[ny2 * width + nx2] != 0) count++;
                                }
                            }
                            grid[ny * width + nx] = (sbyte)count;
                        }
                    }
                    else if (grid[ny * width + nx] >= 0)
                    {
                        grid[ny * width + nx] = (sbyte)(grid[ny * width + nx] + ch.Delta);
                    }
                }
            }
        }

        return changes;
    }

    private delegate int OpenFn(int x, int y);
    private delegate List<Perturbation>? PerturbFn(sbyte[] grid, int setX, int setY, int mask);

    private static void KnownSquares(int width, SquareTodo squareTodo, sbyte[] grid, OpenFn open, int x, int y, int mask, bool mine)
    {
        int bit = 1;
        for (int yy = 0; yy < 3; yy++)
        {
            for (int xx = 0; xx < 3; xx++)
            {
                if ((mask & bit) != 0)
                {
                    int i = (y + yy) * width + (x + xx);
                    if (grid[i] == Unknown)
                    {
                        grid[i] = mine ? KnownMine : (sbyte)open(x + xx, y + yy);
                        squareTodo.Push(i);
                    }
                }
                bit <<= 1;
            }
        }
    }

    private static int MineSolve(int width, int height, int nbMines, sbyte[] grid, OpenFn open, PerturbFn? perturb, SeededRng rng)
    {
        var setStore = new SetStore();
        var squareTodo = new SquareTodo(width * height);
        int nperturbs = 0;

        for (int i = 0; i < width * height; i++)
        {
            if (grid[i] != Unknown) squareTodo.Push(i);
        }

        while (true)
        {
            bool doneSomething = false;

            int i;
            while ((i = squareTodo.Pop()) != -1)
            {
                int x = i % width;
                int y = i / width;

                if (grid[i] >= 0)
                {
                    int mines = grid[i];
                    int val = 0;
                    int bit = 1;
                    for (int dy = -1; dy <= 1; dy++)
                    {
                        for (int dx = -1; dx <= 1; dx++)
                        {
                            if (x + dx < 0 || x + dx >= width || y + dy < 0 || y + dy >= height)
                            {
                                // hors grille
                            }
                            else if (grid[(y + dy) * width + (x + dx)] == KnownMine)
                            {
                                mines--;
                            }
                            else if (grid[(y + dy) * width + (x + dx)] == Unknown)
                            {
                                val |= bit;
                            }
                            bit <<= 1;
                        }
                    }
                    if (val != 0) setStore.Add(x - 1, y - 1, val, mines);
                }

                List<MineSet> overlaps = setStore.Overlapping(x, y, 1);
                foreach (MineSet s in overlaps)
                {
                    int newMask = Setmunge(s.X, s.Y, s.Mask, x, y, 1, true);
                    int newMines = s.Mines - (grid[i] == KnownMine ? 1 : 0);
                    if (newMask != 0) setStore.Add(s.X, s.Y, newMask, newMines);
                    setStore.Remove(s);
                }

                doneSomething = true;
            }

            MineSet? s0 = setStore.PopTodo();
            if (s0 != null)
            {
                MineSet s = s0;
                int cardinality = BitCount16(s.Mask);

                if (s.Mines == 0 || s.Mines == cardinality)
                {
                    KnownSquares(width, squareTodo, grid, open, s.X, s.Y, s.Mask, s.Mines != 0);
                    continue;
                }

                List<MineSet> overlaps = setStore.Overlapping(s.X, s.Y, s.Mask);
                foreach (MineSet s2 in overlaps)
                {
                    int swing = Setmunge(s.X, s.Y, s.Mask, s2.X, s2.Y, s2.Mask, true);
                    int s2wing = Setmunge(s2.X, s2.Y, s2.Mask, s.X, s.Y, s.Mask, true);
                    int swc = BitCount16(swing);
                    int s2wc = BitCount16(s2wing);

                    if (swc == s.Mines - s2.Mines || s2wc == s2.Mines - s.Mines)
                    {
                        KnownSquares(width, squareTodo, grid, open, s.X, s.Y, swing, swc == s.Mines - s2.Mines);
                        KnownSquares(width, squareTodo, grid, open, s2.X, s2.Y, s2wing, s2wc == s2.Mines - s.Mines);
                        continue;
                    }

                    if (swc == 0 && s2wc != 0)
                    {
                        setStore.Add(s2.X, s2.Y, s2wing, s2.Mines - s.Mines);
                    }
                    else if (s2wc == 0 && swc != 0)
                    {
                        setStore.Add(s.X, s.Y, swing, s.Mines - s2.Mines);
                    }
                }

                doneSomething = true;
            }
            else if (nbMines >= 0)
            {
                int squaresLeft = 0;
                int minesLeft = nbMines;
                for (int j = 0; j < width * height; j++)
                {
                    if (grid[j] == KnownMine) minesLeft--;
                    else if (grid[j] == Unknown) squaresLeft++;
                }

                if (squaresLeft == 0) break;

                if (minesLeft == 0 || minesLeft == squaresLeft)
                {
                    for (int j = 0; j < width * height; j++)
                    {
                        if (grid[j] == Unknown)
                        {
                            KnownSquares(width, squareTodo, grid, open, j % width, j / width, 1, minesLeft != 0);
                        }
                    }
                    continue;
                }

                List<MineSet> allSets = setStore.AllSets();
                int nsets = allSets.Count;
                if (nsets > 0 && nsets <= 10)
                {
                    int[] setused = new int[nsets];
                    int cursor = 0;
                    int sqLeft = squaresLeft;
                    int mnLeft = minesLeft;

                    while (true)
                    {
                        if (cursor < nsets)
                        {
                            bool ok = true;
                            for (int j = 0; j < cursor; j++)
                            {
                                if (setused[j] != 0 &&
                                    Setmunge(allSets[cursor].X, allSets[cursor].Y, allSets[cursor].Mask,
                                        allSets[j].X, allSets[j].Y, allSets[j].Mask, false) != 0)
                                {
                                    ok = false;
                                    break;
                                }
                            }
                            if (ok)
                            {
                                mnLeft -= allSets[cursor].Mines;
                                sqLeft -= BitCount16(allSets[cursor].Mask);
                            }
                            setused[cursor++] = ok ? 1 : 0;
                        }
                        else
                        {
                            if (sqLeft > 0 && (mnLeft == 0 || mnLeft == sqLeft))
                            {
                                for (int j = 0; j < width * height; j++)
                                {
                                    if (grid[j] == Unknown)
                                    {
                                        bool outside = true;
                                        int jx = j % width;
                                        int jy = j / width;
                                        for (int k = 0; k < nsets; k++)
                                        {
                                            if (setused[k] != 0 &&
                                                Setmunge(allSets[k].X, allSets[k].Y, allSets[k].Mask, jx, jy, 1, false) != 0)
                                            {
                                                outside = false;
                                                break;
                                            }
                                        }
                                        if (outside)
                                        {
                                            KnownSquares(width, squareTodo, grid, open, jx, jy, 1, mnLeft != 0);
                                        }
                                    }
                                }
                                doneSomething = true;
                                break;
                            }

                            do
                            {
                                cursor--;
                            } while (cursor >= 0 && setused[cursor] == 0);

                            if (cursor >= 0)
                            {
                                mnLeft += allSets[cursor].Mines;
                                sqLeft += BitCount16(allSets[cursor].Mask);
                                setused[cursor++] = 0;
                            }
                            else
                            {
                                break;
                            }
                        }
                    }
                }
            }

            if (doneSomething) continue;

            if (perturb == null) break;

            nperturbs++;
            List<MineSet> allSetsForPerturb = setStore.AllSets();
            List<Perturbation>? changes;
            if (allSetsForPerturb.Count == 0)
            {
                changes = perturb(grid, 0, 0, 0);
            }
            else
            {
                MineSet chosen = allSetsForPerturb[rng.Upto(allSetsForPerturb.Count)];
                changes = perturb(grid, chosen.X, chosen.Y, chosen.Mask);
            }

            if (changes == null) break;

            foreach (Perturbation ch in changes)
            {
                if (ch.Delta < 0 && grid[ch.Y * width + ch.X] != Unknown)
                {
                    squareTodo.Push(ch.Y * width + ch.X);
                }
                List<MineSet> affected = setStore.Overlapping(ch.X, ch.Y, 1);
                foreach (MineSet s2 in affected)
                {
                    s2.Mines += ch.Delta;
                    if (!s2.InTodo)
                    {
                        setStore.Remove(s2);
                        setStore.Add(s2.X, s2.Y, s2.Mask, s2.Mines);
                    }
                }
            }
        }

        for (int y = 0; y < height; y++)
        {
            for (int x = 0; x < width; x++)
            {
                if (grid[y * width + x] == Unknown) return -1;
            }
        }
        return nperturbs;
    }

    private static int BitCount16(int word)
    {
        word = ((word & 0xAAAA) >> 1) + (word & 0x5555);
        word = ((word & 0xCCCC) >> 2) + (word & 0x3333);
        word = ((word & 0xF0F0) >> 4) + (word & 0x0F0F);
        word = ((word & 0xFF00) >> 8) + (word & 0x00FF);
        return word;
    }

    private static int Setmunge(int x1, int y1, int mask1, int x2, int y2, int mask2, bool diff)
    {
        if (Math.Abs(x2 - x1) >= 3 || Math.Abs(y2 - y1) >= 3)
        {
            mask2 = 0;
        }
        else
        {
            while (x2 > x1) { mask2 &= ~(4 | 32 | 256); mask2 <<= 1; x2--; }
            while (x2 < x1) { mask2 &= ~(1 | 8 | 64); mask2 >>= 1; x2++; }
            while (y2 > y1) { mask2 &= ~(64 | 128 | 256); mask2 <<= 3; y2--; }
            while (y2 < y1) { mask2 &= ~(1 | 2 | 4); mask2 >>= 3; y2++; }
        }
        if (diff) mask2 ^= 511;
        return mask1 & mask2;
    }

    private sealed class MineSet
    {
        public int X;
        public int Y;
        public int Mask;
        public int Mines;
        public bool InTodo;
        public MineSet? Prev;
        public MineSet? Next;
    }

    private sealed class SetStore
    {
        // JS Map préserve l'ordre d'insertion à l'itération (delete+set = déplacé en fin de liste) ;
        // Dictionary<> ne le garantit PAS, et minesolve pioche le set à perturber via
        // all_sets[rng.upto(...)] : un ordre d'énumération différent change quel set est choisi, donc
        // le plateau final, dès qu'une perturbation intervient. LinkedList + index = ordre fidèle.
        private readonly Dictionary<(int X, int Y, int Mask), LinkedListNode<MineSet>> _index = new();
        private readonly LinkedList<MineSet> _insertionOrder = new();
        private MineSet? _todoHead;
        private MineSet? _todoTail;

        public void Add(int x, int y, int mask, int mines)
        {
            if (mask == 0) return;

            while ((mask & (1 | 8 | 64)) == 0) { mask >>= 1; x++; }
            while ((mask & (1 | 2 | 4)) == 0) { mask >>= 3; y++; }

            (int, int, int) key = (x, y, mask);
            if (_index.ContainsKey(key)) return;

            var s = new MineSet { X = x, Y = y, Mask = mask, Mines = mines };
            LinkedListNode<MineSet> node = _insertionOrder.AddLast(s);
            _index[key] = node;
            AddToTodo(s);
        }

        public void Remove(MineSet s)
        {
            if (s.Prev != null) s.Prev.Next = s.Next;
            else if (s == _todoHead) _todoHead = s.Next;
            if (s.Next != null) s.Next.Prev = s.Prev;
            else if (s == _todoTail) _todoTail = s.Prev;
            s.InTodo = false;

            (int, int, int) key = (s.X, s.Y, s.Mask);
            if (_index.TryGetValue(key, out LinkedListNode<MineSet>? node))
            {
                _insertionOrder.Remove(node);
                _index.Remove(key);
            }
        }

        public MineSet? PopTodo()
        {
            if (_todoHead == null) return null;
            MineSet s = _todoHead;
            _todoHead = s.Next;
            if (_todoHead != null) _todoHead.Prev = null;
            else _todoTail = null;
            s.Next = s.Prev = null;
            s.InTodo = false;
            return s;
        }

        public List<MineSet> Overlapping(int x, int y, int mask)
        {
            var result = new List<MineSet>();
            foreach (MineSet s in _insertionOrder)
            {
                if (Setmunge(x, y, mask, s.X, s.Y, s.Mask, false) != 0)
                {
                    result.Add(s);
                }
            }
            return result;
        }

        public List<MineSet> AllSets()
        {
            return new List<MineSet>(_insertionOrder);
        }

        private void AddToTodo(MineSet s)
        {
            if (s.InTodo) return;
            s.Prev = _todoTail;
            if (s.Prev != null) s.Prev.Next = s;
            else _todoHead = s;
            _todoTail = s;
            s.Next = null;
            s.InTodo = true;
        }
    }

    private sealed class SquareTodo
    {
        private readonly int[] _next;
        private int _head = -1;
        private int _tail = -1;

        public SquareTodo(int size)
        {
            _next = new int[size];
            Array.Fill(_next, -1);
        }

        public void Push(int i)
        {
            if (_tail >= 0) _next[_tail] = i;
            else _head = i;
            _tail = i;
            _next[i] = -1;
        }

        public int Pop()
        {
            if (_head == -1) return -1;
            int i = _head;
            _head = _next[i];
            if (_head == -1) _tail = -1;
            return i;
        }
    }

    private sealed class SeededRng
    {
        private uint _state;

        public SeededRng(uint seed)
        {
            _state = seed;
        }

        public int Upto(int n)
        {
            return (int)Math.Floor(Next() * n);
        }

        public int Bits31()
        {
            return (int)Math.Floor(Next() * 2147483648.0);
        }

        private double Next()
        {
            unchecked
            {
                _state += 0x6D2B79F5;
                uint z = _state;
                z = (z ^ (z >> 15)) * (z | 1);
                z ^= z + (z ^ (z >> 7)) * (z | 61);
                z ^= z >> 14;
                return z / 4294967296.0;
            }
        }
    }
}
