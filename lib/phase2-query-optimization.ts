/**
 * Phase 2 Query Optimization Utilities
 * Optimized queries for handling 500-5,000 users
 */

/**
 * Get jobs with pagination - optimized for Phase 2
 */
export async function buildPaginatedJobsQuery(
  filters: {
    status?: string;
    location?: string;
    role?: string;
    salary?: string;
  } = {},
  page: number = 1,
  pageSize: number = 20
) {
  const offset = (page - 1) * pageSize;
  let where = '1=1';
  const params: any[] = [];

  if (filters.status) {
    where += ' AND status = ?';
    params.push(filters.status);
  }

  if (filters.location) {
    where += ' AND location LIKE ?';
    params.push(`%${filters.location}%`);
  }

  if (filters.role) {
    where += ' AND skills LIKE ?';
    params.push(`%${filters.role}%`);
  }

  // Get count for pagination
  const countQuery = `
    SELECT COUNT(*) as total 
    FROM jobs 
    WHERE ${where} AND isActive = TRUE
  `;

  // Get paginated results with index usage
  const dataQuery = `
    SELECT 
      id, ownerId, title, description, salonName, location, 
      salary, experience, jobType, skills, status, 
      positionsAvailable, applications, createdAt
    FROM jobs 
    WHERE ${where} AND isActive = TRUE
    ORDER BY createdAt DESC
    LIMIT ? OFFSET ?
  `;

  return {
    countQuery,
    dataQuery,
    params: [...params, pageSize, offset],
  };
}

/**
 * Get applications with pagination - optimized for Phase 2
 */
export async function buildPaginatedApplicationsQuery(
  jobId?: string,
  seekerId?: string,
  page: number = 1,
  pageSize: number = 20
) {
  const offset = (page - 1) * pageSize;
  let where = '1=1';
  const params: any[] = [];

  if (jobId) {
    where += ' AND jobId = ?';
    params.push(jobId);
  }

  if (seekerId) {
    where += ' AND seekerId = ?';
    params.push(seekerId);
  }

  const countQuery = `
    SELECT COUNT(*) as total 
    FROM applications 
    WHERE ${where}
  `;

  const dataQuery = `
    SELECT 
      id, jobId, seekerId, salonId, status, 
      resumeUrl, coverLetter, rating, feedback, createdAt
    FROM applications 
    WHERE ${where}
    ORDER BY createdAt DESC
    LIMIT ? OFFSET ?
  `;

  return {
    countQuery,
    dataQuery,
    params: [...params, pageSize, offset],
  };
}

/**
 * Get messages with pagination - optimized for Phase 2
 */
export async function buildPaginatedMessagesQuery(
  conversationWith: string,
  userId: string,
  page: number = 1,
  pageSize: number = 50
) {
  const offset = (page - 1) * pageSize;

  const countQuery = `
    SELECT COUNT(*) as total 
    FROM messages 
    WHERE 
      (senderId = ? AND recipientId = ?) OR
      (senderId = ? AND recipientId = ?)
  `;

  const dataQuery = `
    SELECT 
      id, senderId, recipientId, message, messageType, 
      isRead, readAt, createdAt
    FROM messages 
    WHERE 
      (senderId = ? AND recipientId = ?) OR
      (senderId = ? AND recipientId = ?)
    ORDER BY createdAt DESC
    LIMIT ? OFFSET ?
  `;

  return {
    countQuery,
    dataQuery,
    params: [
      userId,
      conversationWith,
      conversationWith,
      userId,
      userId,
      conversationWith,
      conversationWith,
      userId,
      pageSize,
      offset,
    ],
  };
}

/**
 * Search jobs efficiently - uses FULLTEXT index
 */
export async function buildSearchJobsQuery(searchTerm: string, page: number = 1, pageSize: number = 20) {
  const offset = (page - 1) * pageSize;

  const countQuery = `
    SELECT COUNT(*) as total 
    FROM jobs 
    WHERE MATCH(title, description, salonName) AGAINST(? IN BOOLEAN MODE)
    AND isActive = TRUE
  `;

  const dataQuery = `
    SELECT 
      id, ownerId, title, description, salonName, location, 
      salary, experience, jobType, skills, status,
      MATCH(title, description, salonName) AGAINST(? IN BOOLEAN MODE) as relevance
    FROM jobs 
    WHERE MATCH(title, description, salonName) AGAINST(? IN BOOLEAN MODE)
    AND isActive = TRUE
    ORDER BY relevance DESC, createdAt DESC
    LIMIT ? OFFSET ?
  `;

  return {
    countQuery,
    dataQuery,
    params: [searchTerm, searchTerm, searchTerm, pageSize, offset],
  };
}

/**
 * Get active subscriptions - uses expiration index
 */
export async function buildActiveSubscriptionsQuery() {
  return `
    SELECT 
      id, userId, planId, status, planType, amount, 
      expiresAt, createdAt
    FROM subscriptions 
    WHERE status = 'active'
    AND (expiresAt IS NULL OR expiresAt > NOW())
    ORDER BY userId
  `;
}

/**
 * Get unread notifications efficiently
 */
export async function buildUnreadNotificationsQuery(userId: string, limit: number = 50) {
  return {
    query: `
      SELECT 
        id, userId, type, title, message, relatedId, createdAt
      FROM notifications 
      WHERE userId = ? AND isRead = FALSE
      ORDER BY createdAt DESC
      LIMIT ?
    `,
    params: [userId, limit],
  };
}

/**
 * Batch operations optimization for Phase 2
 */
export async function buildBatchUserInsertQuery(users: any[]) {
  const placeholders = users.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())').join(',');
  const params = users.flatMap((u) => [
    u.id,
    u.email,
    u.password,
    u.name,
    u.role,
    u.phone || null,
    u.location || null,
    u.bio || null,
  ]);

  return {
    query: `
      INSERT INTO users 
      (id, email, password, name, role, phone, location, bio, createdAt, updatedAt)
      VALUES ${placeholders}
    `,
    params,
  };
}

/**
 * Calculate query performance metrics
 */
export const QUERY_OPTIMIZATION_TIPS = {
  useIndexes: 'Always use indexed columns in WHERE clauses',
  paginate: 'Use LIMIT and OFFSET for large result sets',
  projection: 'Select only needed columns, not SELECT *',
  joins: 'Minimize joins, use indexed foreign keys',
  aggregation: 'Push aggregation to database, not application',
  caching: 'Cache frequently accessed data at application level',
  batchOps: 'Batch inserts/updates for multiple records',
};
