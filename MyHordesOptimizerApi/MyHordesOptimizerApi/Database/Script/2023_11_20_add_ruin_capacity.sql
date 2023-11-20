ALTER TABLE Ruin
    ADD COLUMN capacity INT NULL DEFAULT 100 AFTER chance;

ALTER VIEW RuinComplete AS 
SELECT r.idRuin AS idRuin
      ,r.label_fr AS ruinLabel_fr
      ,r.label_en AS ruinLabel_en
      ,r.label_es AS ruinLabel_es
      ,r.label_de AS ruinLabel_de
      ,r.description_fr AS ruinDescription_fr
      ,r.description_en AS ruinDescription_en
      ,r.description_es AS ruinDescription_es
      ,r.description_de AS ruinDescription_de
      ,r.explorable AS ruinExplorable
      ,r.img AS ruinImg
      ,r.camping AS ruinCamping
      ,r.minDist AS ruinMinDist
      ,r.maxDist AS ruinMaxDist
      ,r.chance AS ruinChance
      ,r.capacity AS ruinCapacity
	  ,i.idItem AS idItem
	  ,i.uid AS itemUid
	  ,i.label_fr AS itemLabel_fr
	  ,rid.probability AS dropProbability
	  ,rid.weight AS dropWeight
  FROM Ruin r
  LEFT JOIN RuinItemDrop rid ON rid.idRuin = r.idRuin
  LEFT JOIN Item i ON i.idItem = rid.idItem;