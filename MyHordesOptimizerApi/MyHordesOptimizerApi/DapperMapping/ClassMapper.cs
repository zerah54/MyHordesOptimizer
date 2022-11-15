namespace MyHordesOptimizerApi.DapperMapping
{
    /* public sealed class MyClassMapper<TModel> : ClassMapper<TModel> where TModel : class
    {
        public MyClassMapper()
        {
            var type = typeof(TModel);

            var tablename = type.Name;
            var tableAttribute = type.GetCustomAttribute(typeof(TableAttribute)) as TableAttribute;
            if (tableAttribute != null)
            {
                tablename = tableAttribute.Name;
            }
            Table(tablename);
            foreach (var property in type.GetProperties())
            {
                var memberMap = Map(property);
                var keyAttribute = property.GetCustomAttribute(typeof(KeyAttribute)) as KeyAttribute;
                if (keyAttribute != null)
                {
                    memberMap.Key(KeyType.Assigned);
                }
                var columnName = property.Name;
                var descriptionAttribute = property.GetCustomAttribute(typeof(ColumnAttribute)) as ColumnAttribute;
                if (descriptionAttribute != null)
                {
                    columnName = descriptionAttribute.Name;
                }
                memberMap.Column(columnName);
            }
            AutoMap();
        }
    }*/
}
