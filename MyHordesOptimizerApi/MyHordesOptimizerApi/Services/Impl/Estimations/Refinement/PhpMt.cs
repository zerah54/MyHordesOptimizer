using System;

namespace MyHordesOptimizerApi.Services.Impl.Estimations.Refinement
{
    /// <summary>
    /// Port exact de mt_rand PHP (MT19937 mode MT_RAND_MT19937 + php_random_range32). Le flux d'un seed est
    /// rejouable depuis le début (<see cref="Rewind"/>) : chaque configuration d'offsets relit les mêmes
    /// sorties sans réinitialiser le générateur. Une trajectoire consomme ~100 sorties : deux blocs suffisent.
    /// </summary>
    public sealed class PhpMt
    {
        private const int N = 624;
        private const int M = 397;
        private readonly uint[] _raw = new uint[N];
        private readonly uint[] _first = new uint[N];
        private readonly uint[] _second = new uint[N];
        private bool _secondReady;
        private int _cursor;

        /// <summary>mt_srand(seed) puis positionnement sur la première sortie.</summary>
        public void Seed(uint seed)
        {
            _raw[0] = seed;
            for (uint i = 1; i < N; i++)
            {
                uint prev = _raw[i - 1];
                _raw[i] = 1812433253u * (prev ^ (prev >> 30)) + i;
            }
            Reload(_raw);
            for (int i = 0; i < N; i++)
            {
                _first[i] = Temper(_raw[i]);
            }
            _secondReady = false;
            _cursor = 0;
        }

        /// <summary>Revient à la première sortie du seed courant.</summary>
        public void Rewind() => _cursor = 0;

        /// <summary>mt_rand(min, max) : consomme un tirage même quand min == max.</summary>
        public int Rand(int min, int max) => min + (int)Range32((uint)(max - min));

        private uint Next()
        {
            if (_cursor < N)
            {
                return _first[_cursor++];
            }
            if (_cursor >= 2 * N)
            {
                throw new InvalidOperationException("Trajectoire au-delà de deux blocs MT19937");
            }
            if (!_secondReady)
            {
                Array.Copy(_raw, _second, N);
                Reload(_second);
                _secondReady = true;
            }
            return Temper(_second[_cursor++ - N]);
        }

        private uint Range32(uint umax)
        {
            uint result = Next();
            if (umax == 0xFFFFFFFFu)
            {
                return result;
            }
            uint um = umax + 1;
            if ((um & (um - 1)) == 0)
            {
                return result & (um - 1);
            }
            uint limit = 0xFFFFFFFFu - (0xFFFFFFFFu % um) - 1;
            while (result > limit)
            {
                result = Next();
            }
            return result % um;
        }

        private static uint Twist(uint m, uint u, uint v)
        {
            uint mix = (u & 0x80000000u) | (v & 0x7fffffffu);
            return m ^ (mix >> 1) ^ ((v & 1u) != 0 ? 0x9908b0dfu : 0u);
        }

        private static uint Temper(uint y)
        {
            y ^= y >> 11;
            y ^= (y << 7) & 0x9d2c5680u;
            y ^= (y << 15) & 0xefc60000u;
            y ^= y >> 18;
            return y;
        }

        private static void Reload(uint[] s)
        {
            int p = 0;
            for (int i = 0; i < N - M; i++, p++)
            {
                s[p] = Twist(s[p + M], s[p], s[p + 1]);
            }
            for (int i = 0; i < M - 1; i++, p++)
            {
                s[p] = Twist(s[p + M - N], s[p], s[p + 1]);
            }
            s[p] = Twist(s[p + M - N], s[p], s[0]);
        }
    }
}
