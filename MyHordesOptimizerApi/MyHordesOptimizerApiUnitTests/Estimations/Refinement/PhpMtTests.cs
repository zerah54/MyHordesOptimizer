using System.Linq;
using FluentAssertions;
using MyHordesOptimizerApi.Services.Impl.Estimations.Refinement;
using Xunit;

namespace MyHordesOptimizerApiUnitTests.Estimations.Refinement
{
    public class PhpMtTests
    {
        private static int[] Draws(PhpMt mt, int count, int min, int max) => Enumerable.Range(0, count).Select(_ => mt.Rand(min, max)).ToArray();

        [Fact]
        public void Seed_0_draws_the_PHP_mt_rand_0_99_sequence()
        {
            var mt = new PhpMt();
            mt.Seed(0);
            Draws(mt, 5, 0, 99).Should().Equal(44, 39, 33, 60, 63);
        }

        [Fact]
        public void Draws_a_non_power_of_two_range_like_PHP()
        {
            var mt = new PhpMt();
            mt.Seed(777001);
            Draws(mt, 3, 290, 1166).Should().Equal(429, 943, 688);
        }

        [Fact]
        public void Continues_the_PHP_stream_beyond_the_first_624_outputs()
        {
            var mt = new PhpMt();
            mt.Seed(0);
            Draws(mt, 624, 0, 99);
            Draws(mt, 3, 0, 99).Should().Equal(62, 85, 97);
        }

        [Fact]
        public void Rewind_replays_the_same_draws()
        {
            var mt = new PhpMt();
            mt.Seed(777001);
            var first = Draws(mt, 10, 0, 99);
            mt.Rewind();
            Draws(mt, 10, 0, 99).Should().Equal(first);
        }
    }
}
