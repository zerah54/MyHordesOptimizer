﻿using Dapper;
using MySqlConnector;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Reflection;
using System.Text;

namespace MyHordesOptimizerApi.Extensions
{
    public static class DapperExtensions
    {
        public static void BulkInsert<TModel>(this MySqlConnection connection, string tableName, Dictionary<string, Func<TModel, object>> dico, List<TModel> models)
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

        public static void Update<TModel>(this MySqlConnection connection, TModel model)
        {
            var type = model.GetType();
            var tableAttribute = Attribute.GetCustomAttributes(type).FirstOrDefault(attr => attr.GetType() == typeof(TableAttribute)) as TableAttribute;
            var tableName = tableAttribute == null ? type.Name : tableAttribute.Name;
            var values = new List<string>();
            var param = new DynamicParameters();
            var setClauses = new List<string>();
            var keyName = string.Empty;
            foreach (var prop in type.GetProperties())
            {
                var keyAttr = prop.GetCustomAttributes().FirstOrDefault(attr => attr.GetType() == typeof(KeyAttribute)) as KeyAttribute;
                var columnAttr = prop.GetCustomAttributes().FirstOrDefault(attr => attr.GetType() == typeof(ColumnAttribute)) as ColumnAttribute;
                var name = string.Empty;
                if (columnAttr == null)
                {
                    name = prop.Name;
                }
                else
                {
                    name = columnAttr.Name;
                }
                if (keyAttr != null)
                {
                    keyName = name;
                }
                else
                {
                    values.Add($"@{name}");
                    setClauses.Add($"{name} = @{name}");
                    param.Add(name, prop.GetValue(model, null));
                }
                param.Add(name, prop.GetValue(model, null));
            }
            var sb = new StringBuilder($"UPDATE {tableName} SET {string.Join(",", setClauses)} WHERE {keyName} = @{keyName}");
            var query = sb.ToString();
            connection.Execute(query, param);
        }

        public static void Insert<TModel>(this MySqlConnection connection, TModel model)
        {
            var type = model.GetType();
            var tableAttribute = Attribute.GetCustomAttributes(type).FirstOrDefault(attr => attr.GetType() == typeof(TableAttribute)) as TableAttribute;
            var tableName = tableAttribute == null ? type.Name : tableAttribute.Name;
            var props = new List<string>();
            var values = new List<string>();
            var param = new DynamicParameters();
            foreach (var prop in type.GetProperties())
            {
                var columnAttr = prop.GetCustomAttributes().FirstOrDefault(attr => attr.GetType() == typeof(ColumnAttribute)) as ColumnAttribute;
                var name = string.Empty;
                if (columnAttr == null)
                {
                    name = prop.Name;
                }
                else
                {
                    name = columnAttr.Name;
                }
                values.Add($"@{name}");
                props.Add(name);
                param.Add(name, prop.GetValue(model, null));
            }
            var sb = new StringBuilder($"INSERT INTO {tableName}({string.Join(",", props)}) VALUES ({string.Join(",", values)})");
            var query = sb.ToString();
            connection.Execute(query, param);
        }
    }
}
