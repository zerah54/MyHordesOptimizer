-- Unicité de l'identité des référentiels.
--
-- Elle vient APRÈS le remplissage et les imports : elle scelle un état vérifié plutôt que d'en
-- imposer un. C'est la garantie durable que le uid porte bien l'identité — un doublon devient
-- désormais une erreur immédiate, et non un silence qui aurait fait vivre deux lignes pour un
-- même prototype.
--
-- AVANT DE JOUER CE SCRIPT, les quatre requêtes ci-dessous doivent toutes renvoyer 0 ligne.
-- Si l'une ne le fait pas, la traiter d'abord : un doublon d'identité signifie que le
-- rapprochement a créé une ligne au lieu d'en mettre une à jour.
--
--   SELECT uid, COUNT(*) FROM Item     GROUP BY uid HAVING COUNT(*) > 1;
--   SELECT uid, COUNT(*) FROM Building GROUP BY uid HAVING COUNT(*) > 1;
--   SELECT img, COUNT(*) FROM Ruin     GROUP BY img HAVING COUNT(*) > 1;
--   SELECT uid, COUNT(*) FROM Picto    GROUP BY uid HAVING COUNT(*) > 1;
--
-- Note : une contrainte UNIQUE MySQL n'interdit pas plusieurs NULL. Les lignes sans identité —
-- les pictos nés d'une récompense de joueur, en attente de leur uid — restent donc possibles,
-- et c'est voulu : ImportPictos les rattache par leur mhId au passage suivant.

ALTER TABLE Item
    ADD CONSTRAINT uq_Item_uid UNIQUE (uid);
ALTER TABLE Building
    ADD CONSTRAINT uq_Building_uid UNIQUE (uid);
ALTER TABLE Ruin
    ADD CONSTRAINT uq_Ruin_img UNIQUE (img);
ALTER TABLE Picto
    ADD CONSTRAINT uq_Picto_uid UNIQUE (uid);
