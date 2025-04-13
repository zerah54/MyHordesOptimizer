﻿ALTER TABLE Recipe
ADD COLUMN provokingItemId INT NULL DEFAULT NULL REFERENCES Item(idItem);


ALTER VIEW RecipeComplet AS
SELECT r.name AS recipeName
      ,r.action_fr AS actionFr
      ,r.action_en AS actionEn
      ,r.action_de AS actionDe
      ,r.action_es AS actionEs
      ,r.type AS type
      ,r.pictoUid AS pictoUid
      ,r.stealthy AS stealthy
      ,r.provokingItemId AS provokingItemId
	  ,ric.idItem AS componentItemId
	  ,ric.count AS componentCount
	  ,rir.idItem AS resultItemId
	  ,rir.probability AS resultProbability
	  ,rir.weight AS resultWeight
  FROM Recipe r
  LEFT JOIN RecipeItemComponent ric ON r.name = ric.recipeName
  LEFT JOIN RecipeItemResult rir ON r.name = rir.recipeName;