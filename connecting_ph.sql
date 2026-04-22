-- ============================================
-- CONNECT PH - ESQUEMA INICIAL PostgreSQL
-- Optimizado para Cloud SQL (GCP) y +2,000 usuarios
-- ============================================

-- 1. Extensiones necesarias
-- Cloud SQL incluye uuid-ossp por defecto
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 2. TABLAS MAESTRAS (Nivel 1)
-- ============================================

-- 2.1 Roles del sistema
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    scopes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2.2 Propiedad Horizontal (PH)
CREATE TABLE IF NOT EXISTS phs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) NOT NULL,
    tax_id VARCHAR(20) UNIQUE,
    address TEXT,
    phone_number VARCHAR(20),
    email VARCHAR(100),
    logo_url VARCHAR(255),
    legal_representative VARCHAR(150),
    is_active BOOLEAN DEFAULT true,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    stratum VARCHAR(50),
    number_of_towers INTEGER,
    amount_of_real_state INTEGER,
    horizontal_property_regulations TEXT,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2.3 Usuarios
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    document_type VARCHAR(20),
    document_number VARCHAR(50),
    phone_number VARCHAR(20),
    avatar_url VARCHAR(255),
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    person_type VARCHAR(20),
    gender VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2.4 UserRoles (relación usuario ↔ rol)
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    users_id UUID REFERENCES users(id) ON DELETE CASCADE,
    roles_id UUID REFERENCES roles(id),
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2.5 UserRolesPhs (usuario-rol dentro de un PH específico)
CREATE TABLE IF NOT EXISTS user_roles_phs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phs_id UUID REFERENCES phs(id) ON DELETE CASCADE,
    user_roles_id UUID REFERENCES user_roles(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2.6 Unidades (apartamentos/ oficinas)
CREATE TABLE IF NOT EXISTS units (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phs_id UUID REFERENCES phs(id) ON DELETE CASCADE,
    block VARCHAR(20),
    unit_number VARCHAR(20) NOT NULL,
    type VARCHAR(30),
    coefficient DECIMAL(10,4),  -- Coeficiente de co-propiedad
    floor INTEGER,
    area DECIMAL(10,2),
    is_active BOOLEAN DEFAULT true,
    tax_responsible VARCHAR(150),
    rf_document_type VARCHAR(20),
    rf_document_number VARCHAR(50),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2.7 UnitAssignments (asignación usuario ↔ unidad)
CREATE TABLE IF NOT EXISTS unit_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    units_id UUID REFERENCES units(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    is_main_resident BOOLEAN DEFAULT false,
    can_vote BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 3. MÓDULO ASAMBLEAS
-- ============================================

-- 3.1 Agenda de asamblea
CREATE TABLE IF NOT EXISTS agenda (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assembly_id UUID REFERENCES assemblies(id) ON DELETE CASCADE,
    sort_order INTEGER,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    is_votable BOOLEAN DEFAULT false,
    required_quorum DECIMAL(5,2),
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3.2 Asambleas
CREATE TABLE IF NOT EXISTS assemblies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phs_id UUID REFERENCES phs(id),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    type VARCHAR(50),
    status VARCHAR(30) DEFAULT 'Programada',
    scheduled_at TIMESTAMP NOT NULL,
    started_at TIMESTAMP,
    finished_at TIMESTAMP,
    livekit_room_name VARCHAR(100) UNIQUE,
    quorum_requirement DECIMAL(5,2) DEFAULT 50.00,  -- 50% por defecto
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3.3 Anuncios de asamblea
CREATE TABLE IF NOT EXISTS assembly_announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assemblies_id UUID REFERENCES assemblies(id) ON DELETE CASCADE,
    title VARCHAR(100),
    message TEXT NOT NULL,
    type VARCHAR(30) DEFAULT 'INFO',
    is_sticky BOOLEAN DEFAULT false,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3.4 Asistencia a asambleas (con coeficiente)
CREATE TABLE IF NOT EXISTS assembly_attendances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assemblies_id UUID REFERENCES assemblies(id) ON DELETE CASCADE,
    unit_assignments_id UUID REFERENCES unit_assignments(id),
    arrival_at TIMESTAMP,
    departure_at TIMESTAMP,
    is_present BOOLEAN DEFAULT true,
    proxy_file_id UUID REFERENCES files(id),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3.5 Preguntas de votación
CREATE TABLE IF NOT EXISTS voting_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agenda_id UUID REFERENCES agenda(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    description TEXT,
    type VARCHAR(30),
    status VARCHAR(20) DEFAULT 'PENDIENTE',
    result_type VARCHAR(20),
    min_selections INTEGER,
    max_selections INTEGER,
    opened_at TIMESTAMP,
    closed_at TIMESTAMP,
    is_active BOOLEAN DEFAULT false,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3.6 Opciones de respuesta
CREATE TABLE IF NOT EXISTS questions_options (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_id UUID REFERENCES voting_questions(id) ON DELETE CASCADE,
    option_text VARCHAR(255) NOT NULL,
    order_index INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3.7 Votos (con coeficiente ponderado)
CREATE TABLE IF NOT EXISTS votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    voting_questions_id UUID REFERENCES voting_questions(id),
    questions_options_id UUID REFERENCES questions_options(id),
    assembly_attendances_id UUID REFERENCES assembly_attendances(id),
    coefficient_at_voting DECIMAL(10,6),  -- Coeficiente ponderado
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_vote_per_question UNIQUE(voting_questions_id, assembly_attendances_id)
);

-- 3.8 Preguntas Q&A
CREATE TABLE IF NOT EXISTS qa_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assembly_attendances_id UUID REFERENCES assembly_attendances(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    is_moderated BOOLEAN DEFAULT false,
    status VARCHAR(20) DEFAULT 'PENDIENTE',
    answer_text TEXT,
    answered_at TIMESTAMP,
    is_private BOOLEAN DEFAULT false,
    upvotes INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 4. SEGURIDAD Y ACCESS CONTROL (placeholder)
-- ============================================
-- Tablas pendientes del Excel original (guard_assignments, visitor_access_permits, etc.)
-- Se completarán en futuras migraciones

-- ============================================
-- 5. ÍNDICES CRÍTICOS PARA RENDIMIENTO
-- ============================================

-- Índices para assembly_attendances (frecuente consulta por asamblea)
CREATE INDEX IF NOT EXISTS idx_assembly_attendances_assembly 
    ON assembly_attendances(assemblies_id);
CREATE INDEX IF NOT EXISTS idx_assembly_attendances_unit_assignment 
    ON assembly_attendances(unit_assignments_id);

-- Índices para votes (cálculo de resultados)
CREATE INDEX IF NOT EXISTS idx_votes_assembly_attendance 
    ON votes(assembly_attendances_id);
CREATE INDEX IF NOT EXISTS idx_votes_question 
    ON votes(voting_questions_id);

-- Índices para qa_entries (Q&A tiempo real)
CREATE INDEX IF NOT EXISTS idx_qa_entries_attendance 
    ON qa_entries(assembly_attendances_id);
CREATE INDEX IF NOT EXISTS idx_qa_entries_created_at 
    ON qa_entries(created_at DESC);

-- Índices para assemblies (búsquedas)
CREATE INDEX IF NOT EXISTS idx_assemblies_ph 
    ON assemblies(phs_id);
CREATE INDEX IF NOT EXISTS idx_assemblies_scheduled_at 
    ON assemblies(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_assemblies_status 
    ON assemblies(status);

-- Índices para units (por PH)
CREATE INDEX IF NOT EXISTS idx_units_ph 
    ON units(phs_id);

-- ============================================
-- 6. DATOS INICIALES (Seed)
-- ============================================

-- Insertar roles básicos (si no existen)
INSERT INTO roles (id, name, description, scopes) VALUES 
  (uuid_generate_v4(), 'SUPER_ADMIN', 'Control total del sistema', '["*"]'),
  (uuid_generate_v4(), 'ADMIN_PH', 'Administrador de propiedad horizontal', '["ph:manage","assembly:manage","vote:manage"]'),
  (uuid_generate_v4(), 'RESIDENTE', 'Propietario o arrendatario', '["assembly:view","vote:cast","qa:post"]'),
  (uuid_generate_v4(), 'PORTERO', 'Personal de portería y seguridad', '["access:manage","package:manage"]')
ON CONFLICT (name) DO NOTHING;

-- Estado de asambleas (coinciden con enum en NestJS)
-- Los estados se manejan como strings, no como tabla maestra

-- ============================================
-- 7. VACUUM Y ANALYZE (optimización inicial)
-- ============================================
VACUUM ANALYZE;

-- ============================================
-- FIN DEL SCRIPT
-- ============================================
-- NOTA: Este script es idempotente (puede ejecutarse múltiples veces)
-- Para producción, ejecutar una sola vez en instancia nueva.

CREATE TABLE phs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) NOT NULL,
    tax_id VARCHAR(20) UNIQUE,
    address TEXT,
    phone_number VARCHAR(20),
    email VARCHAR(100),
    logo_url VARCHAR(255),
    legal_representative VARCHAR(150),
    is_active BOOLEAN DEFAULT true,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    stratum VARCHAR(50),
    number_of_towers INTEGER,
    amount_of_real_state INTEGER,
    horizontal_property_regulations TEXT,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    document_type VARCHAR(20),
    document_number VARCHAR(50),
    phone_number VARCHAR(20),
    avatar_url VARCHAR(255),
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    person_type VARCHAR(20),
    gender VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

    CREATE TABLE agenda (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assembly_id UUID REFERENCES assemblies(id) ON DELETE CASCADE,
    sort_order INTEGER,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    is_votable BOOLEAN DEFAULT false,
    required_quorum DECIMAL(5,2),
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

--- 2. TABLAS DE RELACIÓN DE USUARIOS Y UNIDADES ---

CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    users_id UUID REFERENCES users(id) ON DELETE CASCADE,
    roles_id UUID REFERENCES roles(id),
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_roles_phs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phs_id UUID REFERENCES phs(id) ON DELETE CASCADE,
    user_roles_id UUID REFERENCES user_roles(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE units (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phs_id UUID REFERENCES phs(id) ON DELETE CASCADE,
    block VARCHAR(20),
    unit_number VARCHAR(20) NOT NULL,
    type VARCHAR(30),
    coefficient DECIMAL(10,4),
    floor INTEGER,
    area DECIMAL(10,2),
    is_active BOOLEAN DEFAULT true,
    tax_responsible VARCHAR(150),
    rf_document_type VARCHAR(20),
    rf_document_number VARCHAR(50),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE unit_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    units_id UUID REFERENCES units(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    is_main_resident BOOLEAN DEFAULT false,
    can_vote BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

--- 3. GESTIÓN DE ARCHIVOS ---

CREATE TABLE files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phs_id UUID REFERENCES phs(id),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    original_name VARCHAR(255),
    storage_path VARCHAR(500) NOT NULL,
    mimetype VARCHAR(100),
    size_bytes BIGINT,
    extension VARCHAR(10),
    checksum VARCHAR(255),
    is_public BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

--- 4. MÓDULO DE ASAMBLEAS (Votaciones y Q&A) ---

CREATE TABLE assemblies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phs_id UUID REFERENCES phs(id),
    name VARCHAR(200),
    description TEXT,
    type VARCHAR(50),
    status VARCHAR(30),
    scheduled_at TIMESTAMP,
    started_at TIMESTAMP,
    finished_at TIMESTAMP,
    livekit_room_name VARCHAR(100),
    quorum_requirement DECIMAL(5,2),
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE assembly_attendances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assemblies_id UUID REFERENCES assemblies(id),
    unit_assignments_id UUID REFERENCES unit_assignments(id),
    arrival_at TIMESTAMP,
    departure_at TIMESTAMP,
    is_present BOOLEAN DEFAULT true,
    proxy_file_id UUID REFERENCES files(id),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE voting_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agenda_id UUID REFERENCES agenda(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    description TEXT,
    type VARCHAR(30),
    status VARCHAR(20),
    result_type VARCHAR(20),
    min_selections INTEGER,
    max_selections INTEGER,
    opened_at TIMESTAMP,
    closed_at TIMESTAMP,
    is_active BOOLEAN DEFAULT false,
    created_by UUID REFERENCES users(id),   
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE questions_options (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_id UUID REFERENCES voting_questions(id) ON DELETE CASCADE,
    option_text VARCHAR(255) NOT NULL,
    order_index INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    voting_questions_id UUID REFERENCES voting_questions(id),
    questions_options_id UUID REFERENCES questions_options(id),
    assembly_attendances_id UUID REFERENCES assembly_attendances(id),
    coefficient_at_voting DECIMAL(10,6),
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

--- 5. SEGURIDAD Y PORTERÍA ---

CREATE TABLE guard_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_roles_id UUID REFERENCES user_roles(id),
    phs_id UUID REFERENCES phs(id),
    station_name VARCHAR(50),
    shift_start TIME,
    shift_end TIME,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);

CREATE TABLE visitor_access_permits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    unit_assignments_id UUID REFERENCES unit_assignments(id),
    visitor_name VARCHAR(150),
    visitor_id_number VARCHAR(50),
    visitor_type VARCHAR(30),
    qr_code_token VARCHAR(255),
    starts_at TIMESTAMP,
    expires_at TIMESTAMP,
    observations TEXT,
    status VARCHAR(20),
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE access_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    unit_assignments_id UUID REFERENCES unit_assignments(id),
    visitor_access_permits_id UUID REFERENCES visitor_access_permits(id),
    visitor_name VARCHAR(150),
    visitor_id_number VARCHAR(50),
    entry_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    exit_at TIMESTAMP,
    vehicle_plate VARCHAR(20),
    entry_observation TEXT,
    exit_observation TEXT,
    registered_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE packages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    unit_assignments_id UUID REFERENCES unit_assignments(id),
    courier_name VARCHAR(100),
    description TEXT,
    tracking_number VARCHAR(100),
    package_type VARCHAR(30),
    status VARCHAR(20),
    received_by UUID REFERENCES users(id),
    delivered_to_name VARCHAR(150),
    received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    delivered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE guard_shift_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    guard_assignments_id UUID REFERENCES guard_assignments(id),
    unit_assignments_id UUID REFERENCES unit_assignments(id),
    title VARCHAR(150),
    description TEXT,
    category VARCHAR(20),
    severity VARCHAR(20),
    location_detail VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE incident_photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    guard_shift_reports_id UUID REFERENCES guard_shift_reports(id),
    files_id UUID REFERENCES files(id),
    caption VARCHAR(255),
    is_evidence BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

--- 6. MÓDULO DE ÁREAS COMUNES (Amenities, Parqueaderos, Lockers) ---

CREATE TABLE common_areas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phs_id UUID REFERENCES phs(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL, -- Ej: 'Salón Social', 'Parqueadero V01'
    location_details TEXT,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    regulation TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Relación de fotos específicas para las áreas comunes
CREATE TABLE common_areas_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    common_areas_id UUID REFERENCES common_areas(id) ON DELETE CASCADE,
    files_id UUID REFERENCES files(id) ON DELETE CASCADE,
    display_order INTEGER DEFAULT 0,
    is_cover BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Asignación de una zona a un residente/unidad
CREATE TABLE common_area_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    common_areas_id UUID REFERENCES common_areas(id) ON DELETE CASCADE,
    unit_assignments_id UUID REFERENCES unit_assignments(id) ON DELETE CASCADE,
    start_date DATE,
    end_date DATE,
    status VARCHAR(20), -- Ej: 'ACTIVE', 'EXPIRED', 'CANCELLED'
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seguimiento técnico y actas de entrega/devolución
CREATE TABLE common_area_trackings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    common_area_assignments_id UUID REFERENCES common_area_assignments(id) ON DELETE CASCADE,
    tracking_status VARCHAR(30), -- Ej: 'PENDING_DELIVERY', 'IN_USE', 'RETURNED'
    inspection_details TEXT,
    inventory_check JSONB, -- Checkbox de inventario: {"keys": 2, "clean": true, "remote_control": 1}
    attachment_url VARCHAR(255), -- Link directo a acta firmada si aplica
    event_date TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Evidencia fotográfica de los trackings (daños, firmas, estado)
CREATE TABLE common_area_trackings_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    common_area_trackings_id UUID REFERENCES common_area_trackings(id) ON DELETE CASCADE,
    files_id UUID REFERENCES files(id) ON DELETE CASCADE,
    label VARCHAR(100), -- Ej: 'Foto Entrega', 'Firma'
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

--- 7. MÓDULO DE COMUNICACIONES Y NOTIFICACIONES ---

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    unit_assignments_id UUID REFERENCES unit_assignments(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50), -- Ej: 'CARTERA', 'ASAMBLEA', 'SEGURIDAD', 'DOMICILIO'
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notification_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    notification_id UUID REFERENCES notifications(id) ON DELETE CASCADE,
    file_id UUID REFERENCES files(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

--- 8. MÓDULO DE PQRS (Atención al Residente) ---

CREATE TABLE pqrs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    unit_assignments_id UUID REFERENCES unit_assignments(id) ON DELETE CASCADE,
    ticket_number VARCHAR(20) UNIQUE NOT NULL, -- Ej: PQRS-2025-001
    category VARCHAR(50), -- Ej: 'PETITION', 'COMPLAINT', 'CLAIM', 'SUGGESTION'
    priority VARCHAR(20), -- Ej: 'LOW', 'MEDIUM', 'HIGH'
    subject VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(30) DEFAULT 'OPEN', -- Ej: 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'
    files_id UUID REFERENCES files(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE pqrs_trackings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pqrs_id UUID REFERENCES pqrs(id) ON DELETE CASCADE,
    status_from VARCHAR(30),
    status_to VARCHAR(30),
    tracking_message TEXT,
    is_internal BOOLEAN DEFAULT false, -- Si es true, el residente no ve este comentario
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE pqrs_trackings_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pqrs_trackings_id UUID REFERENCES pqrs_trackings(id) ON DELETE CASCADE,
    files_id UUID REFERENCES files(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

--- 9. DOCUMENTACIÓN DIGITAL Y SOPORTES DE PAQUETES ---

CREATE TABLE digital_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phs_id UUID REFERENCES phs(id) ON DELETE CASCADE,
    files_id UUID REFERENCES files(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL, -- Ej: 'Reglamento de Propiedad Horizontal'
    category VARCHAR(50), -- Ej: 'FINANCIAL', 'LEGAL', 'CIRCULAR'
    description TEXT,
    version VARCHAR(10),
    is_public BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE packages_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    package_id UUID REFERENCES packages(id) ON DELETE CASCADE,
    file_id UUID REFERENCES files(id) ON DELETE CASCADE
);

--- 10. INTERACCIÓN EN ASAMBLEAS (Q&A) ---

CREATE TABLE qa_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assembly_attendances_id UUID REFERENCES assembly_attendances(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    is_moderated BOOLEAN DEFAULT false,
    status VARCHAR(20) DEFAULT 'PENDING', -- Ej: 'PENDING', 'APPROVED', 'ANSWERED', 'REJECTED'
    answer_text TEXT,
    answered_at TIMESTAMP,
    is_private BOOLEAN DEFAULT false, -- Si es true, solo el autor y el admin ven la respuesta
    upvotes INTEGER DEFAULT 0, -- Para priorizar preguntas populares
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

--- 11. ANUNCIOS DE ASAMBLEA (Sticky Notes / Broadcast) ---

CREATE TABLE assembly_announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assemblies_id UUID REFERENCES assemblies(id) ON DELETE CASCADE,
    title VARCHAR(100),
    message TEXT NOT NULL,
    type VARCHAR(30), -- Ej: 'INFO', 'WARNING', 'SUCCESS', 'URGENT'
    is_sticky BOOLEAN DEFAULT false, -- Para mensajes que deben quedar fijos en pantalla
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

--- 12. LOGS DE CITOFONÍA (Comunicación Portería-Residente) ---

CREATE TABLE virtual_citophony_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    unit_assignments_id UUID REFERENCES unit_assignments(id) ON DELETE CASCADE,
    guard_assignments_id UUID REFERENCES guard_assignments(id),
    type VARCHAR(20), -- Ej: 'VOICE_CALL', 'VIDEO_CALL', 'CHAT'
    status VARCHAR(20), -- Ej: 'ANSWERED', 'MISSED', 'REJECTED', 'BUSY'
    duration_seconds INTEGER DEFAULT 0,
    subject VARCHAR(100),
    observations TEXT,
    recording_file_id UUID REFERENCES files(id), -- Link a la grabación si aplica
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

--- 13. RELACIONES DE ARCHIVOS PARA SEGURIDAD Y LOGÍSTICA ---

-- Evidencias fotográficas para los reportes de los guardas
CREATE TABLE guard_report_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    guard_shift_reports_id UUID REFERENCES guard_shift_reports(id) ON DELETE CASCADE,
    files_id UUID REFERENCES files(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);