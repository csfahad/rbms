import { Request, Response } from "express";
import { pool } from "../config/db";
import { z } from "zod";
import { generatePNR } from "../utils/booking";

const bookingSchema = z.object({
    userId: z.string().uuid(),
    trainId: z.string().uuid(),
    classType: z.string(),
    travelDate: z.string(),
    passengers: z.array(
        z.object({
            name: z.string(),
            age: z.number(),
            gender: z.string(),
        })
    ),
    // segment-based booking fields
    sourceStation: z.string().optional(),
    sourceCode: z.string().optional(),
    destinationStation: z.string().optional(),
    destinationCode: z.string().optional(),
    departureTime: z.string().optional(),
    arrivalTime: z.string().optional(),
    duration: z.string().optional(),
    distance: z.string().optional(),
});

export const createBooking = async (req: Request, res: Response) => {
    const client = await pool.connect();
    try {
        const bookingData = bookingSchema.parse(req.body);
        const pnr = generatePNR();
        await client.query("BEGIN");

        const { rows: classRows } = await client.query(
            `SELECT tc.*, t.name AS train_name, t.number AS train_number,
                    t.source, t.destination
             FROM train_classes tc
             JOIN trains t ON t.id = tc.train_id
             WHERE tc.train_id = $1 AND tc.class_type = $2`,
            [bookingData.trainId, bookingData.classType]
        );

        const trainClass = classRows[0];
        if (!trainClass) throw new Error("Train class not found");

        // check available seats dynamically like in searchTrains
        const { rows: availabilityRows } = await client.query(
            `
            SELECT tc.total_seats - COALESCE(
                (
                    SELECT COUNT(*)
                    FROM bookings b
                    LEFT JOIN passengers p ON p.booking_id = b.id
                    WHERE b.train_id = $1
                      AND b.travel_date = $2
                      AND b.class_type = $3
                      AND b.status = 'Confirmed'
                ), 0
            ) AS available_seats
            FROM train_classes tc
            WHERE tc.train_id = $1 AND tc.class_type = $3
            `,
            [bookingData.trainId, bookingData.travelDate, bookingData.classType]
        );

        const availableSeats = availabilityRows[0]?.available_seats;
        if (
            availableSeats === undefined ||
            availableSeats < bookingData.passengers.length
        ) {
            throw new Error("Not enough seats available");
        }

        const totalFare = trainClass.fare * bookingData.passengers.length;

        const { rows: bookingRows } = await client.query(
            `INSERT INTO bookings (
                user_id, train_id, pnr, class_type, travel_date,
                total_fare, status, source_station, source_code,
                destination_station, destination_code, departure_time,
                arrival_time, duration, distance
             ) VALUES ($1, $2, $3, $4, $5, $6, 'Confirmed', $7, $8, $9, $10, $11, $12, $13, $14)
             RETURNING *`,
            [
                bookingData.userId,
                bookingData.trainId,
                pnr,
                bookingData.classType,
                bookingData.travelDate,
                totalFare,
                bookingData.sourceStation || trainClass.source,
                bookingData.sourceCode || null,
                bookingData.destinationStation || trainClass.destination,
                bookingData.destinationCode || null,
                bookingData.departureTime || null,
                bookingData.arrivalTime || null,
                bookingData.duration || null,
                bookingData.distance || null,
            ]
        );

        const booking = bookingRows[0];

        for (const passenger of bookingData.passengers) {
            const seatNumber = await generateSeatNumber(
                client,
                bookingData.trainId,
                bookingData.classType,
                bookingData.travelDate
            );

            await client.query(
                `INSERT INTO passengers (
                    booking_id, name, age, gender, seat_number
                 ) VALUES ($1, $2, $3, $4, $5)`,
                [
                    booking.id,
                    passenger.name,
                    passenger.age,
                    passenger.gender,
                    seatNumber,
                ]
            );
        }

        await client.query("COMMIT");
        res.status(201).json(booking);
    } catch (error) {
        await client.query("ROLLBACK");
        console.error("Create booking error:", error);
        res.status(500).json({ message: "Failed to create booking" });
    } finally {
        client.release();
    }
};

export const getBookingById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const { rows } = await pool.query(
            `SELECT b.*, t.name as train_name, t.number as train_number,
                    COALESCE(b.source_station, t.source) as source,
                    COALESCE(b.destination_station, t.destination) as destination,
                    b.source_code, b.destination_code, b.departure_time, b.arrival_time,
                    b.duration, b.distance,
                    json_agg(
                        json_build_object(
                            'id', p.id,
                            'name', p.name,
                            'age', p.age,
                            'gender', p.gender,
                            'seatNumber', p.seat_number
                        )
                    ) as passengers
             FROM bookings b
             JOIN trains t ON t.id = b.train_id
             LEFT JOIN passengers p ON p.booking_id = b.id
             WHERE b.id = $1
             GROUP BY b.id, t.id`,
            [id]
        );

        const booking = rows[0];
        if (!booking)
            return res.status(404).json({ message: "Booking not found" });

        res.json(booking);
    } catch (error) {
        console.error("Get booking error:", error);
        res.status(500).json({ message: "Failed to fetch booking" });
    }
};

export const getUserBookings = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        const currentDate = new Date().toISOString().split("T")[0];

        const { rows } = await pool.query(
            `SELECT b.*, t.name as train_name, t.number as train_number,
                    COALESCE(b.source_station, t.source) as source,
                    COALESCE(b.destination_station, t.destination) as destination,
                    b.source_code, b.destination_code, b.departure_time, b.arrival_time,
                    b.duration, b.distance,
                    json_agg(
                        json_build_object(
                            'id', p.id,
                            'name', p.name,
                            'age', p.age,
                            'gender', p.gender,
                            'seatNumber', p.seat_number
                        )
                    ) as passengers
             FROM bookings b
             JOIN trains t ON t.id = b.train_id
             LEFT JOIN passengers p ON p.booking_id = b.id
             WHERE b.user_id = $1
             GROUP BY b.id, t.id
             ORDER BY b.travel_date DESC`,
            [userId]
        );

        const categorizedBookings = {
            upcoming: rows.filter(
                (b) => b.travel_date >= currentDate && b.status === "Confirmed"
            ),
            past: rows.filter(
                (b) => b.travel_date < currentDate && b.status === "Confirmed"
            ),
            cancelled: rows.filter((b) => b.status === "Cancelled"),
            all: rows,
        };

        res.json(categorizedBookings);
    } catch (error) {
        console.error("Get user bookings error:", error);
        res.status(500).json({ message: "Failed to fetch bookings" });
    }
};

export const getAllBookings = async (_req: Request, res: Response) => {
    try {
        const { rows } = await pool.query(
            `SELECT b.*, t.name as train_name, t.number as train_number,
                    t.source, t.destination,
                    json_agg(
                        json_build_object(
                            'id', p.id,
                            'name', p.name,
                            'age', p.age,
                            'gender', p.gender,
                            'seatNumber', p.seat_number
                        )
                    ) as passengers
             FROM bookings b
             JOIN trains t ON t.id = b.train_id
             LEFT JOIN passengers p ON p.booking_id = b.id
             GROUP BY b.id, t.id
             ORDER BY b.booking_date DESC`
        );

        res.json(rows);
    } catch (error) {
        console.error("Get all bookings error:", error);
        res.status(500).json({ message: "Failed to fetch bookings" });
    }
};

export const cancelBooking = async (req: Request, res: Response) => {
    const client = await pool.connect();

    try {
        const { id } = req.params;

        await client.query("BEGIN");

        // 1. Fetch booking
        const { rows: bookingRows } = await client.query(
            `SELECT * FROM bookings WHERE id = $1`,
            [id]
        );

        const booking = bookingRows[0];
        if (!booking) {
            await client.query("ROLLBACK");
            return res.status(404).json({ message: "Booking not found" });
        }

        if (booking.status === "Cancelled") {
            await client.query("ROLLBACK");
            return res
                .status(400)
                .json({ message: "Booking already cancelled" });
        }

        // 2. Count passengers in this booking
        const { rows: passengerRows } = await client.query(
            `SELECT COUNT(*) FROM passengers WHERE booking_id = $1`,
            [id]
        );
        const passengerCount = parseInt(passengerRows[0].count, 10);

        // 3. Cancel the booking
        const { rows: updatedRows } = await client.query(
            `UPDATE bookings SET status = 'Cancelled' WHERE id = $1 RETURNING *`,
            [id]
        );

        // 4. Increase available seats
        await client.query(
            `UPDATE train_classes
             SET available_seats = available_seats + $1
             WHERE train_id = $2 AND class_type = $3`,
            [passengerCount, booking.train_id, booking.class_type]
        );

        await client.query("COMMIT");

        res.json(updatedRows[0]);
    } catch (error) {
        await client.query("ROLLBACK");
        console.error("Cancel booking error:", error);
        res.status(500).json({ message: "Failed to cancel booking" });
    } finally {
        client.release();
    }
};

export const generateBookingReport = async (req: Request, res: Response) => {
    try {
        const { startDate, endDate, type } = req.query;

        let query = "";
        let values: any[] = [startDate, endDate];

        switch (type) {
            case "daily":
                query = `
                    SELECT DATE(booking_date) as date,
                           COUNT(*) as total_bookings,
                           SUM(total_fare) as total_revenue,
                           COUNT(CASE WHEN status = 'Cancelled' THEN 1 END) as cancellations
                    FROM bookings
                    WHERE booking_date BETWEEN $1 AND $2
                    GROUP BY DATE(booking_date)
                    ORDER BY date`;
                break;

            case "revenue":
                query = `
                    SELECT DATE_TRUNC('month', booking_date) as month,
                           SUM(total_fare) as revenue,
                           COUNT(*) as bookings,
                           ROUND(AVG(total_fare), 2) as avg_fare
                    FROM bookings
                    WHERE status = 'Confirmed'
                    AND booking_date BETWEEN $1 AND $2
                    GROUP BY month
                    ORDER BY month`;
                break;

            case "train-performance":
                query = `
                    SELECT t.name, t.number,
                           COUNT(*) as total_bookings,
                           SUM(total_fare) as revenue,
                           COUNT(CASE WHEN b.status = 'Cancelled' THEN 1 END) as cancellations
                    FROM bookings b
                    JOIN trains t ON t.id = b.train_id
                    WHERE b.booking_date BETWEEN $1 AND $2
                    GROUP BY t.id
                    ORDER BY total_bookings DESC`;
                break;

            default:
                return res.status(400).json({ message: "Invalid report type" });
        }

        const { rows } = await pool.query(query, values);
        res.json(rows);
    } catch (error) {
        console.error("Generate report error:", error);
        res.status(500).json({ message: "Failed to generate report" });
    }
};

// Refactored helper
async function generateSeatNumber(
    client: any,
    trainId: string,
    classType: string,
    travelDate: string
): Promise<string> {
    const { rows } = await client.query(
        `SELECT p.seat_number
         FROM passengers p
         JOIN bookings b ON b.id = p.booking_id
         WHERE b.train_id = $1
         AND b.class_type = $2
         AND b.travel_date = $3
         AND b.status = 'Confirmed'
         ORDER BY p.seat_number DESC
         LIMIT 1`,
        [trainId, classType, travelDate]
    );

    let seatNumber = 1;
    if (rows[0]) {
        seatNumber = parseInt(rows[0].seat_number.split("-")[1]) + 1;
    }

    return `${classType}-${seatNumber.toString().padStart(3, "0")}`;
}
