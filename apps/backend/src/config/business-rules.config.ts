/**
 * Business Rules Configuration
 * These are the default global rules. They can be overridden per city via the database.
 * NEVER hardcode business rules that should be configurable.
 */

export const businessRulesConfig = {
  // Inspection & Service Charges
  inspection: {
    defaultCharge: 50, // ₹ (INR)
    freeFor: [], // Array of service types that have free inspection
  },

  // Booking Cancellation
  cancellation: {
    beforeTechnicianAssigned: 0, // No charge
    afterTechnicianAssigned: 20, // 20% of estimated charge
    afterTechnicianArrived: 100, // Full charge
  },

  // Commissions (in percentage %)
  commissions: {
    admin: 15, // 15% admin commission
    technician: 80, // 80% technician gets (remainder to admin after costs)
    vendor: 85, // 85% vendor gets (15% to admin)
    delivery: {
      riderBase: 30, // ₹ base per delivery
      platformFee: 10, // ₹ platform fee
    },
  },

  // Wallet
  wallet: {
    minimumBalance: 500, // Minimum balance required to accept jobs
    settlementPeriod: 'daily', // 'daily' | 'weekly' | 'monthly'
    holdPeriod: 7, // Days to hold earnings before settlement
  },

  // Job Management
  jobs: {
    maxJobsPerTechnician: 8, // Max concurrent jobs
    jobAcceptanceTimeout: 30, // Seconds to accept/reject job
    autoAssignmentEnabled: true,
  },

  // Service Hours
  serviceHours: {
    start: '08:00', // 8 AM
    end: '22:00', // 10 PM
    emergencyHours: false,
  },
};
