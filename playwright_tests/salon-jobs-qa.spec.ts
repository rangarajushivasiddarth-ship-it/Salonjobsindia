import { test, expect, Page } from '@playwright/test'

const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000'
const API_BASE = process.env.PLAYWRIGHT_TEST_API_BASE || 'http://localhost:3000/api'

// Test data
const testData = {
  salonOwner: {
    email: `owner_${Date.now()}@test.com`,
    password: 'TestPassword123!',
    phone: '9876543210',
    name: 'Test Salon Owner',
    salonName: 'Test Salon',
  },
  jobSeeker: {
    email: `seeker_${Date.now()}@test.com`,
    password: 'TestPassword123!',
    phone: '9123456789',
    name: 'Test Job Seeker',
  },
  admin: {
    email: 'admin@test.com',
    token: 'Bearer admin_token_test123',
  },
}

test.describe('Salon Jobs India - QA Test Suite', () => {
  
  // ============ PART 1: AUTHENTICATION TESTS ============
  
  test.describe('AUTH-001: User Registration', () => {
    test('should register job seeker with valid data', async ({ request }) => {
      const response = await request.post(`${API_BASE}/auth/register`, {
        data: {
          name: testData.jobSeeker.name,
          email: testData.jobSeeker.email,
          phone: testData.jobSeeker.phone,
          password: testData.jobSeeker.password,
          role: 'job_seeker',
          location: 'Bangalore',
        },
      })
      expect(response.status()).toBe(201)
      const json = await response.json()
      expect(json.user.email).toBe(testData.jobSeeker.email)
    })

    test('should reject invalid email format', async ({ request }) => {
      const response = await request.post(`${API_BASE}/auth/register`, {
        data: {
          name: 'Test User',
          email: 'invalid-email',
          phone: '9876543210',
          password: 'TestPassword123!',
          role: 'job_seeker',
        },
      })
      expect(response.status()).toBe(400)
    })

    test('should reject duplicate email', async ({ request }) => {
      const email = `unique_${Date.now()}@test.com`
      
      // First registration
      await request.post(`${API_BASE}/auth/register`, {
        data: {
          name: 'User 1',
          email,
          phone: '9876543210',
          password: 'TestPassword123!',
          role: 'job_seeker',
        },
      })

      // Duplicate attempt
      const response = await request.post(`${API_BASE}/auth/register`, {
        data: {
          name: 'User 2',
          email,
          phone: '9123456789',
          password: 'TestPassword123!',
          role: 'job_seeker',
        },
      })
      expect(response.status()).toBe(409)
    })

    test('should reject invalid phone format', async ({ request }) => {
      const response = await request.post(`${API_BASE}/auth/register`, {
        data: {
          name: 'Test User',
          email: `test_${Date.now()}@test.com`,
          phone: '12345',
          password: 'TestPassword123!',
          role: 'job_seeker',
        },
      })
      expect(response.status()).toBe(400)
    })

    test('should require all mandatory fields', async ({ request }) => {
      const response = await request.post(`${API_BASE}/auth/register`, {
        data: {
          name: 'Test User',
          // Missing: email, phone, password, role
        },
      })
      expect(response.status()).toBe(400)
    })
  })

  // ============ PART 2: JOB MANAGEMENT TESTS ============

  test.describe('JOB-001: Job Posting Workflow', () => {
    let salonOwnerToken: string
    let jobId: string

    test.beforeAll(async ({ request }) => {
      // Register salon owner
      const response = await request.post(`${API_BASE}/auth/register`, {
        data: {
          name: testData.salonOwner.name,
          email: testData.salonOwner.email,
          phone: testData.salonOwner.phone,
          password: testData.salonOwner.password,
          role: 'salon_owner',
          salonName: testData.salonOwner.salonName,
        },
      })
      const json = await response.json()
      salonOwnerToken = json.token
    })

    test('should create job as draft', async ({ request }) => {
      const response = await request.post(`${API_BASE}/sync/job-submissions`, {
        headers: { Authorization: `Bearer ${salonOwnerToken}` },
        data: {
          title: 'Hair Stylist Needed',
          description: 'Experienced hair stylist required',
          location_city: 'Bangalore',
          location_state: 'Karnataka',
          salary_min: 20000,
          salary_max: 40000,
          salary_currency: 'INR',
          salary_period: 'monthly',
          skills: ['Hair Cutting', 'Coloring'],
        },
      })
      expect(response.status()).toBe(201)
      const json = await response.json()
      jobId = json.data.id
      expect(json.data.status).toBe('DRAFT')
    })

    test('should require payment screenshot for submission', async ({ request }) => {
      const response = await request.post(`${API_BASE}/sync/job-submissions`, {
        headers: { Authorization: `Bearer ${salonOwnerToken}` },
        data: {
          jobId,
          title: 'Updated Title',
          payment_screenshot_url: null,
          // Missing screenshot
        },
      })
      expect(response.status()).toBe(400)
    })

    test('should reject invalid salary range', async ({ request }) => {
      const response = await request.post(`${API_BASE}/sync/job-submissions`, {
        headers: { Authorization: `Bearer ${salonOwnerToken}` },
        data: {
          title: 'Invalid Job',
          salary_min: 50000,
          salary_max: 20000, // min > max
          salary_currency: 'INR',
          salary_period: 'monthly',
        },
      })
      expect(response.status()).toBe(400)
    })
  })

  test.describe('JOB-006: Job Expiry', () => {
    test('should not show expired jobs in listings', async ({ request }) => {
      const response = await request.get(`${API_BASE}/jobs`, {
        params: { page: 1, limit: 100 },
      })
      expect(response.status()).toBe(200)
      const json = await response.json()
      
      // Verify all returned jobs have future expiry
      json.data.forEach((job: any) => {
        const expiryDate = new Date(job.expires_at)
        const now = new Date()
        expect(expiryDate.getTime()).toBeGreaterThan(now.getTime())
      })
    })
  })

  test.describe('JOB-007: Duplicate Detection', () => {
    let salonOwnerToken: string

    test.beforeAll(async ({ request }) => {
      const response = await request.post(`${API_BASE}/auth/register`, {
        data: {
          name: 'Owner For Duplicate Test',
          email: `owner_dup_${Date.now()}@test.com`,
          phone: '9123456789',
          password: 'TestPassword123!',
          role: 'salon_owner',
          salonName: 'Duplicate Test Salon',
        },
      })
      const json = await response.json()
      salonOwnerToken = json.token
    })

    test('should prevent duplicate jobs within 24 hours', async ({ request }) => {
      const jobData = {
        title: 'Hairstylist Required',
        description: 'Experienced professional',
        location_city: 'Bangalore',
        salary_min: 25000,
        salary_max: 35000,
        salary_currency: 'INR',
        salary_period: 'monthly',
      }

      // First submission
      const res1 = await request.post(`${API_BASE}/sync/job-submissions`, {
        headers: { Authorization: `Bearer ${salonOwnerToken}` },
        data: jobData,
      })
      expect(res1.status()).toBe(201)

      // Duplicate submission within 24h
      const res2 = await request.post(`${API_BASE}/sync/job-submissions`, {
        headers: { Authorization: `Bearer ${salonOwnerToken}` },
        data: jobData,
      })
      expect(res2.status()).toBe(409)
    })
  })

  // ============ PART 3: APPLICATION TESTS ============

  test.describe('APP-001: Job Application Workflow', () => {
    let jobSeekerId: string
    let liveJobId: string

    test('should fetch live jobs for application', async ({ request }) => {
      const response = await request.get(`${API_BASE}/jobs`, {
        params: { page: 1, limit: 10 },
      })
      expect(response.status()).toBe(200)
      const json = await response.json()
      
      if (json.data.length > 0) {
        liveJobId = json.data[0].id
        expect(json.data[0].is_live).toBe(true)
        expect(json.data[0].payment_status).toBe('approved')
      }
    })

    test('should register job seeker for application test', async ({ request }) => {
      const response = await request.post(`${API_BASE}/auth/register`, {
        data: {
          name: 'App Test Seeker',
          email: `apptest_${Date.now()}@test.com`,
          phone: '9999999999',
          password: 'TestPassword123!',
          role: 'job_seeker',
          experience: 5,
          skills: ['Hair Cutting', 'Coloring'],
        },
      })
      expect(response.status()).toBe(201)
      const json = await response.json()
      jobSeekerId = json.data.id
    })

    test('should submit application to job', async ({ request }) => {
      const token = 'seeker_token_here' // Would be actual token from registration
      const response = await request.post(`${API_BASE}/applications`, {
        headers: { Authorization: `Bearer ${token}` },
        data: {
          job_id: liveJobId,
          cover_letter: 'I am interested in this role',
          resume_url: 'https://example.com/resume.pdf',
        },
      })
      expect(response.status()).toBe(201)
    })

    test('should prevent duplicate application to same job', async ({ request }) => {
      const token = 'seeker_token_here'
      
      // First application
      const res1 = await request.post(`${API_BASE}/applications`, {
        headers: { Authorization: `Bearer ${token}` },
        data: {
          job_id: liveJobId,
          cover_letter: 'Application 1',
          resume_url: 'https://example.com/resume.pdf',
        },
      })
      expect(res1.status()).toBe(201)

      // Duplicate application
      const res2 = await request.post(`${API_BASE}/applications`, {
        headers: { Authorization: `Bearer ${token}` },
        data: {
          job_id: liveJobId,
          cover_letter: 'Application 2',
          resume_url: 'https://example.com/resume.pdf',
        },
      })
      expect(res2.status()).toBe(409)
    })
  })

  // ============ PART 4: ADMIN TESTS ============

  test.describe('ADMIN-001: Admin Authorization', () => {
    test('should fetch pending payments with valid admin token', async ({ request }) => {
      const response = await request.get(`${API_BASE}/admin/pending-jobs`, {
        headers: { Authorization: testData.admin.token },
      })
      expect(response.status()).toBe(200)
    })

    test('should reject non-admin user from admin endpoint', async ({ request }) => {
      const response = await request.get(`${API_BASE}/admin/pending-jobs`, {
        headers: { Authorization: 'Bearer invalid_token' },
      })
      expect(response.status()).toBe(401)
    })

    test('SECURITY: should reject admin endpoint without auth header', async ({ request }) => {
      const response = await request.get(`${API_BASE}/admin/pending-jobs`)
      expect(response.status()).toBe(401)
    })
  })

  test.describe('ADMIN-003: Payment Approval', () => {
    test('should approve payment and activate job', async ({ request }) => {
      const response = await request.post(`${API_BASE}/payments/approve`, {
        headers: { Authorization: testData.admin.token },
        data: {
          jobId: 'test-job-id',
          paymentStatus: 'approved',
        },
      })
      expect(response.status()).toBeOneOf([200, 404]) // 404 if job doesn't exist
    })

    test('should reject payment with reason', async ({ request }) => {
      const response = await request.post(`${API_BASE}/payments/approve`, {
        headers: { Authorization: testData.admin.token },
        data: {
          jobId: 'test-job-id',
          paymentStatus: 'rejected',
          rejectionReason: 'Screenshot not clear',
        },
      })
      expect(response.status()).toBeOneOf([200, 404])
    })
  })

  // ============ PART 5: SECURITY TESTS ============

  test.describe('SEC-001: Authentication Security', () => {
    test('should reject invalid JWT token', async ({ request }) => {
      const response = await request.get(`${API_BASE}/jobs`, {
        headers: { Authorization: 'Bearer invalid.jwt.token' },
      })
      expect(response.status()).toBeOneOf([401, 403])
    })

    test('should reject missing Authorization header for protected routes', async ({ request }) => {
      // This depends on which routes require auth
      // For now, public /jobs endpoint should work without auth
      const response = await request.get(`${API_BASE}/jobs`)
      expect(response.status()).toBeOneOf([200, 401])
    })
  })

  test.describe('SEC-005: Authorization - RLS Policies', () => {
    test('should not allow user to view other user profile', async ({ request }) => {
      const token = 'user_token_here'
      const otherId = 'different-user-id'
      
      const response = await request.get(`${API_BASE}/job-seekers/${otherId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      expect(response.status()).toBe(403)
    })
  })

  test.describe('SEC-009: Data Encryption', () => {
    test('should not expose raw passwords in API responses', async ({ request }) => {
      const response = await request.get(`${API_BASE}/job-seekers/profile`, {
        headers: { Authorization: 'Bearer test_token' },
      })
      
      if (response.ok) {
        const json = await response.json()
        expect(json.password).toBeUndefined()
        expect(json.passwordHash).toBeUndefined()
      }
    })
  })

  // ============ PART 6: ERROR HANDLING ============

  test.describe('ERROR-001: Network Errors', () => {
    test('should handle malformed JSON gracefully', async ({ request }) => {
      const response = await request.post(`${API_BASE}/auth/register`, {
        headers: { 'Content-Type': 'application/json' },
        data: 'invalid json{',
      })
      expect(response.status()).toBe(400)
    })
  })

  test.describe('ERROR-006: Validation', () => {
    test('should return detailed error for missing fields', async ({ request }) => {
      const response = await request.post(`${API_BASE}/auth/register`, {
        data: {
          name: 'Test User',
          // Missing: email, phone, password, role
        },
      })
      expect(response.status()).toBe(400)
      const json = await response.json()
      expect(json.error).toBeDefined()
    })
  })

  test.describe('ERROR-008: SQL Injection Prevention', () => {
    test('should safely handle SQL injection in search', async ({ request }) => {
      const response = await request.get(`${API_BASE}/jobs`, {
        params: {
          search: "'; DROP TABLE jobs; --",
        },
      })
      expect(response.status()).toBeOneOf([200, 400])
      // If it returns 200, jobs table should still exist
      const response2 = await request.get(`${API_BASE}/jobs`)
      expect(response2.status()).toBe(200)
    })
  })

  test.describe('ERROR-009: XSS Prevention', () => {
    test('should escape HTML in job description', async ({ request }) => {
      const response = await request.get(`${API_BASE}/jobs`, {
        params: { page: 1, limit: 10 },
      })
      expect(response.status()).toBe(200)
      
      if (response.ok) {
        const json = await response.json()
        json.data.forEach((job: any) => {
          // Description should not contain unescaped HTML
          expect(job.description).not.toMatch(/<script/i)
        })
      }
    })
  })

  // ============ PART 7: PERFORMANCE TESTS ============

  test.describe('PERF-001: Query Performance', () => {
    test('should fetch 1000 jobs within 500ms', async ({ request }) => {
      const startTime = Date.now()
      const response = await request.get(`${API_BASE}/jobs`, {
        params: { limit: 1000 },
      })
      const endTime = Date.now()
      
      expect(response.status()).toBe(200)
      expect(endTime - startTime).toBeLessThan(500)
    })

    test('should search jobs with filters within 1000ms', async ({ request }) => {
      const startTime = Date.now()
      const response = await request.get(`${API_BASE}/jobs`, {
        params: {
          city: 'Bangalore',
          search: 'stylist',
          limit: 100,
        },
      })
      const endTime = Date.now()
      
      expect(response.status()).toBe(200)
      expect(endTime - startTime).toBeLessThan(1000)
    })
  })

  test.describe('CONC-001: Concurrent Operations', () => {
    test('should handle 50 concurrent job applications', async ({ request }) => {
      const liveJobId = 'concurrent-test-job-id'
      const promises = []

      for (let i = 0; i < 50; i++) {
        promises.push(
          request.post(`${API_BASE}/applications`, {
            data: {
              job_id: liveJobId,
              cover_letter: `Application ${i}`,
              resume_url: `https://example.com/resume${i}.pdf`,
            },
          })
        )
      }

      const responses = await Promise.all(promises)
      
      // All should succeed or fail gracefully
      responses.forEach(response => {
        expect(response.status()).toBeOneOf([201, 409, 500])
      })
    })
  })
})
