-- ----------------------------------------------------------------------------
-- 2026_08_03 — MinesweeperGame
--
-- Une ligne par partie de Démineur (mode normal ou défi quotidien), qu'elle
-- soit jouée par un compte connecté ou un invité (idUser NULL — jamais
-- classée, mais on garde la même table pour n'avoir qu'un seul moteur de jeu).
--
-- Le serveur est seul autoritaire sur le plateau (seed + firstClick
-- déterminent tout via MinesweeperBoardGenerator, port fidèle du générateur
-- TypeScript existant) et sur le chronométrage (startedAt/endedAt posés par
-- le serveur, jamais fournis par le client).
--
-- startedAt est NULL tant que la partie n'a pas réellement démarré : pour le
-- défi quotidien, la case centrale est auto-révélée à la création de la
-- session (sans faire courir le chrono), et seul le premier clic RÉEL du
-- joueur déclenche POST /Minesweeper/{id}/Start qui pose startedAt. En mode
-- normal, création de session et premier clic réel sont le même événement :
-- startedAt est donc posé dès la création.
--
-- challengeDate n'est renseignée qu'en mode "daily" : c'est elle (+ idUser +
-- sizeId) qui porte la contrainte "un seul essai par jour et par taille",
-- appliquée au niveau service (pas de contrainte UNIQUE SQL ici : un essai
-- "in_progress" doit pouvoir être repris tel quel après un rafraîchissement,
-- l'unicité ne s'applique qu'aux essais déjà conclus).
-- ----------------------------------------------------------------------------

CREATE TABLE MinesweeperGame
(
    idMinesweeperGame INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
    idUser            INT NULL,
    sizeId            NVARCHAR(20) NOT NULL,
    width             INT             NOT NULL,
    height            INT             NOT NULL,
    mineCount         INT             NOT NULL,
    mode              NVARCHAR(20) NOT NULL,
    challengeDate     DATE NULL,
    seed              BIGINT          NOT NULL,
    firstClickX       INT             NOT NULL,
    firstClickY       INT             NOT NULL,
    createdAt         DATETIME        NOT NULL,
    startedAt         DATETIME NULL,
    endedAt           DATETIME NULL,
    status            NVARCHAR(20) NOT NULL,
    elapsedMs         INT NULL,
    FOREIGN KEY (idUser) REFERENCES Users (idUser)
);

CREATE INDEX idx_minesweepergame_daily ON MinesweeperGame (idUser, mode, sizeId, challengeDate);
CREATE INDEX idx_minesweepergame_leaderboard ON MinesweeperGame (sizeId, mode, status, elapsedMs);
