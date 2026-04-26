-- Convert attendance times from text to timestamp
ALTER TABLE "AttendanceRecord"
  ALTER COLUMN "checkIn" TYPE TIMESTAMP(3) USING ("date" + ("checkIn" || ':00')::time),
  ALTER COLUMN "checkOut" TYPE TIMESTAMP(3) USING (
    CASE
      WHEN "checkOut" IS NULL THEN NULL
      ELSE "date" + ("checkOut" || ':00')::time
    END
  );

-- Add createdAt audit fields to key operational tables
ALTER TABLE "Invoice"
  ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "WorkoutPlan"
  ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "SessionLog"
  ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "Booking"
  ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
