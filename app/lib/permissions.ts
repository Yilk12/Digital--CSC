export type PermissionActivity = {
  key: string
  label: string
}

export type PermissionModule = {
  key: string
  label: string
  activities: PermissionActivity[]
}

// Central permissions catalogue for all modules and activities
export const PERMISSION_MODULES: PermissionModule[] = [
  {
    key: "tickets",
    label: "Tickets",
    activities: [
      { key: "view", label: "View" },
      { key: "create", label: "Create" },
      { key: "assign", label: "Assign" },
      { key: "update", label: "Update" },
      { key: "delete", label: "Delete" },
    ],
  },
  {
    key: "knowledge_base",
    label: "Knowledge Base",
    activities: [
      { key: "view", label: "View" },
      { key: "create", label: "Create" },
      { key: "edit", label: "Edit" },
      { key: "publish", label: "Publish" },
      { key: "delete", label: "Delete" },
    ],
  },
  {
    key: "users",
    label: "Users",
    activities: [
      { key: "view", label: "View" },
      { key: "invite", label: "Invite" },
      { key: "update", label: "Update" },
      { key: "disable", label: "Disable" },
      { key: "delete", label: "Delete" },
    ],
  },
  {
    key: "fleet",
    label: "Fleet",
    activities: [
      { key: "view", label: "View" },
      { key: "vehicle_register", label: "Register Vehicle" },
      { key: "driver_register", label: "Register Driver" },
      { key: "assign_driver", label: "Assign Driver" },
      { key: "maintenance_request", label: "Maintenance Request" },
      { key: "maintenance_create", label: "Create Maintenance" },
      { key: "maintenance_update", label: "Update Maintenance" },
      { key: "maintenance_schedule", label: "Schedule Maintenance" },
      { key: "maintenance_inspect", label: "Record Inspection" },
      { key: "maintenance_report_export", label: "Export Maintenance/Cost Reports" },
      { key: "communicate", label: "Communicate with Teams" },
    ],
  },
  {
    key: "analytics",
    label: "Analytics",
    activities: [
      { key: "view", label: "View" },
      { key: "export", label: "Export" },
    ],
  },
  {
    key: "announcement",
    label: "Announcement",
    activities: [
      { key: "view", label: "View" },
      { key: "create", label: "Create" },
      { key: "publish", label: "Publish" },
      { key: "update", label: "Update" },
      { key: "delete", label: "Delete" },
    ],
  },
  {
    key: "voicebox",
    label: "Voicebox",
    activities: [
      { key: "view", label: "View" },
      { key: "create", label: "Create" },
      { key: "moderate", label: "Moderate" },
      { key: "update", label: "Update" },
      { key: "delete", label: "Delete" },
    ],
  },
]
