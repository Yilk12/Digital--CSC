const assert = require('assert')

// Small replica of the filter logic used in app/fleet/maintenance/page.tsx
function getWorkflowStatus(workflow, requestId) {
  return (workflow && workflow[requestId] && workflow[requestId].status) || undefined
}

function filterRequests({ maintenanceRequests, vehicles, workflow, search = '', statusFilter = '', priorityFilter = '' }) {
  const filtered = maintenanceRequests
    .filter(r => !statusFilter || (getWorkflowStatus(workflow, r.id) || r.status) === statusFilter)
    .filter(r => !priorityFilter || r.priority === priorityFilter)
    .filter(r => {
      if (!search) return true
      const v = vehicles.find(x => x.id === r.vehicleId)
      const hay = `${(v && v.make) || ''} ${(v && v.model) || ''} ${(v && v.licensePlate) || ''} ${r.issueDescription || ''} ${r.requestedBy || ''}`.toLowerCase()
      return hay.includes(search.toLowerCase())
    })
  return filtered
}

// Mock data
const vehicles = [
  { id: '1', make: 'Toyota', model: 'Camry', licensePlate: 'ABC-123' },
  { id: '2', make: 'Honda', model: 'Civic', licensePlate: 'XYZ-789' },
]

const maintenanceRequests = [
  { id: 'a', vehicleId: '1', requestedBy: 'John', issueDescription: 'Oil change', priority: 'low', status: 'pending' },
  { id: 'b', vehicleId: '2', requestedBy: 'Mary', issueDescription: 'Brake pads', priority: 'high', status: 'in_progress' },
  { id: 'c', vehicleId: '1', requestedBy: 'Sam', issueDescription: 'AC not cooling', priority: 'urgent', status: 'completed' },
]

const workflow = {
  b: { status: 'in_progress' },
}

// Tests
;(function run() {
  // 1) No filters returns all
  let out = filterRequests({ maintenanceRequests, vehicles, workflow })
  assert.strictEqual(out.length, 3)

  // 2) Status filter
  out = filterRequests({ maintenanceRequests, vehicles, workflow, statusFilter: 'pending' })
  assert.strictEqual(out.length, 1)
  assert.strictEqual(out[0].id, 'a')

  // 3) Priority filter
  out = filterRequests({ maintenanceRequests, vehicles, workflow, priorityFilter: 'high' })
  assert.strictEqual(out.length, 1)
  assert.strictEqual(out[0].id, 'b')

  // 4) Search by vehicle make/model/plate and issue/requestedBy
  out = filterRequests({ maintenanceRequests, vehicles, workflow, search: 'toyota' })
  assert.strictEqual(out.length, 2)
  out = filterRequests({ maintenanceRequests, vehicles, workflow, search: 'Brake' })
  assert.strictEqual(out.length, 1)
  assert.strictEqual(out[0].id, 'b')
  out = filterRequests({ maintenanceRequests, vehicles, workflow, search: 'john' })
  assert.strictEqual(out.length, 1)
  assert.strictEqual(out[0].id, 'a')

  // 5) Combined filters
  out = filterRequests({ maintenanceRequests, vehicles, workflow, statusFilter: 'completed', priorityFilter: 'urgent' })
  assert.strictEqual(out.length, 1)
  assert.strictEqual(out[0].id, 'c')

  console.log('All filter logic tests passed.')
})()
