using Dapper;
using System;
using System.Collections.Generic;
using System.Data.SqlClient;
using System.Text;

namespace MyHordesOptimizerApi.Extensions
{
    public static class DapperExtensions
    {
        public static void BulkInsert<TModel>(this SqlConnection connection, string tableName, Dictionary<string, Func<TModel, object>> dico, List<TModel> models)
        {
            var sb = new StringBuilder($"INSERT INTO {tableName}({string.Join(",", dico.Keys)}) VALUES ");
            var param = new DynamicParameters();
            var count = 1;
            var listValues = new List<string>();
            foreach (var model in models)
            {
                var list = new List<string>();
                foreach (var kvp in dico)
                {
                    list.Add($"@{count}");
                    var value = kvp.Value.Invoke(model);
                    param.Add($"@{count}", value);
                    count++;
                }
                listValues.Add($"({string.Join(",", list)})");
            }
            sb.Append($"{string.Join(",", listValues)}");
            var query = sb.ToString();
            connection.Execute(query, param);
        }
    }
}
