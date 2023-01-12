using Newtonsoft.Json;
using System;
using System.Reflection;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.HeroicAction
{
    public class ActionHeroicDto
    {
        [JsonProperty("label")]
        public string Label { get; set; }

        [JsonProperty("locale")]
        public string Locale { get; set; }

        [JsonProperty("value")]
        public int Value { get; set; }
    }

    public enum ActionHeroicType
    {
        [Fr("Sauvetage"), En("Rescue"), De("Rettung"), Es("Rescate")]
        Rescue,
        [Fr("Uppercut sauvage"), En("Vicious Uppercut"), De("Wildstyle Uppercut"), Es("Puñetazo salvaje")]
        Uppercut,
        [Fr("Second souffle"), En("Second wind"), De("Zweite Lunge"), Es("Segundo Aliento")]
        SecondWind,
        [Fr("Trouvaille (améliorée)"), En("Lucky Find"), De("Schönes Fundstück"), Es("Hallazgo")]
        LuckyFind,   
        [Fr("Trouvaille"), En("Seeker"), De("Fund"), Es("Hallazgo")]
        NormalFind,
        [Fr("Vaincre la mort"), En("Cheat Death"), De("Den Tod besiegen"), Es("Vencer a la muerte")]
        CheatDeath,
        [Fr("Retour du Héros"), En("Heroic Return"), De("Die Rückkehr des Helden"), Es("El retorno del Héroe")]
        HeroicReturn,
        [Fr("Appareil photo d'avant-guerre"), En("Pre-war camera"), De("Kamera aus Vorkriegs-Tagen"), Es("Cámara fotográfica de post-guerra")]
        Apag,
        [Fr("Passage en Force"), En("Break Through"), De("Durchgang in Kraft"), Es("Pasaje en vigor")]
        BreakThrough,
        [Fr("Camaraderie"), En("Brothers in Arms"), De("Freundschaft"), Es("Camaradería")]
        HasBrotherInArms
    }

    public enum ActionHeroicZone
    {
        Outside,
        Inside
    }

    internal class LocaleAttribute : Attribute
    {
        public string Name { get; set; }

        public LocaleAttribute(string name)
        {
            Name = name;
        }
    }

    internal class FrAttribute : LocaleAttribute
    {
        public FrAttribute(string name) : base(name)
        {
        }
    }

    internal class DeAttribute : LocaleAttribute
    {
        public DeAttribute(string name) : base(name)
        {
        }
    }

    internal class EnAttribute : LocaleAttribute
    {
        public EnAttribute(string name) : base(name)
        {
        }
    }

    internal class EsAttribute : LocaleAttribute
    {
        public EsAttribute(string name) : base(name)
        {
        }
    }

    public static class ActionHeroicTypeExtensions
    {
        /// <summary>
        /// Retourne l'attribut description de l'enum en fonction de sa valeur
        /// Lève une exception ArgumentException si l'enum n'est pas reconnu
        /// </summary>
        /// <typeparam name="T"></typeparam>
        /// <param name="actionValue"></param>
        /// <returns></returns>
        public static bool IsEquivalentToLabel(this ActionHeroicType actionValue, string local, string label)
        {
            var type = typeof(ActionHeroicType);
            string name = Enum.GetName(type, actionValue);
            if (name != null)
            {
                FieldInfo field = type.GetField(name);
                if (field != null)
                {
                    Type attrType = null;
                    switch (local)
                    {
                        case "fr":
                            attrType = typeof(FrAttribute);
                            break;
                        case "en":
                            attrType = typeof(EnAttribute);
                            break;
                        case "es":
                            attrType = typeof(EsAttribute);
                            break;
                        case "de":
                            attrType = typeof(DeAttribute);
                            break;                     }
                    LocaleAttribute attr =
                           Attribute.GetCustomAttribute(field,
                             attrType) as LocaleAttribute;
                    if (attr != null)
                    {
                        return attr.Name == label;
                    }
                }
            }
            return false;
        }
    }
}
