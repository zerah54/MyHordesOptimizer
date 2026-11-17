namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.PreTowns
{
    /// <summary>Bilan d'une liaison : lignes ajoutées à la ville réelle, lignes ignorées car déjà présentes (dont les notes).</summary>
    public class LinkResultDto
    {
        public int Added { get; set; }
        public int Skipped { get; set; }
        /// <summary>Part de <see cref="Skipped"/> qui concerne les notes (une par auteur et par ville).</summary>
        public int SkippedNotes { get; set; }
    }

    /// <summary>Liaison simulée vers la ville actuelle de l'utilisateur ; rien n'est enregistré.</summary>
    public class LinkPreviewDto : LinkResultDto
    {
        public int MapId { get; set; }
        public string? TownName { get; set; }
    }
}
