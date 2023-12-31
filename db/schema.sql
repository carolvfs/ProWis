CREATE SEQUENCE "project_seq" as integer START WITH 1;

CREATE TABLE "project" (
	"id" bigint DEFAULT NEXT VALUE FOR "project_seq",
	"title" character varying(200) NOT NULL,
	"creation_date" TIMESTAMP NOT NULL,
	"version" character varying(10) NOT NULL,
	"owner_id" bigint NOT NULL,
	CONSTRAINT "project_pk" PRIMARY KEY ("id")
);

CREATE SEQUENCE "workflow_seq" as integer START WITH 1;

CREATE TABLE "workflow" (
	"id" bigint DEFAULT NEXT VALUE FOR "workflow_seq",
	"name" character varying(100) NOT NULL,
	"project_id" bigint NOT NULL,
	"parent_id" bigint NOT NULL,
	CONSTRAINT "workflow_pk" PRIMARY KEY ("id")
);

CREATE SEQUENCE "user_seq" as integer START WITH 1;

CREATE TABLE "user" (
	"id" bigint DEFAULT NEXT VALUE FOR "user_seq",
	"name" character varying(100) NOT NULL,
	CONSTRAINT "user_pk" PRIMARY KEY ("id")
);


-- CREATE TABLE "user_access" (
-- 	"user_id" bigint NOT NULL,
-- 	"project_id" bigint NOT NULL,
-- 	CONSTRAINT "user_access_pk" PRIMARY KEY ("user_id","project_id")
-- );

CREATE SEQUENCE "activity_seq" as integer START WITH 1;

CREATE TABLE "activity" (
	"id" bigint DEFAULT NEXT VALUE FOR "activity_seq",
	"program_id" bigint NOT NULL,
	"workflow_id" bigint NOT NULL,
	"input_relation_id" bigint NOT NULL,
	"output_relation_id" bigint NOT NULL,
	CONSTRAINT "activity_pk" PRIMARY KEY ("id")
);


CREATE TABLE "program" (
	"id" bigint NOT NULL,
	"name" character varying(100) NOT NULL,
	"version" character varying(100) NOT NULL,
	CONSTRAINT "program_pk" PRIMARY KEY ("id")
);



CREATE TABLE "relation" (
	"id" bigint NOT NULL,
	"name" character varying(100) NOT NULL,
	CONSTRAINT "relation_pk" PRIMARY KEY ("id")
);

CREATE SEQUENCE "attribute_seq" as integer START WITH 1;

CREATE TABLE "attribute" (
	"id" bigint DEFAULT NEXT VALUE FOR "attribute_seq",
	"name" character varying(100) NOT NULL,
	"type_id" bigint NOT NULL,
	"relation_id" bigint NOT NULL,
	"size" double NOT NULL,
	CONSTRAINT "attribute_pk" PRIMARY KEY ("id")
);



CREATE TABLE "attribute_type" (
	"id" bigint NOT NULL,
	"name" character varying(100) NOT NULL,
	CONSTRAINT "attribute_type_pk" PRIMARY KEY ("id")
);

CREATE SEQUENCE "workflow_execution_seq" as integer START WITH 1;

CREATE TABLE "workflow_execution" (
	"id" bigint DEFAULT NEXT VALUE FOR "workflow_execution_seq",
	"workflow_id" bigint NOT NULL,
	"start_time" TIMESTAMP NOT NULL,
	"end_time" TIMESTAMP NOT NULL,
	CONSTRAINT "workflow_execution_pk" PRIMARY KEY ("id")
);

CREATE SEQUENCE "activity_execution_seq" as integer START WITH 1;

CREATE TABLE "activity_execution" (
	"id" bigint DEFAULT NEXT VALUE FOR "activity_execution_seq",
	"start_time" TIMESTAMP NOT NULL,
	"end_time" TIMESTAMP NOT NULL,
	"workflow_execution_id" bigint NOT NULL,
	"activity_id" bigint NOT NULL,
	CONSTRAINT "activity_execution_pk" PRIMARY KEY ("id")
);

CREATE SEQUENCE "relation_tuple_seq" as integer START WITH 1;

CREATE TABLE "relation_tuple" (
	"id" bigint DEFAULT NEXT VALUE FOR "relation_tuple_seq",
	"relation_id" bigint NOT NULL,
	"workflow_id" bigint NOT NULL,
	CONSTRAINT "relation_tuple_pk" PRIMARY KEY ("id")
);

CREATE SEQUENCE "attribute_value_seq" as integer START WITH 1;

CREATE TABLE "attribute_value" (
	"id" bigint DEFAULT NEXT VALUE FOR "attribute_value_seq",
	"attribute_id" bigint NOT NULL,
	"relation_tuple_id" bigint NOT NULL,
	"value" character varying(100) NOT NULL,    -- sem tamanho
	CONSTRAINT "attribute_value_pk" PRIMARY KEY ("id")
);


-- CREATE TABLE "file" (
-- 	"id" bigint NOT NULL,
-- 	"name" character varying(100) NOT NULL,
-- 	"path" character varying(100) NOT NULL,
-- 	"hash_code" character varying(100) NOT NULL,
-- 	"activity_execution_id" bigint NOT NULL,
-- 	"file_type_id" bigint NOT NULL,
-- 	CONSTRAINT "file_pk" PRIMARY KEY ("id")
-- );



-- CREATE TABLE "extracted_attribute" (
-- 	"attribute_value_id" bigint NOT NULL,
-- 	"file_id" bigint NOT NULL,
-- 	"extractor_id" bigint NOT NULL,
-- 	CONSTRAINT "extracted_attribute_pk" PRIMARY KEY ("attribute_value_id","file_id","extractor_id")
-- );



-- CREATE TABLE "file_type" (
-- 	"id" bigint NOT NULL,
-- 	"name" character varying(100) NOT NULL,
-- 	CONSTRAINT "file_type_pk" PRIMARY KEY ("id")
-- );


-- CREATE TABLE "extractor" (
-- 	"id" bigint NOT NULL,
-- 	"name" character varying(10) NOT NULL,  -- sem tamanho
-- 	"file_type_id" bigint NOT NULL,
-- 	CONSTRAINT "extractor_pk" PRIMARY KEY ("id")
-- );

CREATE SEQUENCE "ensemble_seq" as integer START WITH 1;

CREATE TABLE "ensemble" (
	"id" bigint DEFAULT NEXT VALUE FOR "ensemble_seq",
	"name" character varying(20) NOT NULL,
	"creation_date" TIMESTAMP NOT NULL,
	"collection_id" bigint NOT NULL,
	-- "grid_id" bigint NOT NULL,
	-- "project_id" bigint NOT NULL,
	CONSTRAINT "ensemble_pk" PRIMARY KEY ("id")
);

CREATE SEQUENCE "member_seq" as integer START WITH 1;

CREATE TABLE "member" (
	"id" bigint DEFAULT NEXT VALUE FOR "member_seq",
	"collection_member_id" bigint NOT NULL,
	"ensemble_id" bigint NOT NULL,
	CONSTRAINT "member_pk" PRIMARY KEY ("id")
);

-- CREATE TABLE "project_file_type" (
-- 	"project_id" bigint NOT NULL,
-- 	"file_type_id" bigint NOT NULL,
-- 	CONSTRAINT "project_file_type_pk" PRIMARY KEY ("project_id","file_type_id")
-- );

CREATE SEQUENCE "grid_seq" as integer START WITH 1;

CREATE TABLE "grid" (
	"id" bigint DEFAULT NEXT VALUE FOR "grid_seq",
	"name" character varying(10) NOT NULL,
	CONSTRAINT "grid_pk" PRIMARY KEY ("id")
);

CREATE SEQUENCE "domain_seq" as integer START WITH 1;

CREATE TABLE "domain" (
	"id" bigint DEFAULT NEXT VALUE FOR "domain_seq",
	"grid_id" bigint NOT NULL,
	"north_latitude" character varying(100) NOT NULL,
	"south_latitude" character varying(100) NOT NULL,
	"central_latitude" character varying(100) NOT NULL,
	"west_longitude" character varying(100) NOT NULL,
	"east_longitude" character varying(100) NOT NULL,
	"central_longitude" character varying(100) NOT NULL,
	"number_of_rows" bigint NOT NULL,
	"number_of_columns" bigint NOT NULL,
	"grid_distance" bigint NOT NULL,
	CONSTRAINT "domain_pk" PRIMARY KEY ("id")
);

CREATE TABLE "atmospheric_variable" (
	"id" bigint NOT NULL,
	"name" character varying(30) NOT NULL,
	"nickname" character varying(10) NOT NULL,
	CONSTRAINT "atmospheric_variable_pk" PRIMARY KEY ("id")
);

CREATE SEQUENCE "forecast_seq" as integer START WITH 1;

CREATE TABLE "forecast" (
	"id" bigint DEFAULT NEXT VALUE FOR "forecast_seq",
	"atmospheric_variable_id" bigint NOT NULL,
	"domain_id" bigint NOT NULL,
	"time" bigint NOT NULL,
	"value" double NOT NULL,
	"grid_point" int NOT NULL,
	"latitude" character varying(100) NOT NULL,
	"longitude" character varying(100) NOT NULL,
	-- "value" character varying(100) NOT NULL,
	CONSTRAINT "forecast_pk" PRIMARY KEY ("id")
);

CREATE SEQUENCE "measure_aggregation_seq" as integer START WITH 1;

CREATE TABLE "measure_aggregation" (
	"id" bigint DEFAULT NEXT VALUE FOR "measure_aggregation_seq",
	"name" character varying(10),
	"nickname" character varying(5),

	CONSTRAINT "measure_aggregation_pk" PRIMARY KEY ("id")
);

CREATE SEQUENCE "forecast_aggregation_seq" as integer START WITH 1;

CREATE TABLE "forecast_aggregation" (

	"id" bigint DEFAULT NEXT VALUE FOR "forecast_aggregation_seq",
	"atmospheric_variable_id" bigint,
	"domain_id" bigint,
	"time" bigint,
	"step" bigint,
	"measure_aggregation_id" bigint,
	"value" double,
	
	CONSTRAINT "forecast_aggregation_pk" PRIMARY KEY ("id")
);

CREATE SEQUENCE "forecast_accumulated_precipitation_seq" as integer START WITH 1;

CREATE TABLE "forecast_accumulated_precipitation" (

	"id" bigint DEFAULT NEXT VALUE FOR "forecast_accumulated_precipitation_seq",
	"domain_id" bigint,
	"time" bigint,
	"step" bigint,
	"grid_point" bigint,
	"value" double,
	
	CONSTRAINT "forecast_accumulated_precipitation_pk" PRIMARY KEY ("id")
);

CREATE SEQUENCE "collection_seq" as integer START WITH 1;

CREATE TABLE "collection" (
	"id" bigint DEFAULT NEXT VALUE FOR "collection_seq",
	"name" character varying(20) NOT NULL,
	"project_id" bigint NOT NULL,
	CONSTRAINT "collection_pk" PRIMARY KEY ("id")
);

CREATE SEQUENCE "collection_member_seq" as integer START WITH 1;

CREATE TABLE "collection_member" (
	"id" bigint DEFAULT NEXT VALUE FOR "collection_member_seq",
	"domain_id" bigint NOT NULL,
	"collection_id" bigint NOT NULL,
	CONSTRAINT "collection_member_pk" PRIMARY KEY ("id")
);

ALTER TABLE "project" ADD CONSTRAINT "project_fk0" FOREIGN KEY ("owner_id") REFERENCES "user"("id");

ALTER TABLE "workflow" ADD CONSTRAINT "workflow_fk0" FOREIGN KEY ("project_id") REFERENCES "project"("id");

-- ALTER TABLE "user_access" ADD CONSTRAINT "user_access_fk0" FOREIGN KEY ("user_id") REFERENCES "user"("id");
-- ALTER TABLE "user_access" ADD CONSTRAINT "user_access_fk1" FOREIGN KEY ("project_id") REFERENCES "project"("id");

ALTER TABLE "activity" ADD CONSTRAINT "activity_fk0" FOREIGN KEY ("program_id") REFERENCES "program"("id");
ALTER TABLE "activity" ADD CONSTRAINT "activity_fk1" FOREIGN KEY ("workflow_id") REFERENCES "workflow"("id");
ALTER TABLE "activity" ADD CONSTRAINT "activity_fk2" FOREIGN KEY ("input_relation_id") REFERENCES "relation"("id");
ALTER TABLE "activity" ADD CONSTRAINT "activity_fk3" FOREIGN KEY ("output_relation_id") REFERENCES "relation"("id");

ALTER TABLE "attribute" ADD CONSTRAINT "attribute_fk0" FOREIGN KEY ("type_id") REFERENCES "attribute_type"("id");
ALTER TABLE "attribute" ADD CONSTRAINT "attribute_fk1" FOREIGN KEY ("relation_id") REFERENCES "relation"("id");

ALTER TABLE "workflow_execution" ADD CONSTRAINT "workflow_execution_fk0" FOREIGN KEY ("workflow_id") REFERENCES "workflow"("id");

ALTER TABLE "activity_execution" ADD CONSTRAINT "activity_execution_fk0" FOREIGN KEY ("workflow_execution_id") REFERENCES "workflow_execution"("id");
ALTER TABLE "activity_execution" ADD CONSTRAINT "activity_execution_fk1" FOREIGN KEY ("activity_id") REFERENCES "activity"("id");

ALTER TABLE "relation_tuple" ADD CONSTRAINT "relation_tuple_fk0" FOREIGN KEY ("relation_id") REFERENCES "relation"("id");
ALTER TABLE "relation_tuple" ADD CONSTRAINT "relation_tuple_fk1" FOREIGN KEY ("workflow_id") REFERENCES "workflow"("id");

ALTER TABLE "attribute_value" ADD CONSTRAINT "attribute_value_fk0" FOREIGN KEY ("attribute_id") REFERENCES "attribute"("id");
ALTER TABLE "attribute_value" ADD CONSTRAINT "attribute_value_fk1" FOREIGN KEY ("relation_tuple_id") REFERENCES "relation_tuple"("id");

-- ALTER TABLE "file" ADD CONSTRAINT "file_fk0" FOREIGN KEY ("activity_execution_id") REFERENCES "activity_execution"("id");
-- ALTER TABLE "file" ADD CONSTRAINT "file_fk1" FOREIGN KEY ("file_type_id") REFERENCES "file_type"("id");

-- ALTER TABLE "extracted_attribute" ADD CONSTRAINT "extracted_attribute_fk0" FOREIGN KEY ("attribute_value_id") REFERENCES "attribute_value"("id");
-- ALTER TABLE "extracted_attribute" ADD CONSTRAINT "extracted_attribute_fk1" FOREIGN KEY ("file_id") REFERENCES "file"("id");
-- ALTER TABLE "extracted_attribute" ADD CONSTRAINT "extracted_attribute_fk2" FOREIGN KEY ("extractor_id") REFERENCES "extractor"("id");


-- ALTER TABLE "extractor" ADD CONSTRAINT "extractor_fk0" FOREIGN KEY ("file_type_id") REFERENCES "file_type"("id");


-- ALTER TABLE "project_file_type" ADD CONSTRAINT "project_file_type_fk0" FOREIGN KEY ("project_id") REFERENCES "project"("id");
-- ALTER TABLE "project_file_type" ADD CONSTRAINT "project_file_type_fk1" FOREIGN KEY ("file_type_id") REFERENCES "file_type"("id");

ALTER TABLE "domain" ADD CONSTRAINT "domain_fk0" FOREIGN KEY ("grid_id") REFERENCES "grid"("id");

ALTER TABLE "forecast" ADD CONSTRAINT "forecast_fk0" FOREIGN KEY ("atmospheric_variable_id") REFERENCES "atmospheric_variable"("id");
ALTER TABLE "forecast" ADD CONSTRAINT "forecast_fk1" FOREIGN KEY ("domain_id") REFERENCES "domain"("id");

ALTER TABLE "member" ADD CONSTRAINT "member_fk0" FOREIGN KEY ("collection_member_id") REFERENCES "collection_member"("id");
ALTER TABLE "member" ADD CONSTRAINT "member_fk1" FOREIGN KEY ("ensemble_id") REFERENCES "ensemble"("id");

ALTER TABLE "ensemble" ADD CONSTRAINT "ensemble_fk0" FOREIGN KEY ("collection_id") REFERENCES "collection"("id");

ALTER TABLE "forecast_aggregation" ADD CONSTRAINT "forecast_aggregation_fk1" FOREIGN KEY ("atmospheric_variable_id") REFERENCES "atmospheric_variable"("id");
ALTER TABLE "forecast_aggregation" ADD CONSTRAINT "forecast_aggregation_fk2" FOREIGN KEY ("domain_id") REFERENCES "domain"("id");
ALTER TABLE "forecast_aggregation" ADD CONSTRAINT "forecast_aggregation_fk3" FOREIGN KEY ("measure_aggregation_id") REFERENCES "measure_aggregation"("id");

ALTER TABLE "forecast_accumulated_precipitation" ADD CONSTRAINT "forecast_accumulated_precipitation_fk1" FOREIGN KEY ("domain_id") REFERENCES "domain"("id");

ALTER TABLE "collection" ADD CONSTRAINT "collection_fk0" FOREIGN KEY ("project_id") REFERENCES "project"("id");

ALTER TABLE "collection_member" ADD CONSTRAINT "collection_member_fk0" FOREIGN KEY ("domain_id") REFERENCES "domain"("id");
ALTER TABLE "collection_member" ADD CONSTRAINT "collection_member_fk1" FOREIGN KEY ("collection_id") REFERENCES "collection"("id");

CREATE IMPRINTS INDEX idx_r_tuple_relation ON relation_tuple (relation_id);
CREATE IMPRINTS INDEX idx_r_tuple_workflow ON relation_tuple (workflow_id);
CREATE INDEX idx_relation_name ON relation (name);

CREATE UNIQUE INDEX idxrelation_id ON RELATION_TUPLE (relation_id);
CREATE UNIQUE INDEX idxworkflow_id ON RELATION_TUPLE (workflow_id);
CREATE UNIQUE INDEX idxtuple_id ON ATTRIBUTE_VALUE (relation_tuple_id);
CREATE UNIQUE INDEX idxattribute_id ON ATTRIBUTE_VALUE (attribute_id);
CREATE UNIQUE INDEX idxnickname ON ATMOSPHERIC_VARIABLE (nickname);
CREATE UNIQUE INDEX idxdomain ON FORECAST_AGGREGATION (domain_id);
CREATE UNIQUE INDEX idxdomtimestep ON FORECAST_ACCUMULATED_PRECIPITATION (domain_id,time,step);