CREATE SCHEMA IF NOT EXISTS clinic;
SET search_path TO clinic, public;

CREATE TYPE appointment_status AS ENUM ('scheduled', 'completed', 'cancelled');
CREATE TYPE visit_modality     AS ENUM ('in_person', 'online');

CREATE TABLE doctors (
    id                  BIGSERIAL PRIMARY KEY,
    full_name           TEXT        NOT NULL,
    specialty           TEXT        NOT NULL,
    city                TEXT        NOT NULL,
    address             TEXT,
    phone_country_code  VARCHAR(8),
    phone_number        VARCHAR(32),
    rating              NUMERIC(2,1),
    review_count        INTEGER,
    source_profile_url  TEXT        NOT NULL
);

CREATE TABLE treatments (
    id          BIGSERIAL PRIMARY KEY,
    doctor_id   BIGINT      NOT NULL REFERENCES doctors(id),
    name        TEXT        NOT NULL,
    price       TEXT,
    currency    CHAR(3),
    duration_minutes SMALLINT
);

CREATE UNIQUE INDEX ux_treatments_doctor_name
    ON treatments(doctor_id, name);

CREATE TABLE doctor_availability (
    id          BIGSERIAL PRIMARY KEY,
    doctor_id   BIGINT          NOT NULL REFERENCES doctors(id),
    start_at    TIMESTAMPTZ     NOT NULL,
    end_at      TIMESTAMPTZ     NOT NULL,
    modality    visit_modality  NOT NULL
);

CREATE TABLE patients (
    id              BIGSERIAL PRIMARY KEY,
    full_name       TEXT        NOT NULL,
    document_number VARCHAR(32),
    phone_number    VARCHAR(32),
    email           TEXT
);

CREATE TABLE appointments (
    id              BIGSERIAL PRIMARY KEY,
    doctor_id       BIGINT              NOT NULL REFERENCES doctors(id),
    patient_id      BIGINT              NOT NULL REFERENCES patients(id),
    treatment_id    BIGINT              NOT NULL REFERENCES treatments(id),
    start_at        TIMESTAMPTZ         NOT NULL,
    end_at          TIMESTAMPTZ         NOT NULL,
    status          appointment_status  NOT NULL DEFAULT 'scheduled'
);

CREATE TABLE users (
    id              BIGSERIAL PRIMARY KEY,
    username        VARCHAR(50)         NOT NULL UNIQUE,
    password        VARCHAR(255)        NOT NULL,
    role            VARCHAR(20)         NOT NULL DEFAULT 'admin',
    created_at      TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ         NOT NULL DEFAULT NOW()
);

