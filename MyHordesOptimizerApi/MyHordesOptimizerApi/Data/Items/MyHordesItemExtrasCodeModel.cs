namespace MyHordesOptimizerApi.Data.Items
{
    /// <summary>
    /// Propriétés d'objet hors catalogue d'actions (<c>Data/Items/item-extras.json</c>) :
    /// impact sur la veille et type d'extension de sac.
    /// </summary>
    public class MyHordesItemExtrasCodeModel
    {
        public int? WatchImpact { get; set; }
        public int? BagExtensionType { get; set; }
    }
}
