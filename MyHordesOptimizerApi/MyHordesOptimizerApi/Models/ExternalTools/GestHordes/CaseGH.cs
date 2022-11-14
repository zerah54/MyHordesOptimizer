using System;

namespace MyHordesOptimizerApi.Models.ExternalTools.GestHordes
{
    public class CaseGH
    {
        public int X { get; set; }
        public int Y { get; set; }

        public CaseGH(int x, int y)
        {
            X = x;
            Y = y;
        }

        public override bool Equals(object obj)
        {
            return GetHashCode() == obj.GetHashCode();
        }

        public override int GetHashCode()
        {
            return HashCode.Combine(X, Y);
        }
    }
}
