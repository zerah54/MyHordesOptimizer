using System.ComponentModel;

namespace MyHordesOptimizerApi.DiscordBot.Utility
{
    public static class DiscordBotGamesValues
    {
        public enum Dices
        {
            D4,
            D6,
            D8,
            D10,
            D12,
            D20,
            D100,
        }

        public enum PF
        {
            Pile,
            Face,
        }

        public enum PFC
        {
            Pierre,
            Feuille,
            Ciseaux,
        }

        public enum Letters
        {
            A,
            B,
            C,
            D,
            E,
            F,
            G,
            H,
            I,
            J,
            K,
            L,
            M,
            N,
            O,
            P,
            Q,
            R,
            S,
            T,
            U,
            V,
            W,
            X,
            Y,
            Z
        }

        public enum Vowels
        {
            A,
            E,
            I,
            O,
            U,
            Y
        }

        public enum Consonants
        {
            B,
            C,
            D,
            F,
            G,
            H,
            J,
            K,
            L,
            M,
            N,
            P,
            Q,
            R,
            S,
            T,
            V,
            W,
            X,
            Z
        }

        public enum Cards
        {
            // Cœur
            [Description("As de Cœur")]
            AsDeCoeur,
            [Description("Roi de Cœur")]
            RoiDeCoeur,
            [Description("Dame de Cœur")]
            DameDeCoeur,
            [Description("Valet de Cœur")]
            ValetDeCoeur,
            [Description("10 de Cœur")]
            DixDeCoeur,
            [Description("9 de Cœur")]
            NeufDeCoeur,
            [Description("8 de Cœur")]
            HuitDeCoeur,
            [Description("7 de Cœur")]
            SeptDeCoeur,
            [Description("6 de Cœur")]
            SixDeCoeur,
            [Description("5 de Cœur")]
            CinqDeCoeur,
            [Description("4 de Cœur")]
            QuatreDeCoeur,
            [Description("3 de Cœur")]
            TroisDeCoeur,
            [Description("2 de Cœur")]
            DeuxDeCoeur,

            // Trèfle
            [Description("As de Trèfle")]
            AsDeTrefle,
            [Description("Roi de Trèfle")]
            RoiDeTrefle,
            [Description("Dame de Trèfle")]
            DameDeTrefle,
            [Description("Valet de Trèfle")]
            ValetDeTrefle,
            [Description("10 de Trèfle")]
            DixDeTrefle,
            [Description("9 de Trèfle")]
            NeufDeTrefle,
            [Description("8 de Trèfle")]
            HuitDeTrefle,
            [Description("7 de Trèfle")]
            SeptDeTrefle,
            [Description("6 de Trèfle")]
            SixDeTrefle,
            [Description("5 de Trèfle")]
            CinqDeTrefle,
            [Description("4 de Trèfle")]
            QuatreDeTrefle,
            [Description("3 de Trèfle")]
            TroisDeTrefle,
            [Description("2 de Trèfle")]
            DeuxDeTrefle,

            // Carreau
            [Description("As de Carreau")]
            AsDeCarreau,
            [Description("Roi de Carreau")]
            RoiDeCarreau,
            [Description("Dame de Carreau")]
            DameDeCarreau,
            [Description("Valet de Carreau")]
            ValetDeCarreau,
            [Description("10 de Carreau")]
            DixDeCarreau,
            [Description("9 de Carreau")]
            NeufDeCarreau,
            [Description("8 de Carreau")]
            HuitDeCarreau,
            [Description("7 de Carreau")]
            SeptDeCarreau,
            [Description("6 de Carreau")]
            SixDeCarreau,
            [Description("5 de Carreau")]
            CinqDeCarreau,
            [Description("4 de Carreau")]
            QuatreDeCarreau,
            [Description("3 de Carreau")]
            TroisDeCarreau,
            [Description("2 de Carreau")]
            DeuxDeCarreau,

            // Pique
            [Description("As de Pique")]
            AsDePique,
            [Description("Roi de Pique")]
            RoiDePique,
            [Description("Dame de Pique")]
            DameDePique,
            [Description("Valet de Pique")]
            ValetDePique,
            [Description("10 de Pique")]
            DixDePique,
            [Description("9 de Pique")]
            NeufDePique,
            [Description("8 de Pique")]
            HuitDePique,
            [Description("7 de Pique")]
            SeptDePique,
            [Description("6 de Pique")]
            SixDePique,
            [Description("5 de Pique")]
            CinqDePique,
            [Description("4 de Pique")]
            QuatreDePique,
            [Description("3 de Pique")]
            TroisDePique,
            [Description("2 de Pique")]
            DeuxDePique
        }
    }
}