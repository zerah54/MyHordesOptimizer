using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Reflection;

namespace MyHordesOptimizerApi.Extensions
{
    /// <summary>
    /// Utility class for creating <see cref="IEqualityComparer{T}"/> instances 
    /// from Lambda expressions.
    /// </summary>
    public static class EqualityComparerFactory
    {
        /// <summary>Creates the specified <see cref="IEqualityComparer{T}" />.</summary>
        /// <typeparam name="T">The type to compare.</typeparam>
        /// <param name="getHashCode">The get hash code delegate.</param>
        /// <param name="equals">The equals delegate.</param>
        /// <returns>An instance of <see cref="IEqualityComparer{T}" />.</returns>
        public static IEqualityComparer<T> Create<T>(
            Func<T, int> getHashCode,
            Func<T, T, bool> equals)
        {
            if (getHashCode == null)
            {
                throw new ArgumentNullException(nameof(getHashCode));
            }

            if (equals == null)
            {
                throw new ArgumentNullException(nameof(equals));
            }

            return new Comparer<T>(getHashCode, equals);
        }

        public static IEqualityComparer<T> CreateDefault<T>()
        {
            Type type = typeof(T);
            var keyProperty = type.GetProperties().Single(prop => prop.GetCustomAttribute<KeyAttribute>() != null);
            return Create<T>(model =>
            {
                var hashCode = keyProperty.GetValue(model, null).GetHashCode();
                return hashCode;
            },
            (a, b) =>
            {
                var aValue = keyProperty.GetValue(a, null);
                var bValue = keyProperty.GetValue(b, null);
                var equal = aValue?.GetHashCode() == bValue?.GetHashCode();
                return equal;
            });
        }

        private class Comparer<T> : IEqualityComparer<T>
        {
            private readonly Func<T, int> _getHashCode;
            private readonly Func<T, T, bool> _equals;

            public Comparer(Func<T, int> getHashCode, Func<T, T, bool> equals)
            {
                _getHashCode = getHashCode;
                _equals = equals;
            }

            public bool Equals(T x, T y) => _equals(x, y);

            public int GetHashCode(T obj) => _getHashCode(obj);
        }
    }
}
