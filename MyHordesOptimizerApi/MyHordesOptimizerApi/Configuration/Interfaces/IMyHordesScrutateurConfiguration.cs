namespace MyHordesOptimizerApi.Configuration.Interfaces
{
    public interface IMyHordesScrutateurConfiguration
    {
        public int Id { get; }
        public int Level0 { get; }
        public int Level1 { get; }
        public int Level2 { get; }
        public int Level3 { get; }
        public int Level4 { get; }
        public int Level5 { get; }
        public int StartItemMin { get; }
        public int StartItemMax { get; }
        public int MinItemAdd { get; }
        public int MaxItemAdd { get; }
        public int? MaxItemPerCell { get; }
        public int DigThrottle { get; }
        /// <summary>Distance du vent (km) : seules les zones au-delà sont régénérées (<c>modifiers.wind_distance</c>).</summary>
        public int WindDistance { get; }
        /// <summary>Distance du vent en petite carte : -1, toutes les zones.</summary>
        public int WindDistanceSmallMap { get; }
    }
}
