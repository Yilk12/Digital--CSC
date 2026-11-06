"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import FleetRequestForms from "@/app/components/fleet/fleet-request-forms"
import { getCurrentUserId } from "@/app/lib/auth"

interface Vehicle {
  id: string
  make: string
  model: string
  year: number
  licensePlate: string
  status: 'available' | 'assigned' | 'maintenance' | 'out_of_service'
  fuelType: string
  transmission: string
  mileage: number
  assignedTo?: string
  department?: string
  type?: string
  kmPerLiter?: number | null
}

interface Trip {
  id: string
  vehicleId: string
  driverId: string
  startLocation: string
  endLocation: string
  startTime: string
  endTime?: string
  purpose: string
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  mileageStart: number
  mileageEnd?: number
  fuelUsed?: number
  // Add these fields for completion functionality
  vehicle?: {
    id: string
    plate: string
    make: string
    model: string
    isCompleted?: boolean
  }
  isCompleted?: boolean

  // Additional optional fields for reporting/export
  startKm?: number | null
  kmDifference?: number | null
  returnKm?: number | null
  returnTime?: string | null
  passengerCount?: number | null

  // Vehicle efficiency (km per liter) for this trip
  kmPerLiter?: number | null

  // Optional display fields
  requesterName?: string
  requesterPhone?: string
  department?: any
}

export default function DriverPage() {
  const router = useRouter()
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [trips, setTrips] = useState<Trip[]>([])
  const [historyTrips, setHistoryTrips] = useState<Trip[]>([])
  const [historyTripsTotal, setHistoryTripsTotal] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'trips' | 'vehicle' | 'requests' | 'reports'>('trips')
  const [driverName, setDriverName] = useState('')
  const [driverId, setDriverId] = useState<string | null>(null)
  const [requestTab, setRequestTab] = useState<'issue' | 'fuel' | 'maintenance'>('issue')
  const [endingTripId, setEndingTripId] = useState<string | null>(null)
  const [metricsTripId, setMetricsTripId] = useState<string | null>(null)
  const [startOdometerKm, setStartOdometerKm] = useState<string>('')
  const [odometerKmDiff, setOdometerKmDiff] = useState<string>('')
  const [returnOdometerKm, setReturnOdometerKm] = useState<string>('')
  const [returnTime, setReturnTime] = useState<string>('')
  const [passengerCount, setPassengerCount] = useState<string>('')
  const [savingMetrics, setSavingMetrics] = useState(false)
  const [driverVehicle, setDriverVehicle] = useState<Vehicle | null>(null)
  const [tripsReportRange, setTripsReportRange] = useState<'all' | 'weekly' | 'monthly' | 'yearly'>('all')
  const [completedPage, setCompletedPage] = useState(1)
  const completedPageSize = 10

  const tabs: { id: 'trips' | 'vehicle' | 'requests' | 'reports'; label: string }[] = [
    { id: 'trips', label: 'Trip Management' },
    { id: 'vehicle', label: 'Vehicle Info' },
    { id: 'requests', label: 'Requests' },
    { id: 'reports', label: 'Reports' },
  ]

  useEffect(() => {
    // Initialize driver identity from auth helper
    const id = getCurrentUserId()
    if (id) {
      setDriverId(id)
      if (!driverName) setDriverName('')
    }
  }, [])

  useEffect(() => {
    if (!driverId) return
    loadDriverData()
  }, [driverId])

  useEffect(() => {
    if (!driverId || activeTab !== 'trips') return

    const intervalId = setInterval(() => {
      loadDriverData()
    }, 10000)

    return () => clearInterval(intervalId)
  }, [driverId, activeTab])

  const loadDriverData = async () => {
    try {
      setLoading(true)
      
      // Load vehicles
      const vehiclesRes = await fetch('/api/fleet/vehicles')
      const vehiclesData = await vehiclesRes.json()
      const vehiclesList: Vehicle[] = (vehiclesData.items || []) as Vehicle[]
      setVehicles(vehiclesList)
      
      // Try to load the current driver's assigned vehicle from backend
      const token =
        localStorage.getItem('accessToken') ||
        localStorage.getItem('jwt') ||
        localStorage.getItem('token') || ''

      const apiBase = process.env.NEXT_PUBLIC_API_URL

      if (apiBase) {
        try {
          const myVehicleRes = await fetch(`${apiBase}/api/fleet/my-vehicle`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          })

          const myVehicleData = await myVehicleRes.json().catch(() => ({}))
          const myVehicle = (myVehicleData as any)?.data ?? null
          if (myVehicle) {
            setDriverVehicle(myVehicle as Vehicle)
          } else {
            setDriverVehicle(null)
          }
        } catch (e) {
          console.warn('Failed to load my-vehicle info:', e)
          setDriverVehicle(null)
        }

        // Also load persisted trip history for this driver so that the
        // "የመስክ ታሪክ (Completed Trips)" table can display all historical
        // records instead of only the current trips array.
        try {
          const historyRes = await fetch(`${apiBase}/api/fleet/trip-history/driver/me`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          })

          const historyJson = await historyRes.json().catch(() => ({} as any))
          const rawItems: any[] = Array.isArray(historyJson?.data)
            ? historyJson.data
            : Array.isArray(historyJson)
              ? historyJson
              : []

          console.log('Driver trip-history raw response:', historyJson)
          console.log('Driver trip-history item count:', rawItems.length)
          const totalFromApi = typeof (historyJson as any)?.count === 'number' ? (historyJson as any).count : rawItems.length

          const mappedHistoryTrips: Trip[] = rawItems.map((h: any, index: number) => {
            // Build a Date for the trip start by combining date + startTime when possible
            let startDateTime: Date | null = null
            if (h.date) {
              const base = new Date(h.date as any)
              if (!isNaN(base.getTime())) {
                if (h.startTime) {
                  const timeStr = String(h.startTime)
                  const [hh, mm] = timeStr.split(':')
                  const hours = Number(hh)
                  const minutes = Number(mm)
                  if (!Number.isNaN(hours) && !Number.isNaN(minutes)) {
                    base.setHours(hours, minutes, 0, 0)
                  }
                }
                startDateTime = base
              }
            }

            let endDateTime: Date | null = null
            if (h.date && h.endTime) {
              const baseEnd = new Date(h.date as any)
              if (!isNaN(baseEnd.getTime())) {
                const timeStr = String(h.endTime)
                const [hh, mm] = timeStr.split(':')
                const hours = Number(hh)
                const minutes = Number(mm)
                if (!Number.isNaN(hours) && !Number.isNaN(minutes)) {
                  baseEnd.setHours(hours, minutes, 0, 0)
                }
                endDateTime = baseEnd
              }
            }

            const startTimeIso = startDateTime && !isNaN(startDateTime.getTime())
              ? startDateTime.toISOString()
              : ''
            const endTimeIso = endDateTime && !isNaN(endDateTime.getTime())
              ? endDateTime.toISOString()
              : undefined

            return {
              id: String(h.id ?? `hist-${index}`),
              vehicleId: String(h.vehicleId ?? ''),
              driverId: String(h.driverId ?? driverId ?? ''),
              startLocation: '',
              endLocation: h.destination ?? '-',
              startTime: startTimeIso,
              endTime: endTimeIso,
              purpose: h.purpose ?? '',
              status: 'completed',
              mileageStart: 0,
              mileageEnd: undefined,
              fuelUsed: undefined,
              startKm: (h as any).startOdometerKm ?? null,
              kmDifference: (h as any).odometerKmDiff ?? null,
              returnKm: (h as any).returnOdometerKm ?? null,
              returnTime: (h as any).returnTime ?? null,
              passengerCount: (h as any).passengerCount ?? null,
              kmPerLiter: (h as any).kmPerLiter ?? null,
              // Preserve requestor info for display
              requesterName: (h as any).requesterName,
              requesterPhone: (h as any).requesterPhone,
              // Basic vehicle display info (plate/make/model) from history
              vehicle: (h as any).vehicle
                ? {
                    id: String((h as any).vehicle.id ?? ''),
                    plate: String((h as any).vehicle.plate ?? ''),
                    make: String((h as any).vehicle.make ?? ''),
                    model: String((h as any).vehicle.model ?? ''),
                    isCompleted: true,
                  }
                : undefined,
              department: (h as any).department,
            } as any
          })

          console.log('Mapped driver trip-history trips count:', mappedHistoryTrips.length)
          setHistoryTrips(mappedHistoryTrips)
          setHistoryTripsTotal(totalFromApi)
        } catch (e) {
          console.error('Failed to load driver trip history:', e)
          setHistoryTrips([])
          setHistoryTripsTotal(null)
        }
      }
      
      // Load driver assigned field trips from the new API
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/fleet/field-management`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        },
      )

      const data = await res.json().catch(() => ({}))
      console.log('Field management API response:', data)
      
      if (!res.ok) {
        console.error('Failed to load driver field trips:', data)
        setTrips([])
      } else {
        // Handle the response format from the field management API
        const items = Array.isArray(data?.data) ? data.data : []

        // Helper function to parse date string (DD/MM/YYYY format from en-GB locale)
        const parseDateString = (dateStr: string): Date | null => {
          if (!dateStr || dateStr === 'N/A') return null;
          try {
            // Try parsing as ISO string first
            const isoDate = new Date(dateStr);
            if (!isNaN(isoDate.getTime())) return isoDate;
            
            // Try parsing DD/MM/YYYY format
            const parts = dateStr.split('/');
            if (parts.length === 3) {
              const day = parseInt(parts[0], 10);
              const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
              const year = parseInt(parts[2], 10);
              const parsed = new Date(year, month, day);
              if (!isNaN(parsed.getTime())) return parsed;
            }
            
            // Try parsing as regular date string
            const fallback = new Date(dateStr);
            if (!isNaN(fallback.getTime())) return fallback;
            
            return null;
          } catch {
            return null;
          }
        };

        // Helper function to validate a date
        const isValidDate = (date: Date | null | undefined): boolean => {
          return date instanceof Date && !isNaN(date.getTime());
        };

        // Helper function to combine date and time
        const combineDateAndTime = (date: Date | null, timeStr: string | null | undefined): Date | null => {
          if (!date || !isValidDate(date)) return null;
          if (!timeStr || timeStr === 'N/A') return date;
          
          try {
            // Parse time string (format: HH:MM or HH:MM:SS)
            const timeParts = timeStr.split(':');
            if (timeParts.length >= 2) {
              const hours = parseInt(timeParts[0], 10);
              const minutes = parseInt(timeParts[1], 10);
              if (!isNaN(hours) && !isNaN(minutes) && hours >= 0 && hours < 24 && minutes >= 0 && minutes < 60) {
                const combined = new Date(date);
                combined.setHours(hours, minutes, 0, 0);
                // Validate the combined date
                if (isValidDate(combined)) {
                  return combined;
                }
              }
            }
            // Return original date if it's valid, otherwise null
            return isValidDate(date) ? date : null;
          } catch {
            return isValidDate(date) ? date : null;
          }
        };

        // Map the API response to your Trip interface with safe date handling
        const mappedTrips: Trip[] = items
          .map((fieldTrip: any, index: number) => {
            try {
              // Parse the date from fieldDate (format: DD/MM/YYYY)
              const parsedDate = parseDateString(fieldTrip.fieldDate);
              // Ensure we have a valid base date
              let baseDate: Date = new Date(); // Default to current date
              if (parsedDate && isValidDate(parsedDate)) {
                baseDate = parsedDate;
              }
              
              // Combine date with startTime
              const startDateTime = combineDateAndTime(baseDate, fieldTrip.startTime);
              // Ensure startDateTime is valid, fallback to current date if invalid
              let validStartTime: Date = new Date();
              if (startDateTime && isValidDate(startDateTime)) {
                validStartTime = startDateTime;
              } else {
                console.warn('Invalid startDateTime for trip:', fieldTrip.id || fieldTrip.number, 'using current date');
              }
              
              // Handle endTime - prefer actualEndTime if available, otherwise parse endTime string
              let validEndTime: Date | undefined = undefined;
              if (fieldTrip.actualEndTime) {
                // actualEndTime is a DateTime from the database
                try {
                  const parsed = new Date(fieldTrip.actualEndTime);
                  if (isValidDate(parsed)) {
                    validEndTime = parsed;
                  }
                } catch {
                  // Ignore parsing errors
                }
              } else if (fieldTrip.endTime && fieldTrip.endTime !== 'N/A') {
                // Try to combine date with endTime string
                const combined = combineDateAndTime(baseDate, fieldTrip.endTime);
                if (combined && isValidDate(combined)) {
                  validEndTime = combined;
                }
              }

              // Find the corresponding vehicle to read kmPerLiter from registration
              const tripVehicle = vehiclesList.find(v => {
                return (
                  v.id === fieldTrip.vehicleId ||
                  v.licensePlate === fieldTrip.vehicle?.plate
                )
              })

              // Map status - handle all possible status values
              let tripStatus = 'scheduled'; // default
              const statusUpper = (fieldTrip.status || '').toUpperCase();
              if (statusUpper === 'ASSIGNED') {
                tripStatus = 'scheduled';
              } else if (statusUpper === 'IN_PROGRESS' || statusUpper === 'IN PROGRESS') {
                tripStatus = 'in_progress';
              } else if (statusUpper === 'COMPLETED' || statusUpper === 'DONE') {
                tripStatus = 'completed';
              } else if (statusUpper === 'CANCELLED' || statusUpper === 'CANCELED') {
                tripStatus = 'cancelled';
              }

              // Final safety check before calling toISOString()
              // Double-check that validStartTime is actually valid
              if (!isValidDate(validStartTime)) {
                console.error('validStartTime is still invalid, using current date:', validStartTime, fieldTrip);
                validStartTime = new Date();
              }

              // Final safety check for endTime
              if (validEndTime && !isValidDate(validEndTime)) {
                console.warn('validEndTime is invalid, setting to undefined:', validEndTime, fieldTrip);
                validEndTime = undefined;
              }

              // Safe conversion to ISO string with try-catch as final fallback
              let startTimeISO: string;
              let endTimeISO: string | undefined = undefined;
              
              try {
                startTimeISO = validStartTime.toISOString();
              } catch (e) {
                console.error('Failed to convert startTime to ISO, using current date:', e);
                startTimeISO = new Date().toISOString();
              }

              if (validEndTime) {
                try {
                  endTimeISO = validEndTime.toISOString();
                } catch (e) {
                  console.warn('Failed to convert endTime to ISO:', e);
                  endTimeISO = undefined;
                }
              }

              return {
                id: String(fieldTrip.id || fieldTrip.number || index),
                vehicleId: fieldTrip.vehicleId || '',
                driverId: driverId || '',
                startLocation: '',
                endLocation: fieldTrip.locationDestination || '-',
                startTime: startTimeISO,
                endTime: endTimeISO,
                purpose: fieldTrip.fieldPurpose || '',
                status: tripStatus,
                mileageStart: 0,
                mileageEnd: undefined,
                fuelUsed: undefined,
                // Additional fields from API for display
                requesterName: fieldTrip.requesterName,
                requesterPhone: fieldTrip.requesterPhone,
                vehicle: fieldTrip.vehicle,
                department: fieldTrip.department,
                isCompleted: fieldTrip.isCompleted || false,
                // Optional extended metrics (if backend provides them)
                startKm: (fieldTrip as any).startKm ?? null,
                kmDifference: (fieldTrip as any).kmDifference ?? null,
                returnKm: (fieldTrip as any).returnKm ?? null,
                returnTime: (fieldTrip as any).returnTime ?? null,
                passengerCount: (fieldTrip as any).passengerCount ?? null,
                // Prefer kmPerLiter from the matched vehicle registration; fall back to my-vehicle API or fieldTrip value
                kmPerLiter:
                  (tripVehicle as any)?.kmPerLiter ??
                  (driverVehicle as any)?.kmPerLiter ??
                  (fieldTrip as any).kmPerLiter ??
                  null,
              };
            } catch (error) {
              console.error('Error mapping trip:', fieldTrip, error);
              // Return null for failed mappings, we'll filter them out
              return null;
            }
          })
          .filter((trip: Trip | null): trip is Trip => trip !== null) // Remove any null entries from failed mappings

        console.log('Mapped trips:', mappedTrips);
        console.log('Total trips loaded:', mappedTrips.length);
        setTrips(mappedTrips)
      }
    } catch (error) {
      console.error('Error loading driver data:', error)
      setTrips([])
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'text-blue-600 bg-blue-100'
      case 'in_progress': return 'text-yellow-600 bg-yellow-100'
      case 'completed': return 'text-green-600 bg-green-100'
      case 'cancelled': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const exportTripsToPdf = () => {
    if (typeof window === 'undefined') return

    const rowsHtml = trips.map((trip, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${(trip as any).requesterName || ''}</td>
        <td>${trip.startLocation} → ${trip.endLocation}</td>
        <td>${trip.purpose || ''}</td>
        <td>${trip.startTime ? new Date(trip.startTime).toLocaleDateString('en-GB') : ''}</td>
        <td>${trip.startTime ? new Date(trip.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</td>
        <td>${trip.kmPerLiter ?? ''}</td>
        <td>${trip.status}</td>
        <td>${trip.startKm ?? ''}</td>
        <td>${trip.kmDifference ?? ''}</td>
        <td>${trip.returnKm ?? ''}</td>
        <td>${trip.returnTime ?? ''}</td>
        <td>${trip.passengerCount ?? ''}</td>
      </tr>
    `).join('')

    const html = `
      <html>
        <head>
          <meta charset="UTF-8" />
          <title>የመስክ አስተዳደር</title>
          <style>
            body { font-family: Arial, sans-serif; }
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #000; padding: 4px 6px; font-size: 11pt; }
            th { background: #f3f3f3; }
            h1 { font-size: 16pt; text-align: center; margin-bottom: 4px; }
            h2 { font-size: 14pt; text-align: center; margin-top: 0; margin-bottom: 12px; }
          </style>
        </head>
        <body>
          <h1>ሲቪል ሰርቪስ ኮሚሽን</h1>
          <h2>የመስክ አስተዳደር</h2>
          <table>
            <thead>
              <tr>
                <th>№</th>
                <th>የጠየቀው ስም</th>
                <th>የሚሄዱበት ስፍራ</th>
                <th>የመስኩ አላማ</th>
                <th>የመስክ ቀን</th>
                <th>የመጀመሪያ ሰዓት</th>
                <th>የተመለሰበት ሰዓት</th>
                <th>ተሽከርካሪዉ በሊትር የሚሸፍንበት ኪ.ሜ</th>
                <th>ሁኔታ</th>
                <th>የተነሳበት ኪ.ሜ</th>
                <th>የኪ.ሜ ልዩነት</th>
                <th>የተመለሰበት ኪ.ሜ</th>
                <th>የተመለሰበት ሰዓት</th>
                <th>የጫነዉ ሰዉ ብዛት</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml || '<tr><td colspan="8">ምንም የመስክ ጉዞዎች አልተገኙም</td></tr>'}
            </tbody>
          </table>
        </body>
      </html>
    `

    const win = window.open('', '_blank')
    if (!win) return
    win.document.open()
    win.document.write(html)
    win.document.close()
    win.focus()
    win.print()
  }

  const handleEndTrip = async (vehicleId: string) => {
    try {
      if (!vehicleId) {
        alert('No vehicle is associated with this trip yet.');
        return;
      }
      // disable button while request is running for this vehicle
      setEndingTripId(vehicleId);
      const token =
        localStorage.getItem('accessToken') ||
        localStorage.getItem('jwt') ||
        localStorage.getItem('token') || ''

      const apiBase = process.env.NEXT_PUBLIC_API_URL
      const url = `${apiBase}/api/fleet/vehicles/${encodeURIComponent(vehicleId)}/complete`

      const response = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!response.ok) {
        let message = "Failed to complete trip";
        try {
          const text = await response.text();
          if (text) {
            try {
              const json = JSON.parse(text);
              message = json.message || json.error || message;
            } catch {
              // Not JSON, maybe HTML error page
              message = text;
            }
          }
        } catch {
          // ignore, use default message
        }
        throw new Error(message);
      }

      // Success
      alert("Trip marked as completed!");
      // Refresh trips so completed time/endTime is visible in the table
      await loadDriverData();
    } catch (error: any) {
      console.error("Error completing trip:", error);
      alert(error.message || "Something went wrong");
    } finally {
      setEndingTripId(null); // re-enable the button
    }
  };

  // Find the most recent completed trip for the same vehicle and return its
  // returnKm value, so we can pre-fill the next trip's start odometer.
  const findPreviousReturnKmForTrip = (trip: Trip): number | null => {
    if (!trip) return null

    const currentVehicleId = trip.vehicleId || (trip.vehicle?.id ?? '')
    if (!currentVehicleId) return null

    let latestReturnKm: number | null = null
    let latestStartTimeMs = -Infinity

    historyTrips.forEach((h) => {
      if (!h) return
      const hvId = h.vehicleId || (h.vehicle?.id ?? '')
      if (!hvId || hvId !== currentVehicleId) return

      if (!h.startTime) return
      const t = new Date(h.startTime)
      const ms = t.getTime()
      if (Number.isNaN(ms)) return

      const currentTripTime = trip.startTime ? new Date(trip.startTime).getTime() : Infinity
      if (Number.isNaN(currentTripTime)) return

      // Only consider trips that happened before the current trip
      if (ms >= currentTripTime) return

      if (ms > latestStartTimeMs) {
        const rk = h.returnKm != null ? Number(h.returnKm) : NaN
        if (!Number.isNaN(rk)) {
          latestStartTimeMs = ms
          latestReturnKm = rk
        }
      }
    })

    return latestReturnKm
  }

  const openMetricsSheet = (trip: Trip) => {
    setMetricsTripId(trip.id)
    if (trip.startKm != null) {
      setStartOdometerKm(String(trip.startKm))
    } else {
      const prevReturn = findPreviousReturnKmForTrip(trip)
      setStartOdometerKm(prevReturn != null ? String(prevReturn) : '')
    }
    setOdometerKmDiff(trip.kmDifference != null ? String(trip.kmDifference) : '')
    setReturnOdometerKm(trip.returnKm != null ? String(trip.returnKm) : '')
    setReturnTime(trip.returnTime ?? '')
    setPassengerCount(trip.passengerCount != null ? String(trip.passengerCount) : '')
  }

  const closeMetricsSheet = () => {
    setMetricsTripId(null)
    setStartOdometerKm('')
    setOdometerKmDiff('')
    setReturnOdometerKm('')
    setReturnTime('')
    setPassengerCount('')
  }

  const handleSaveMetrics = async () => {
    if (!metricsTripId) return

    try {
      setSavingMetrics(true)

      const token =
        localStorage.getItem('accessToken') ||
        localStorage.getItem('jwt') ||
        localStorage.getItem('token') || ''

      const apiBase = process.env.NEXT_PUBLIC_API_URL
      const url = `${apiBase}/api/fleet/${encodeURIComponent(metricsTripId)}/update-metrics`

      const body = {
        startOdometerKm: startOdometerKm ? Number(startOdometerKm) : null,
        odometerKmDiff: odometerKmDiff ? Number(odometerKmDiff) : null,
        returnOdometerKm: returnOdometerKm ? Number(returnOdometerKm) : null,
        returnTime: returnTime || null,
        passengerCount: passengerCount ? Number(passengerCount) : null,
      }

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        let message = 'Failed to update trip metrics'
        try {
          const text = await response.text()
          if (text) {
            try {
              const json = JSON.parse(text)
              message = (json as any).message || (json as any).error || message
            } catch {
              message = text
            }
          }
        } catch {
          // ignore, use default message
        }
        throw new Error(message)
      }

      alert('Trip metrics updated successfully!')
      await loadDriverData()
      closeMetricsSheet()
    } catch (error: any) {
      console.error('Error updating trip metrics:', error)
      alert(error.message || 'Something went wrong')
    } finally {
      setSavingMetrics(false)
    }
  }

  const assignedVehicle = driverId ? vehicles.find(v => v.assignedTo === driverId) : undefined
  const activeTrip = trips.find(t => t.status === 'in_progress')

  // Completed trips source for the Reports tab.
  // If we have persisted trip history from the backend, use **all** of it so
  // the table shows the full history without filtering rows out.
  // Otherwise, fall back to the in-memory trips list.
  const completedTrips: Trip[] = historyTrips.length > 0
    ? [...historyTrips].sort((a, b) => {
        const da = a.startTime ? new Date(a.startTime).getTime() : 0
        const db = b.startTime ? new Date(b.startTime).getTime() : 0
        return db - da // newest first
      })
    : trips.filter(t => {
        const isStatusCompleted = t.status === 'completed' || t.isCompleted
        const hasReturnMetrics = t.returnKm != null || (t.returnTime != null && t.returnTime !== '')
        return isStatusCompleted || hasReturnMetrics
      })
  // All assigned trips for history (includes scheduled, in_progress, and completed)
  // Sort by startTime descending (newest first) for history
  const assignedTrips = trips
    .filter(t => t.status === 'scheduled' || t.status === 'in_progress' || t.status === 'completed')
    .sort((a, b) => {
      const dateA = new Date(a.startTime).getTime()
      const dateB = new Date(b.startTime).getTime()
      return dateB - dateA // Newest first
    })

  const getTripsReportRangeStart = (range: 'all' | 'weekly' | 'monthly' | 'yearly') => {
    const now = new Date()
    if (range === 'weekly') {
      const d = new Date(now)
      const day = d.getDay()
      const diff = day === 0 ? 6 : day - 1
      d.setHours(0, 0, 0, 0)
      d.setDate(d.getDate() - diff)
      return d
    }
    if (range === 'monthly') {
      return new Date(now.getFullYear(), now.getMonth(), 1)
    }
    if (range === 'yearly') {
      return new Date(now.getFullYear(), 0, 1)
    }
    return null
  }

  const getTripsReportRangeEnd = (range: 'all' | 'weekly' | 'monthly' | 'yearly') => {
    const now = new Date()
    if (range === 'weekly') {
      const start = getTripsReportRangeStart('weekly')
      if (!start) return null
      const end = new Date(start)
      end.setDate(end.getDate() + 6)
      end.setHours(23, 59, 59, 999)
      return end
    }
    if (range === 'monthly') {
      return new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
    }
    if (range === 'yearly') {
      return new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999)
    }
    return null
  }

  const filteredCompletedTrips = useMemo(() => {
    if (tripsReportRange === 'all') return completedTrips

    const start = getTripsReportRangeStart(tripsReportRange)
    const end = getTripsReportRangeEnd(tripsReportRange)
    if (!start || !end) return completedTrips

    return completedTrips.filter(trip => {
      if (!trip.startTime) return false
      const d = new Date(trip.startTime)
      if (isNaN(d.getTime())) return false
      return d >= start && d <= end
    })
  }, [completedTrips, tripsReportRange])

  const totalCompletedTrips = useMemo(() => {
    if (historyTripsTotal != null) return historyTripsTotal
    return completedTrips.length
  }, [historyTripsTotal, completedTrips])

  const totalCompletedPages = useMemo(() => {
    if (filteredCompletedTrips.length === 0) return 1
    return Math.ceil(filteredCompletedTrips.length / completedPageSize)
  }, [filteredCompletedTrips.length, completedPageSize])

  const paginatedCompletedTrips = useMemo(() => {
    const startIndex = (completedPage - 1) * completedPageSize
    const endIndex = startIndex + completedPageSize
    return filteredCompletedTrips.slice(startIndex, endIndex)
  }, [filteredCompletedTrips, completedPage, completedPageSize])

  useEffect(() => {
    setCompletedPage(1)
  }, [tripsReportRange, filteredCompletedTrips.length])

  const tripsReportRangeLabel = useMemo(() => {
    if (tripsReportRange === 'all') return ''
    const start = getTripsReportRangeStart(tripsReportRange)
    const end = getTripsReportRangeEnd(tripsReportRange)
    if (!start || !end) return ''

    const prefix =
      tripsReportRange === 'weekly'
        ? 'This week'
        : tripsReportRange === 'monthly'
          ? 'This month'
          : 'This year'

    const fmt = (d: Date) => d.toLocaleDateString('en-GB')
    return `${prefix}: ${fmt(start)} – ${fmt(end)}`
  }, [tripsReportRange])

  const formatReturnDateTimeFull = (trip: Trip) => {
    const time = trip.returnTime
    if (!time) return "-"

    // Use trip date from startTime as the base
    if (!trip.startTime) return time

    const base = new Date(trip.startTime)
    if (Number.isNaN(base.getTime())) return time

    // Build a full datetime string: YYYY-MM-DDTHH:MM:SS
    const datePart = base.toISOString().slice(0, 10) // e.g. 2025-12-11
    const dateTime = new Date(`${datePart}T${time.length === 5 ? time + ":00" : time}`)

    if (Number.isNaN(dateTime.getTime())) return time

    // Example output: "11/12/2025, 03:00:00"
    return dateTime.toLocaleString("en-GB", {
      hour12: false,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  }

  const exportCompletedTripsToPdf = () => {
    if (typeof window === 'undefined') return

    const rowsHtml = filteredCompletedTrips
      .map((trip, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${(trip as any).requesterName || driverName || ''}</td>
          <td>${trip.vehicle?.plate || ''}</td>
          <td>${trip.startLocation || ''} ${trip.endLocation || ''}</td>
          <td>${trip.purpose || ''}</td>
          <td>${trip.startTime ? new Date(trip.startTime).toLocaleDateString('en-GB') : ''}</td>
          <td>${trip.startTime ? new Date(trip.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</td>
          <td>${trip.kmPerLiter ?? ''}</td>
          <td>${trip.startKm ?? ''}</td>
          <td>${trip.kmDifference ?? ''}</td>
          <td>${trip.returnKm ?? ''}</td>
          <td>${formatReturnDateTimeFull(trip)}</td>
          <td>${trip.passengerCount ?? ''}</td>
        </tr>
      `)
      .join('')

    const html = `
      <html>
        <head>
          <meta charset="UTF-8" />
          <title>የመስክ ታሪክ (Completed Trips)</title>
          <style>
            body { font-family: Arial, sans-serif; }
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #000; padding: 4px 6px; font-size: 11pt; }
            th { background: #f3f3f3; }
            h1 { font-size: 16pt; text-align: center; margin-bottom: 4px; }
            h2 { font-size: 14pt; text-align: center; margin-top: 0; margin-bottom: 12px; }
          </style>
        </head>
        <body>
          <h1>ሲቪል ሰርቪስ ኮሚሽን</h1>
          <h2>የመስክ ታሪክ (Completed Trips)</h2>
          <table>
            <thead>
              <tr>
                <th>№</th>
                <th>የጠየቀው ስም</th>
                <th>ተሽከርካሪ</th>
                <th>የሚሄድበት ቦታ</th>
                <th>የመስኩ አላማ</th>
                <th>የመስክ ቀን</th>
                <th>የተነሳበት ሰዓት</th>
                <th>ተሽከርካሪዉ በሊትር የሚሸፍነዉ ኪሜ</th>
                <th>የተነሳበት ኪ.ሜ</th>
                <th>የኪ.ሜ ልዩነት</th>
                <th>የተመለሰበት ኪ.ሜ</th>
                <th>የተመለሰበት ሰዓት</th>
                <th>የጫነዉ ሰዉ ብዛት</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml || '<tr><td colspan="13">ምንም የተጠናቀቀ መስክ ጉዞዎች አልተገኙም</td></tr>'}
            </tbody>
          </table>
        </body>
      </html>
    `

    const win = window.open('', '_blank')
    if (!win) return
    win.document.open()
    win.document.write(html)
    win.document.close()
    win.focus()
    win.print()
  }

  const exportCompletedTripsToExcel = () => {
    if (typeof window === 'undefined') return
    if (!filteredCompletedTrips.length) return

    const header = [
      '№',
      'የጠየቀው ስም',
      'ተሽከርካሪ',
      'የሚሄድበት ቦታ',
      'የመስኩ አላማ',
      'የመስክ ቀን',
      'የተነሳበት ሰዓት',
      'ተሽከርካሪዉ በሊትር የሚሸፍነዉ ኪሜ',
      'የተነሳበት ኪ.ሜ',
      'የኪ.ሜ ልዩነት',
      'የተመለሰበት ኪ.ሜ',
      'የተመለሰበት ሰዓት',
      'የጫነዉ ሰዉ ብዛት',
    ]

    const escapeCsv = (value: any) => {
      const str = value == null ? '' : String(value)
      if (str.includes('"') || str.includes(',') || str.includes('\n')) {
        return '"' + str.replace(/"/g, '""') + '"'
      }
      return str
    }

    const rows = filteredCompletedTrips.map((trip, index) => [
      index + 1,
      (trip as any).requesterName || driverName || '',
      trip.vehicle?.plate || '',
      `${trip.startLocation || ''} ${trip.endLocation || ''}`.trim(),
      trip.purpose || '',
      trip.startTime ? new Date(trip.startTime).toLocaleDateString('en-GB') : '',
      trip.startTime
        ? new Date(trip.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : '',
      trip.kmPerLiter ?? '',
      trip.startKm ?? '',
      trip.kmDifference ?? '',
      trip.returnKm ?? '',
      formatReturnDateTimeFull(trip),
      trip.passengerCount ?? '',
    ])

    const csvContent = [header, ...rows]
      .map(row => row.map(escapeCsv).join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'completed-trips.csv'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const exportCompletedTripsToWord = () => {
    if (typeof window === 'undefined') return

    const rowsHtml = filteredCompletedTrips
      .map((trip, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${(trip as any).requesterName || driverName || ''}</td>
          <td>${trip.vehicle?.plate || ''}</td>
          <td>${trip.startLocation || ''} ${trip.endLocation || ''}</td>
          <td>${trip.purpose || ''}</td>
          <td>${trip.startTime ? new Date(trip.startTime).toLocaleDateString('en-GB') : ''}</td>
          <td>${trip.startTime ? new Date(trip.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</td>
          <td>${trip.kmPerLiter ?? ''}</td>
          <td>${trip.startKm ?? ''}</td>
          <td>${trip.kmDifference ?? ''}</td>
          <td>${trip.returnKm ?? ''}</td>
          <td>${trip.returnTime ?? ''}</td>
          <td>${trip.passengerCount ?? ''}</td>
        </tr>
      `)
      .join('')

    const html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="UTF-8" />
          <title>የመስክ ታሪክ (Completed Trips)</title>
          <style>
            body { font-family: Arial, sans-serif; }
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #000; padding: 4px 6px; font-size: 11pt; }
            th { background: #f3f3f3; }
            h1 { font-size: 16pt; text-align: center; margin-bottom: 4px; }
            h2 { font-size: 14pt; text-align: center; margin-top: 0; margin-bottom: 12px; }
          </style>
        </head>
        <body>
          <h1>ሲቪል ሰርቪስ ኮሚሽን</h1>
          <h2>የመስክ ታሪክ (Completed Trips)</h2>
          <table>
            <thead>
              <tr>
                <th>№</th>
                <th>የጠየቀው ስም</th>
                <th>ተሽከርካሪ</th>
                <th>የሚሄድበት ቦታ</th>
                <th>የመስኩ አላማ</th>
                <th>የመስክ ቀን</th>
                <th>የተነሳበት ሰዓት</th>
                <th>ተሽከርካሪዉ በሊትር የሚሸፍነዉ ኪሜ</th>
                <th>የተነሳበት ኪ.ሜ</th>
                <th>የኪ.ሜ ልዩነት</th>
                <th>የተመለሰበት ኪ.ሜ</th>
                <th>የተመለሰበት ሰዓት</th>
                <th>የጫነዉ ሰዉ ብዛት</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml || '<tr><td colspan="13">ምንም የተጠናቀቀ መስክ ጉዞዎች አልተገኙም</td></tr>'}
            </tbody>
          </table>
        </body>
      </html>
    `

    const blob = new Blob([html], { type: 'application/msword;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'completed-trips.doc'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading driver data...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Driver Dashboard</h1>
          </div>
          <Link 
            href="/fleet" 
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            ← ወደ ኋላ ተመለስ
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {assignedVehicle && (
          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l2.414 2.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1a1 1 0 001-1v-3a1 1 0 00-1-1H9a1 1 0 00-1 1v3z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">የተመደበ</p>
                <p className="text-lg font-semibold text-gray-900">
                  {`${assignedVehicle.make} ${assignedVehicle.model}`}
                </p>
              </div>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => setActiveTab('trips')}
          className="bg-white p-6 rounded-lg shadow border flex items-center w-full text-left hover:shadow-md transition-shadow"
        >
          <div className="p-2 bg-green-100 rounded-lg">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">የተጠናቀቀ መስክ</p>
            <p className="text-2xl font-semibold text-gray-900">{completedTrips.length}</p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('trips')}
          className="bg-white p-6 rounded-lg shadow border flex items-center w-full text-left hover:shadow-md transition-shadow cursor-pointer"
        >
          <div className="p-2 bg-yellow-100 rounded-lg">
            <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">መስክ ላይ</p>
            <p className="text-lg font-semibold text-gray-900">
              {activeTrip ? 'በመስክ ላይ' : 'የለም'}
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => router.push('/fleet/request')}
          className="bg-white p-6 rounded-lg shadow border flex items-center w-full text-left hover:shadow-md transition-shadow"
        >
          <div className="p-2 bg-blue-100 rounded-lg">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">የተሽከርካሪ መጠየቂያ ቅፅ</p>
            <p className="text-lg font-semibold text-gray-900"></p>
          </div>
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="mb-6">
        <nav className="flex space-x-8">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-4 rounded-md font-medium text-sm transition-colors bg-[#B0E0E6] ${
                activeTab === tab.id
                  ? 'text-blue-700 shadow-sm'
                  : 'text-gray-700 hover:text-blue-700 hover:shadow-sm'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Current Trip Status - only show on Trips tab */}
      {activeTab === 'trips' && activeTrip && (
        <div className="bg-white rounded-lg shadow border mb-6">
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-medium text-gray-900">መስክ ላይ</h3>
          </div>
          <div className="p-6">
            <div className="flex justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">የመስኩ ሁኔታ:</p>
                <p className="text-lg font-semibold text-gray-900">{activeTrip.status}</p>
              </div>
              <div className="text-right">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(activeTrip.status)}`}>
                  በመስክ ላይ
                </span>
                <div className="mt-2">
                  <button
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm disabled:bg-green-400"
                    onClick={() => handleEndTrip(activeTrip.id)}
                    disabled={endingTripId === activeTrip.id}
                  >
                    {endingTripId === activeTrip.id ? 'በማቅረብ ላይ...' : 'መስክ የሚጠናቀቀዉ'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content */}
      {activeTab === 'requests' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow border">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-medium text-gray-900">ጥያቄ</h3>
            </div>
            <div className="p-6">
              <FleetRequestForms
                initialTab={requestTab}
                key={requestTab}
                driverId={driverId}
                driverVehicleId={driverVehicle?.id ?? null}
              />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'trips' && (
        <>
          <div id="driver-trips-table" className="bg-white rounded-lg shadow border mb-6">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">የመስክ አስተዳደር</h3>
              <button
                type="button"
                onClick={exportTripsToPdf}
                disabled={trips.length === 0}
                className="inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Export to PDF
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full border text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="border px-3 py-2 text-center">№</th>
                    <th className="border px-3 py-2 text-left">የጠየቀው ስም</th>
                    <th className="border px-3 py-2 text-left">የሚሄድበት ቦታ</th>
                    <th className="border px-3 py-2 text-left">የመስኩ አላማ</th>
                    <th className="border px-3 py-2 text-left">የመስክ ቀን</th>
                    <th className="border px-3 py-2 text-left">የተነሳበት ሰዓት</th>
                    <th className="border px-3 py-2 text-left">ተሽከርካሪዉ በሊትር የሚሸፍነዉ ኪሜ</th>
                    <th className="border px-3 py-2 text-left">የተነሳበት ኪ.ሜ</th>
                    <th className="border px-3 py-2 text-left">የኪ.ሜ ልዩነት</th>
                    <th className="border px-3 py-2 text-left">የተመለሰበት ኪ.ሜ</th>
                    <th className="border px-3 py-2 text-left">የተመለሰበት ሰዓት</th>
                    <th className="border px-3 py-2 text-left">የጫነዉ ሰዉ ብዛት</th>
                    <th className="border px-3 py-2 text-left">ተግባር</th>
                  </tr>
                </thead>
                <tbody>
                  {trips.length === 0 ? (
                    <tr>
                      <td className="border px-3 py-4 text-center text-gray-500" colSpan={9}>
                        {loading ? 'በማቅረብ ላይ...' : 'ምንም የመስክ ጉዞዎች አልተገኙም'}
                      </td>
                    </tr>
                  ) : (
                    trips.map((trip, index) => (
                      <tr key={trip.id} className="hover:bg-gray-50">
                        <td className="border px-3 py-2 text-center align-top">{index + 1}</td>
                        <td className="border px-3 py-2 align-top">
                          {(trip as any).requesterName || driverName}
                          {(trip as any).requesterPhone && (
                            <div className="text-xs text-gray-500 mt-1">
                              📞 {(trip as any).requesterPhone}
                            </div>
                          )}
                        </td>
                        <td className="border px-3 py-2 align-top">{trip.startLocation}  {trip.endLocation}</td>
                        <td className="border px-3 py-2 align-top">{trip.purpose}</td>
                        <td className="border px-3 py-2 align-top">
                          {new Date(trip.startTime).toLocaleDateString('en-GB')}
                        </td>
                        <td className="border px-3 py-2 align-top">
                          {trip.startTime ? new Date(trip.startTime).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          }) : '-'}
                        </td>
                        <td className="border px-3 py-2 align-top text-right">
                          {trip.kmPerLiter ?? '-'}
                        </td>
                        <td className="border px-3 py-2 align-top text-right">
                          {trip.startKm ?? '-'}
                        </td>
                        <td className="border px-3 py-2 align-top text-right">
                          {trip.kmDifference ?? '-'}
                        </td>
                        <td className="border px-3 py-2 align-top text-right">
                          {trip.returnKm ?? '-'}
                        </td>
                        <td className="border px-3 py-2 align-top">
                          {formatReturnDateTimeFull(trip)}
                        </td>
                        <td className="border px-3 py-2 align-top text-right">
                          {trip.passengerCount ?? '-'}
                        </td>
                        <td className="border px-3 py-2 align-top">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(trip.status)}`}>
                            {trip.status === 'scheduled' ? 'የተመደበ' : 
                             trip.status === 'in_progress' ? 'በመስክ ላይ' : 
                             trip.status === 'completed' ? 'የተጠናቀቀ' : 
                             trip.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="border px-3 py-2 align-top whitespace-nowrap">
                            <button
                              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs"
                              onClick={() => openMetricsSheet(trip)}
                            >
                              ጨርስ
                            </button>
                    
                          {/* Show completed status for finished trips */}
                          {trip.status === 'completed' && (
                            <span className="text-green-600 font-medium text-xs">የተጠናቀቀ</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {assignedTrips.length > 0 && (
            <div className="bg-white rounded-lg shadow border">
              <div className="px-6 py-4 border-b">
                <h3 className="text-lg font-medium text-gray-900">የመስክ ታሪክ (History)</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full border text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="border px-3 py-2 text-center">№</th>
                      <th className="border px-3 py-2 text-left">የጠየቀው ስም</th>
                      <th className="border px-3 py-2 text-left">የሚሄድበት ቦታ</th>
                      <th className="border px-3 py-2 text-left">የመስኩ አላማ</th>
                      <th className="border px-3 py-2 text-left">የመስክ ቀን</th>
                      <th className="border px-3 py-2 text-left">የተነሳበት ሰዓት</th>
                    
                      <th className="border px-3 py-2 text-left">ሁኔታ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignedTrips.length === 0 ? (
                      <tr>
                        <td className="border px-3 py-4 text-center text-gray-500" colSpan={8}>
                          ምንም የመስክ ጉዞዎች አልተገኙም
                        </td>
                      </tr>
                    ) : (
                      assignedTrips.map((trip, index) => (
                      <tr key={trip.id} className="hover:bg-gray-50">
                        <td className="border px-3 py-2 text-center align-top">{index + 1}</td>
                        <td className="border px-3 py-2 align-top">
                          {(trip as any).requesterName || driverName}
                          {(trip as any).requesterPhone && (
                            <div className="text-xs text-gray-500 mt-1">
                              📞 {(trip as any).requesterPhone}
                            </div>
                          )}
                        </td>
                        <td className="border px-3 py-2 align-top">{trip.startLocation} → {trip.endLocation}</td>
                        <td className="border px-3 py-2 align-top">{trip.purpose}</td>
                        <td className="border px-3 py-2 align-top">
                          {new Date(trip.startTime).toLocaleDateString('en-GB')}
                        </td>
                        <td className="border px-3 py-2 align-top">
                          {trip.startTime ? new Date(trip.startTime).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          }) : '-'}
                        </td>
                        <td className="border px-3 py-2 align-top">
                          {trip.endTime ? new Date(trip.endTime).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          }) : '-'}
                        </td>
                        <td className="border px-3 py-2 align-top">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(trip.status)}`}>
                              {trip.status === 'scheduled' ? 'የተመደበ' : 
                               trip.status === 'in_progress' ? 'በመስክ ላይ' : 
                               trip.status === 'completed' ? 'የተጠናቀቀ' : 
                               trip.status.replace('_', ' ')}
                          </span>
                        </td>
                      </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {metricsTripId && (
            <div className="fixed inset-0 z-40 flex items-center justify-end bg-black bg-opacity-30">
              <div className="w-full max-w-md h-full bg-white shadow-xl flex flex-col">
                <div className="px-6 py-4 border-b flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">መስክ መጨረሻ መረጃ (Trip Metrics)</h3>
                  <button
                    type="button"
                    className="text-gray-500 hover:text-gray-700 text-sm"
                    onClick={closeMetricsSheet}
                    disabled={savingMetrics}
                  >
                    ✕
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">የተነሳበት ኪ.ሜ (startOdometerKm)</label>
                    <input
                      type="number"
                      className="w-full border rounded-md px-3 py-2 text-sm"
                      value={startOdometerKm}
                      onChange={e => setStartOdometerKm(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">የኪ.ሜ ልዩነት (odometerKmDiff)</label>
                    <input
                      type="number"
                      className="w-full border rounded-md px-3 py-2 text-sm"
                      value={odometerKmDiff}
                      onChange={e => setOdometerKmDiff(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">የተመለሰበት ኪ.ሜ (returnOdometerKm)</label>
                    <input
                      type="number"
                      className="w-full border rounded-md px-3 py-2 text-sm"
                      value={returnOdometerKm}
                      onChange={e => setReturnOdometerKm(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">የተመለሰበት ሰዓት (returnTime)</label>
                    <input
                      type="time"
                      className="w-full border rounded-md px-3 py-2 text-sm"
                      value={returnTime || ''}
                      onChange={e => setReturnTime(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">የጫነዉ ሰዉ ብዛት (passengerCount)</label>
                    <input
                      type="number"
                      className="w-full border rounded-md px-3 py-2 text-sm"
                      value={passengerCount}
                      onChange={e => setPassengerCount(e.target.value)}
                    />
                  </div>
                </div>
                <div className="px-6 py-4 border-t flex justify-end space-x-3">
                  <button
                    type="button"
                    className="px-4 py-2 text-sm rounded-md border border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
                    onClick={closeMetricsSheet}
                    disabled={savingMetrics}
                  >
                    ሰርዝ
                  </button>
                  <button
                    type="button"
                    className="px-4 py-2 text-sm rounded-md bg-green-600 text-white hover:bg-green-700 disabled:bg-green-400"
                    onClick={handleSaveMetrics}
                    disabled={savingMetrics}
                  >
                    {savingMetrics ? 'በማቅረብ ላይ...' : 'አስቀምጥ'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === 'vehicle' && (
        <div className="space-y-6">
          {assignedVehicle ? (
            <>
              <div className="bg-white rounded-lg shadow border">
                <div className="px-6 py-4 border-b">
                  <h3 className="text-lg font-medium text-gray-900">የተመደበዉ የመኪና ዝርዝር</h3>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-4">የመኪና ዝርዝር</h4>
                      <div className="space-y-3">
                        <div>
                          <span className="text-sm font-medium text-gray-600">Make & Model:</span>
                          <span className="ml-2 text-sm text-gray-900">{assignedVehicle.make} {assignedVehicle.model}</span>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-600">Year:</span>
                          <span className="ml-2 text-sm text-gray-900">{assignedVehicle.year}</span>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-600">License Plate:</span>
                          <span className="ml-2 text-sm text-gray-900">{assignedVehicle.licensePlate}</span>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-600">Fuel Type:</span>
                          <span className="ml-2 text-sm text-gray-900">{assignedVehicle.fuelType}</span>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-600">Transmission:</span>
                          <span className="ml-2 text-sm text-gray-900">{assignedVehicle.transmission}</span>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-600">Current Mileage:</span>
                          <span className="ml-2 text-sm text-gray-900">{assignedVehicle.mileage.toLocaleString()} km</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-4">Status & Actions</h4>
                      <div className="space-y-3">
                        <div>
                          <span className="text-sm font-medium text-gray-600">Status:</span>
                          <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(assignedVehicle.status)}`}>
                            {(assignedVehicle.status || 'unknown').replace('_', ' ')}
                          </span>
                        </div>
                        <div className="pt-4 space-y-2">
                          <button
                            className="w-full bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg text-sm"
                            onClick={() => { setRequestTab('maintenance'); setActiveTab('requests') }}
                          >
                            Request Maintenance
                          </button>
                          <button className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm">
                            Log Fuel Usage
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-lg shadow border">
              <div className="px-6 py-4 border-b">
                <h3 className="text-lg font-medium text-gray-900">የተመደበ መኪና የለም</h3>
              </div>
              <div className="p-6 text-center text-gray-500">
                ምንም የተመደበ መኪና አልተገኘም
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="bg-white rounded-lg shadow border">
          <div className="px-6 py-4 border-b flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3 flex-wrap">
              <h3 className="text-lg font-medium text-gray-900">የመስክ ታሪክ (Completed Trips)</h3>
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                ጠቅላላ መስኮች: {totalCompletedTrips}
              </span>
            </div>
            <div className="flex flex-col items-end gap-2 text-xs">
              {tripsReportRangeLabel && (
                <div className="text-xs text-gray-700 bg-blue-50 border border-blue-100 rounded px-2 py-1 inline-block">
                  {tripsReportRangeLabel}
                </div>
              )}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1">
                  <span className="text-gray-600">Quick report:</span>
                  <select
                    className="border rounded px-2 py-1 text-xs bg-white"
                    value={tripsReportRange}
                    onChange={e => setTripsReportRange(e.target.value as any)}
                  >
                    <option value="all">All</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-gray-600">Export:</span>
                  <select
                    className="border rounded px-2 py-1 text-xs bg-white disabled:opacity-60 disabled:cursor-not-allowed"
                    disabled={filteredCompletedTrips.length === 0}
                    defaultValue=""
                    onChange={e => {
                      const value = e.target.value
                      if (!value) return
                      if (value === 'word') {
                        exportCompletedTripsToWord()
                      } else if (value === 'excel') {
                        exportCompletedTripsToExcel()
                      } else if (value === 'pdf') {
                        exportCompletedTripsToPdf()
                      }
                      e.target.value = ''
                    }}
                  >
                    <option value="" disabled>Choose format</option>
                    <option value="word">Word</option>
                    <option value="excel">Excel</option>
                    <option value="pdf">PDF</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full border text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="border px-3 py-2 text-center">№</th>
                  <th className="border px-3 py-2 text-left">የጠየቀው ስም</th>
                  <th className="border px-3 py-2 text-left">ተሽከርካሪ</th>
                  <th className="border px-3 py-2 text-left">የሚሄድበት ቦታ</th>
                  <th className="border px-3 py-2 text-left">የመስኩ አላማ</th>
                  <th className="border px-3 py-2 text-left">የመስክ ቀን</th>
                  <th className="border px-3 py-2 text-left">የተነሳበት ሰዓት</th>
                  <th className="border px-3 py-2 text-left">ተሽከርካሪዉ በሊትር የሚሸፍነዉ ኪሜ</th>
                  <th className="border px-3 py-2 text-left">የተነሳበት ኪ.ሜ</th>
                  <th className="border px-3 py-2 text-left">የኪ.ሜ ልዩነት</th>
                  <th className="border px-3 py-2 text-left">የተመለሰበት ኪ.ሜ</th>
                  <th className="border px-3 py-2 text-left">የተመለሰበት ሰዓት</th>
                  <th className="border px-3 py-2 text-left">የጫነዉ ሰዉ ብዛት</th>
                </tr>
              </thead>
              <tbody>
                {filteredCompletedTrips.length === 0 ? (
                  <tr>
                    <td className="border px-3 py-4 text-center text-gray-500" colSpan={13}>
                      ምንም የተጠናቀቀ መስክ ጉዞዎች አልተገኙም
                    </td>
                  </tr>
                ) : (
                  paginatedCompletedTrips.map((trip, index) => (
                    <tr key={trip.id} className="hover:bg-gray-50">
                      <td className="border px-3 py-2 text-center align-top">{(completedPage - 1) * completedPageSize + index + 1}</td>
                      <td className="border px-3 py-2 align-top">
                        {(trip as any).requesterName || driverName}
                        {(trip as any).requesterPhone && (
                          <div className="text-xs text-gray-500 mt-1">
                            📞 {(trip as any).requesterPhone}
                          </div>
                        )}
                      </td>
                      <td className="border px-3 py-2 align-top">
                        {trip.vehicle?.plate || '-'}
                      </td>
                      <td className="border px-3 py-2 align-top">{trip.startLocation}  {trip.endLocation}</td>
                      <td className="border px-3 py-2 align-top">{trip.purpose}</td>
                      <td className="border px-3 py-2 align-top">
                        {trip.startTime ? new Date(trip.startTime).toLocaleDateString('en-GB') : '-'}
                      </td>
                      <td className="border px-3 py-2 align-top">
                        {trip.startTime
                          ? new Date(trip.startTime).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '-'}
                      </td>
                      <td className="border px-3 py-2 align-top text-right">
                        {trip.kmPerLiter ?? '-'}
                      </td>
                      <td className="border px-3 py-2 align-top text-right">
                        {trip.startKm ?? '-'}
                      </td>
                      <td className="border px-3 py-2 align-top text-right">
                        {trip.kmDifference ?? '-'}
                      </td>
                      <td className="border px-3 py-2 align-top text-right">
                        {trip.returnKm ?? '-'}
                      </td>
                      <td className="border px-3 py-2 align-top text-right">
                        {formatReturnDateTimeFull(trip)}
                      </td>
                      <td className="border px-3 py-2 align-top text-right">
                        {trip.passengerCount ?? '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            {filteredCompletedTrips.length > 0 && (
              <div className="flex items-center justify-between px-4 py-3 border-t text-xs text-gray-700">
                <div>
                  ከ {((completedPage - 1) * completedPageSize) + 1} እስከ{' '}
                  {Math.min(completedPage * completedPageSize, filteredCompletedTrips.length)}{' '}
                  ድረስ መስኮች ታይተዋል  /  ጠቅላላ መስኮች: {filteredCompletedTrips.length}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="px-2 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => setCompletedPage(p => Math.max(1, p - 1))}
                    disabled={completedPage <= 1}
                  >
                    የቀድሞው
                  </button>
                  <span>
                    ገፅ {completedPage} / {totalCompletedPages}
                  </span>
                  <button
                    type="button"
                    className="px-2 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => setCompletedPage(p => Math.min(totalCompletedPages, p + 1))}
                    disabled={completedPage >= totalCompletedPages}
                  >
                    የሚቀጥለው
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}