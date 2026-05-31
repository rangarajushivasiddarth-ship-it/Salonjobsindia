/**
 * MySQL Database Schema for Salon Jobs India
 * This file contains all SQL queries needed to create the database structure
 */

export const DATABASE_SCHEMA = {
  // Users table - stores both job seekers and salon owners
  users: `
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(36) PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      name VARCHAR(255),
      role ENUM('job_seeker', 'salon_owner', 'admin') NOT NULL,
      phone VARCHAR(20),
      profilePicture LONGTEXT,
      isVerified BOOLEAN DEFAULT FALSE,
      verificationDate TIMESTAMP NULL,
      location TEXT,
      bio TEXT,
      experience INT DEFAULT 0,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_email (email),
      INDEX idx_role (role),
      INDEX idx_createdAt (createdAt)
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  `,

  // Jobs/Postings table
  jobs: `
    CREATE TABLE IF NOT EXISTS jobs (
      id VARCHAR(36) PRIMARY KEY,
      ownerId VARCHAR(36) NOT NULL,
      title VARCHAR(255) NOT NULL,
      description LONGTEXT,
      salonName VARCHAR(255),
      location TEXT,
      salary VARCHAR(100),
      salaryRange TEXT,
      experience VARCHAR(100),
      jobType VARCHAR(50),
      skills TEXT,
      status ENUM('draft', 'posted', 'closed', 'archived') DEFAULT 'draft',
      isActive BOOLEAN DEFAULT TRUE,
      paymentStatus ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
      positionsFilled INT DEFAULT 0,
      positionsAvailable INT DEFAULT 1,
      applications INT DEFAULT 0,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (ownerId) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_ownerId (ownerId),
      INDEX idx_status (status),
      INDEX idx_paymentStatus (paymentStatus),
      INDEX idx_createdAt (createdAt),
      FULLTEXT INDEX ft_search (title, description, salonName)
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  `,

  // Subscriptions and payments
  subscriptions: `
    CREATE TABLE IF NOT EXISTS subscriptions (
      id VARCHAR(36) PRIMARY KEY,
      userId VARCHAR(36) NOT NULL,
      planId VARCHAR(100),
      status ENUM('pending', 'approved', 'rejected', 'expired', 'active', 'cancelled') DEFAULT 'pending',
      planType ENUM('job_seeker', 'salon_owner'),
      amount DECIMAL(10, 2),
      currency VARCHAR(3) DEFAULT 'INR',
      paymentMethod VARCHAR(100),
      transactionId VARCHAR(255),
      expiresAt TIMESTAMP NULL,
      autoRenew BOOLEAN DEFAULT FALSE,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      approvedAt TIMESTAMP NULL,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_userId (userId),
      INDEX idx_status (status),
      INDEX idx_expiresAt (expiresAt)
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  `,

  // Messages between users
  messages: `
    CREATE TABLE IF NOT EXISTS messages (
      id VARCHAR(36) PRIMARY KEY,
      senderId VARCHAR(36) NOT NULL,
      recipientId VARCHAR(36) NOT NULL,
      message LONGTEXT,
      messageType VARCHAR(50) DEFAULT 'text',
      isRead BOOLEAN DEFAULT FALSE,
      readAt TIMESTAMP NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (senderId) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (recipientId) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_senderId (senderId),
      INDEX idx_recipientId (recipientId),
      INDEX idx_createdAt (createdAt),
      INDEX idx_conversation (senderId, recipientId)
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  `,

  // Job applications
  applications: `
    CREATE TABLE IF NOT EXISTS applications (
      id VARCHAR(36) PRIMARY KEY,
      jobId VARCHAR(36) NOT NULL,
      seekerId VARCHAR(36) NOT NULL,
      salonId VARCHAR(36) NOT NULL,
      status ENUM('applied', 'reviewing', 'shortlisted', 'rejected', 'accepted', 'withdrawn') DEFAULT 'applied',
      resumeUrl TEXT,
      coverLetter LONGTEXT,
      rating INT,
      feedback TEXT,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (jobId) REFERENCES jobs(id) ON DELETE CASCADE,
      FOREIGN KEY (seekerId) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (salonId) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_jobId (jobId),
      INDEX idx_seekerId (seekerId),
      INDEX idx_salonId (salonId),
      INDEX idx_status (status),
      UNIQUE KEY unique_application (jobId, seekerId)
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  `,

  // Notifications
  notifications: `
    CREATE TABLE IF NOT EXISTS notifications (
      id VARCHAR(36) PRIMARY KEY,
      userId VARCHAR(36) NOT NULL,
      type VARCHAR(100),
      title VARCHAR(255),
      message TEXT,
      relatedId VARCHAR(36),
      isRead BOOLEAN DEFAULT FALSE,
      readAt TIMESTAMP NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_userId (userId),
      INDEX idx_isRead (isRead),
      INDEX idx_createdAt (createdAt)
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  `,

  // Salon profiles with additional details
  salon_profiles: `
    CREATE TABLE IF NOT EXISTS salon_profiles (
      id VARCHAR(36) PRIMARY KEY,
      ownerId VARCHAR(36) UNIQUE NOT NULL,
      salonName VARCHAR(255),
      description LONGTEXT,
      address TEXT,
      city VARCHAR(100),
      state VARCHAR(100),
      phoneNumber VARCHAR(20),
      whatsappNumber VARCHAR(20),
      email VARCHAR(255),
      website VARCHAR(255),
      logo LONGTEXT,
      coverImage LONGTEXT,
      rating DECIMAL(3, 2) DEFAULT 0,
      reviewCount INT DEFAULT 0,
      services TEXT,
      workingHours TEXT,
      isVerified BOOLEAN DEFAULT FALSE,
      verificationDate TIMESTAMP NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (ownerId) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_ownerId (ownerId),
      INDEX idx_city (city),
      INDEX idx_isVerified (isVerified)
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  `,

  // Payment records (audit trail)
  payments: `
    CREATE TABLE IF NOT EXISTS payments (
      id VARCHAR(36) PRIMARY KEY,
      userId VARCHAR(36) NOT NULL,
      subscriptionId VARCHAR(36),
      amount DECIMAL(10, 2),
      currency VARCHAR(3) DEFAULT 'INR',
      status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
      paymentMethod VARCHAR(100),
      transactionId VARCHAR(255),
      reference VARCHAR(255),
      description TEXT,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      completedAt TIMESTAMP NULL,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (subscriptionId) REFERENCES subscriptions(id) ON DELETE SET NULL,
      INDEX idx_userId (userId),
      INDEX idx_status (status),
      INDEX idx_transactionId (transactionId)
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  `,

  // Alerts and job preferences
  job_alerts: `
    CREATE TABLE IF NOT EXISTS job_alerts (
      id VARCHAR(36) PRIMARY KEY,
      userId VARCHAR(36) NOT NULL,
      searchQuery TEXT,
      location VARCHAR(255),
      jobType VARCHAR(100),
      salaryMin DECIMAL(10, 2),
      salaryMax DECIMAL(10, 2),
      isActive BOOLEAN DEFAULT TRUE,
      frequency VARCHAR(50) DEFAULT 'daily',
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      lastTriggeredAt TIMESTAMP NULL,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_userId (userId),
      INDEX idx_isActive (isActive)
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  `,

  // Admin actions and audit logs
  audit_logs: `
    CREATE TABLE IF NOT EXISTS audit_logs (
      id VARCHAR(36) PRIMARY KEY,
      adminId VARCHAR(36),
      action VARCHAR(255),
      targetType VARCHAR(100),
      targetId VARCHAR(36),
      oldValue LONGTEXT,
      newValue LONGTEXT,
      reason TEXT,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (adminId) REFERENCES users(id) ON DELETE SET NULL,
      INDEX idx_adminId (adminId),
      INDEX idx_targetId (targetId),
      INDEX idx_action (action),
      INDEX idx_createdAt (createdAt)
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  `,
};

/**
 * Get all schema creation queries as an array
 */
export function getSchemaQueries(): string[] {
  return Object.values(DATABASE_SCHEMA);
}

/**
 * Get schema query by table name
 */
export function getTableSchema(tableName: keyof typeof DATABASE_SCHEMA): string {
  return DATABASE_SCHEMA[tableName];
}
