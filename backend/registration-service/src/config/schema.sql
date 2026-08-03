-- Registrations Table
CREATE TABLE IF NOT EXISTS registrations (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    event_id INT REFERENCES events(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'registered',
    registered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, event_id)
);

-- Transactional Outbox Table for Event-Driven Microservices communication
CREATE TABLE IF NOT EXISTS outbox (
    id SERIAL PRIMARY KEY,
    event_type VARCHAR(255) NOT NULL,
    payload JSONB NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_registrations_event_id ON registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_registrations_user_id ON registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_outbox_status ON outbox(status);
