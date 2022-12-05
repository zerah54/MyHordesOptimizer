namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer
{
    public class SimpleMe
    {
        public int Id { get; set; }
        public string UserName { get; set; }
        public SimpleMeTownDetailDto TownDetails { get; set; }

        public SimpleMe()
        {
            TownDetails = new SimpleMeTownDetailDto();
        }
    }

    public class SimpleMeTownDetailDto
    {
        public int TownId { get; set; }
        public int TownX { get; set; }
        public int TownY { get; set; }
        public int TownMaxX { get; set; }
        public int TownMaxY { get; set; }
        public bool IsDevaste { get; set; }
    }
}
