using System;

namespace MyHordesOptimizerApi.Attributes
{
    [AttributeUsage(AttributeTargets.Method)]
    public class AllowExternalAccessAttribute : Attribute
    {
    }
}