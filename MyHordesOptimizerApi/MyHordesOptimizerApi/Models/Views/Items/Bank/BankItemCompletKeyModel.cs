using System;

namespace MyHordesOptimizerApi.Models.Views.Items.Bank
{
    public class BankItemCompletKeyModel
    {
        public int TownId { get; set; }
        public int ItemId { get; set; }
        public bool BankIsBroken { get; set; }

        public BankItemCompletKeyModel(BankItemCompletModel copy)
        {
            TownId = copy.TownId;
            ItemId = copy.ItemId;
            BankIsBroken = copy.BankIsBroken;
        }

        public override bool Equals(object obj)
        {
            return obj is BankItemCompletKeyModel model &&
                   TownId == model.TownId &&
                   ItemId == model.ItemId &&
                   BankIsBroken == model.BankIsBroken;
        }

        public override int GetHashCode()
        {
            return HashCode.Combine(TownId, ItemId, BankIsBroken);
        }
    }
}
