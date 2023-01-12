 CREATE TABLE Parameters(
	name NVARCHAR(255) PRIMARY KEY NOT NULL,
	value NVARCHAR(255) NOT NULL
);

INSERT INTO Parameters (name, value) VALUES ('ScriptVersion','1.0.0-beta.27');