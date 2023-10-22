CREATE TABLE UserAvailabilityType(
    idUserAvailabilityType INT NOT NULL AUTO_INCREMENT,
    typeName_fr NVARCHAR(255),
    typeName_en NVARCHAR(255),
    typeName_de NVARCHAR(255),
    typeName_es NVARCHAR(255),
    PRIMARY KEY (idUserAvailabilityType)
)

CREATE TABLE UserAvailability(
    idUserAvailability INT NOT NULL AUTO_INCREMENT,
    idUser INT NOT NULL,
    idTown INT,
    startDate datetime,
    endDate datetime,
    idUserAvailabilityType INT,
    comment TEXT,
    canLead BIT,
    PRIMARY KEY (idUserAvailability),
    FOREIGN KEY(idUserAvailabilityType) REFERENCES UserAvailabilityType(idUserAvailabilityType)
)