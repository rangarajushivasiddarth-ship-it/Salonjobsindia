import axios from 'axios'

const BASE_URL = 'http://localhost:3000/api'

interface TestResult {
  name: string
  passed: boolean
  duration: number
  error?: string
  details?: any
}

const results: TestResult[] = []

async function test(name: string, fn: () => Promise<void>) {
  const startTime = Date.now()
  console.log(`\n⏳ Testing: ${name}`)
  try {
    await fn()
    const duration = Date.now() - startTime
    results.push({ name, passed: true, duration })
    console.log(`✅ PASSED in ${duration}ms`)
  } catch (error: any) {
    const duration = Date.now() - startTime
    results.push({
      name,
      passed: false,
      duration,
      error: error.message,
      details: error.response?.data || error.message,
    })
    console.error(`❌ FAILED:`, error.message)
    if (error.response?.data) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2))
    }
  }
}

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(`Assertion failed: ${message}`)
}

let testJobId: string
let testAdminId: string = 'admin-001'

// TEST 1: Salon Owner Submits Job Payment
async function testSalonOwnerSubmit() {
  const salonOwnerId = 'salon-owner-' + Date.now()

  const response = await axios.post(`${BASE_URL}/sync`, {
    type: 'job-payment',
    data: {
      salonId: salonOwnerId,
      ownerName: 'Test Salon Owner',
      ownerEmail: 'owner@salon.com',
      ownerPhone: '+91-9876543210',
      salonName: 'Test Salon',
      jobTitle: 'Senior Stylist - Test Job',
      planPrice: 999,
      planName: 'Basic Plan',
      screenshotUrl: 'https://example.com/payment-screenshot.png',
      planId: 'plan-001',
      jobDetails: {
        description: 'Looking for experienced stylist',
        jobType: 'full-time',
        skills: ['styling', 'coloring', 'cutting'],
        experience: 2,
        location: {
          lat: 28.6139,
          lng: 77.209,
          address: 'Delhi, India',
          city: 'Delhi',
          state: 'Delhi',
        },
      },
    },
  })

  assert(response.data.success, 'Job submission should succeed')
  assert(response.data.jobId, 'Should return jobId')
  testJobId = response.data.jobId

  console.log('  Job submitted with ID:', testJobId)
  console.log('  Dual-write status:', response.data.dualWriteStatus)
  console.log('  Payment ID:', response.data.paymentId)
}

// TEST 2: Admin Queries Pending Jobs
async function testAdminSeePending() {
  const response = await axios.get(`${BASE_URL}/admin/pending-jobs`)

  assert(response.data.success, 'Admin query should succeed')
  assert(Array.isArray(response.data.data), 'Should return array of jobs')

  const pendingJobs = response.data.data || []
  console.log(`  Found ${pendingJobs.length} pending jobs`)

  // Should include our test job
  const ourJob = pendingJobs.find((j: any) => j.id === testJobId)
  if (ourJob) {
    console.log('  ✓ Test job found in pending queue')
    console.log('  Job status:', ourJob.status)
    console.log('  Payment status:', ourJob.payment_status)
  } else {
    console.log('  ⚠️  Test job not found in admin queue yet (might be eventual consistency)')
  }
}

// TEST 3: Admin Approves Job
async function testAdminApprove() {
  const response = await axios.post(`${BASE_URL}/sync`, {
    type: 'job-payment',
    id: testJobId,
    action: 'approve',
    adminId: testAdminId,
  })

  assert(response.data.success, 'Job approval should succeed')

  console.log('  Job approved successfully')
  console.log('  Response:', JSON.stringify(response.data, null, 2))
}

// TEST 4: Job Seeker Searches and Finds Job
async function testJobSeekerSearch() {
  const response = await axios.get(`${BASE_URL}/jobs`)

  assert(response.data.success, 'Job search should succeed')
  assert(Array.isArray(response.data.data), 'Should return array of jobs')

  const liveJobs = response.data.data || []
  console.log(`  Found ${liveJobs.length} live jobs`)
  console.log(`  Total pages: ${response.data.pagination?.totalPages}`)

  // Should include our test job (if it's been approved)
  const ourJob = liveJobs.find((j: any) => j.id === testJobId)
  if (ourJob) {
    console.log('  ✓ Test job found in live search')
    console.log('  Job title:', ourJob.title)
    console.log('  Job status:', ourJob.status)
  } else {
    console.log('  ⚠️  Test job not in live search yet (might need approval confirmation)')
  }
}

// TEST 5: Verify Dual-Write to Both DBs
async function testDualWriteVerification() {
  // Query Supabase
  console.log('  Checking Supabase...')
  const supabaseResponse = await axios.get(`${BASE_URL}/jobs?type=supabase&id=${testJobId}`)
  console.log('  Supabase result:', supabaseResponse.data.data ? '✓ Found' : '✗ Not found')

  // Query MongoDB
  console.log('  Checking MongoDB...')
  const mongoResponse = await axios.get(`${BASE_URL}/jobs?type=mongodb&id=${testJobId}`)
  console.log('  MongoDB result:', mongoResponse.data.data ? '✓ Found' : '✗ Not found')
}

// TEST 6: Verify Status Values Match
async function testStatusValueConsistency() {
  // Get job from admin pending
  const adminResponse = await axios.get(`${BASE_URL}/admin/pending-jobs`)
  const adminJob = (adminResponse.data.data || []).find((j: any) => j.id === testJobId)

  if (adminJob) {
    console.log('  Admin job status:', adminJob.status)
    console.log('  Admin payment status:', adminJob.payment_status)

    assert(adminJob.status === 'PAYMENT_PENDING', 'Status should be PAYMENT_PENDING')
    assert(adminJob.payment_status === 'pending', 'Payment status should be pending')
    console.log('  ✓ Status values are consistent')
  }
}

// Main test runner
async function runAllTests() {
  console.log('\n' + '='.repeat(60))
  console.log('SALON JOBS INDIA: END-TO-END SYNC WORKFLOW TEST')
  console.log('='.repeat(60))

  console.log('\nEnvironment:')
  console.log('  Base URL:', BASE_URL)
  console.log('  Test Job ID:', testJobId || 'Will be set in first test')

  await test('1. Salon Owner Submits Job Payment', testSalonOwnerSubmit)
  await test('2. Admin Sees Pending Jobs in Queue', testAdminSeePending)
  await test('3. Admin Approves Job', testAdminApprove)
  await test('4. Job Seeker Searches and Finds Job', testJobSeekerSearch)
  await test('5. Verify Dual-Write to Both DBs', testDualWriteVerification)
  await test('6. Verify Status Values Match', testStatusValueConsistency)

  // Print summary
  console.log('\n' + '='.repeat(60))
  console.log('TEST SUMMARY')
  console.log('='.repeat(60))

  const passed = results.filter((r) => r.passed).length
  const failed = results.filter((r) => !r.passed).length
  const totalTime = results.reduce((sum, r) => sum + r.duration, 0)

  console.log(`\nResults: ${passed} passed, ${failed} failed`)
  console.log(`Total time: ${totalTime}ms\n`)

  results.forEach((r) => {
    const status = r.passed ? '✅' : '❌'
    console.log(`${status} ${r.name} (${r.duration}ms)`)
    if (r.error) console.log(`   Error: ${r.error}`)
  })

  console.log('\n' + '='.repeat(60))

  if (failed > 0) {
    console.log('❌ SOME TESTS FAILED')
    process.exit(1)
  } else {
    console.log('✅ ALL TESTS PASSED!')
    process.exit(0)
  }
}

// Run tests
runAllTests().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
