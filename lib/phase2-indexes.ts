/**
 * Phase 2 Database Index Optimization Queries
 * These indexes are critical for performance when scaling to 500-5,000 users
 * Run this after deploying Phase 2
 */

export const PHASE_2_INDEX_QUERIES = [
  // Users table - additional indexes
  `CREATE INDEX IF NOT EXISTS idx_users_verified_role ON users(isVerified, role);`,
  `CREATE INDEX IF NOT EXISTS idx_users_location ON users(location);`,
  
  // Jobs table - performance indexes
  `CREATE INDEX IF NOT EXISTS idx_jobs_owner_status ON jobs(ownerId, status);`,
  `CREATE INDEX IF NOT EXISTS idx_jobs_location_status ON jobs(location, status, isActive);`,
  `CREATE INDEX IF NOT EXISTS idx_jobs_payment_status_owner ON jobs(paymentStatus, ownerId);`,
  
  // Applications table - query optimization
  `CREATE INDEX IF NOT EXISTS idx_applications_job_status ON applications(jobId, status);`,
  `CREATE INDEX IF NOT EXISTS idx_applications_seeker_status ON applications(seekerId, status);`,
  
  // Messages table - conversation queries
  `CREATE INDEX IF NOT EXISTS idx_messages_isread_recipient ON messages(isRead, recipientId);`,
  `CREATE INDEX IF NOT EXISTS idx_messages_sender_date ON messages(senderId, createdAt);`,
  
  // Subscriptions table - active subscriptions
  `CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status ON subscriptions(userId, status);`,
  `CREATE INDEX IF NOT EXISTS idx_subscriptions_expires ON subscriptions(expiresAt, status);`,
  
  // Notifications table - unread notifications
  `CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(userId, isRead);`,
  
  // Salon profiles table - search optimization
  `CREATE INDEX IF NOT EXISTS idx_salon_city_verified ON salon_profiles(city, isVerified);`,
  `CREATE INDEX IF NOT EXISTS idx_salon_rating ON salon_profiles(rating);`,
  
  // Payments table - transaction queries
  `CREATE INDEX IF NOT EXISTS idx_payments_user_date ON payments(userId, createdAt);`,
];

/**
 * Get Phase 2 index optimization SQL queries
 */
export function getPhase2IndexQueries(): string[] {
  return PHASE_2_INDEX_QUERIES;
}

/**
 * SQL to run indexes optimization
 * This analyzes tables after adding indexes
 */
export const TABLE_OPTIMIZATION_QUERIES = [
  `OPTIMIZE TABLE users;`,
  `OPTIMIZE TABLE jobs;`,
  `OPTIMIZE TABLE subscriptions;`,
  `OPTIMIZE TABLE messages;`,
  `OPTIMIZE TABLE applications;`,
  `OPTIMIZE TABLE notifications;`,
  `OPTIMIZE TABLE salon_profiles;`,
  `OPTIMIZE TABLE payments;`,
  `OPTIMIZE TABLE job_alerts;`,
  `OPTIMIZE TABLE audit_logs;`,
];

/**
 * Get table optimization queries
 */
export function getTableOptimizationQueries(): string[] {
  return TABLE_OPTIMIZATION_QUERIES;
}

/**
 * Check index effectiveness
 */
export const INDEX_STATS_QUERY = `
  SELECT 
    OBJECT_SCHEMA,
    OBJECT_NAME,
    INDEX_NAME,
    COUNT_READ,
    COUNT_WRITE,
    COUNT_DELETE,
    COUNT_INSERT,
    COUNT_UPDATE
  FROM performance_schema.table_io_waits_summary_by_index_usage
  WHERE OBJECT_SCHEMA != 'mysql'
  ORDER BY COUNT_READ DESC;
`;
