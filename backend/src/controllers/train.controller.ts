import { Request, Response } from "express";
import { pool } from "../config/db";
import { z } from "zod";

const trainSchema = z.object({
    number: z.string().min(1, "Train number is required"),
    name: z.string().min(1, "Train name is required"),
    source: z.string().min(1, "Source station is required"),
    sourceCode: z.string().min(1, "Source station code is required"),
    destination: z.string().min(1, "Destination station is required"),
    destinationCode: z.string().min(1, "Destination station code is required"),
    departureTime: z.string().min(1, "Departure time is required"),
    arrivalTime: z.string().min(1, "Arrival time is required"),
    duration: z.string().min(1, "Duration is required"),
    distance: z.string().min(1, "Distance is required"),
    runningDays: z
        .array(z.string())
        .min(1, "At least one running day is required"),
    classes: z
        .array(
            z.object({
                type: z.string(),
                totalSeats: z.number().min(1),
                fare: z.number().min(0),
            })
        )
        .min(1, "At least one class is required"),
});

export const getAllTrains = async (req: Request, res: Response) => {
    try {
        const result = await pool.query(`
      SELECT
        t.id,
        t.name,
        t.number,
        t.source,
        t.destination,
        t.departure_time,
        t.arrival_time,
        t.running_days,
        json_agg(tc.class_type ORDER BY tc.class_type) AS classes
      FROM trains t
      LEFT JOIN train_classes tc ON t.id = tc.train_id
      GROUP BY t.id
      ORDER BY t.id;
    `);

        res.status(200).json(result.rows);
    } catch (error) {
        console.error("Error fetching trains:", error);
        res.status(500).json({ message: "Failed to fetch trains" });
    }
};

export const createTrain = async (req: Request, res: Response) => {
    const client = await pool.connect();
    try {
        const trainData = trainSchema.parse(req.body);

        await client.query("BEGIN");

        const insertTrainQuery = `
            INSERT INTO trains (
                number, name, source, source_code, 
                destination, destination_code, departure_time, 
                arrival_time, duration, distance, running_days
            )
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
            RETURNING *
        `;

        const trainResult = await client.query(insertTrainQuery, [
            trainData.number,
            trainData.name,
            trainData.source,
            trainData.sourceCode,
            trainData.destination,
            trainData.destinationCode,
            trainData.departureTime,
            trainData.arrivalTime,
            trainData.duration,
            trainData.distance,
            trainData.runningDays,
        ]);

        const train = trainResult.rows[0];

        const insertClassQuery = `
            INSERT INTO train_classes (train_id, class_type, total_seats, fare)
            VALUES ($1, $2, $3, $4)
        `;

        for (const classData of trainData.classes) {
            await client.query(insertClassQuery, [
                train.id,
                classData.type,
                classData.totalSeats,
                classData.fare,
            ]);
        }

        await client.query("COMMIT");
        res.status(201).json(train);
    } catch (error) {
        await client.query("ROLLBACK");
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: error.errors[0].message });
        }
        console.error("Create train error:", error);
        res.status(500).json({ message: "Internal server error" });
    } finally {
        client.release();
    }
};

export const updateTrain = async (req: Request, res: Response) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        const trainData = trainSchema.parse(req.body);

        await client.query("BEGIN");

        const updateTrainQuery = `
            UPDATE trains
            SET number = $1, name = $2, source = $3, source_code = $4,
                destination = $5, destination_code = $6,
                departure_time = $7, arrival_time = $8,
                duration = $9, distance = $10, running_days = $11
            WHERE id = $12
            RETURNING *
        `;

        const trainResult = await client.query(updateTrainQuery, [
            trainData.number,
            trainData.name,
            trainData.source,
            trainData.sourceCode,
            trainData.destination,
            trainData.destinationCode,
            trainData.departureTime,
            trainData.arrivalTime,
            trainData.duration,
            trainData.distance,
            trainData.runningDays,
            id,
        ]);

        const train = trainResult.rows[0];

        await client.query(`DELETE FROM train_classes WHERE train_id = $1`, [
            id,
        ]);

        const insertClassQuery = `
            INSERT INTO train_classes (train_id, class_type, total_seats, fare)
            VALUES ($1, $2, $3, $4)
        `;

        for (const classData of trainData.classes) {
            await client.query(insertClassQuery, [
                train.id,
                classData.type,
                classData.totalSeats,
                classData.fare,
            ]);
        }

        await client.query("COMMIT");
        res.json(train);
    } catch (error) {
        await client.query("ROLLBACK");
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: error.errors[0].message });
        }
        console.error("Update train error:", error);
        res.status(500).json({ message: "Internal server error" });
    } finally {
        client.release();
    }
};

export const deleteTrain = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await pool.query(`DELETE FROM trains WHERE id = $1`, [id]);
        res.json({ message: "Train deleted successfully" });
    } catch (error) {
        console.error("Delete train error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getTrainById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `
            SELECT t.*, 
                json_agg(
                    json_build_object(
                        'type', tc.class_type,
                        'totalSeats', tc.total_seats,
                        'fare', tc.fare
                    )
                ) AS classes
            FROM trains t
            LEFT JOIN train_classes tc ON t.id = tc.train_id
            WHERE t.id = $1
            GROUP BY t.id
        `,
            [id]
        );

        const train = result.rows[0];
        if (!train) {
            return res.status(404).json({ message: "Train not found" });
        }

        res.json(train);
    } catch (error) {
        console.error("Get train error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const searchTrains = async (req: Request, res: Response) => {
    try {
        const { source, destination, date } = req.query;

        if (!source || !destination || !date) {
            return res
                .status(400)
                .json({ message: "Missing required parameters" });
        }

        // Determine the day of the week from the date
        const dayOfWeek = new Date(date as string).toLocaleDateString("en-US", {
            weekday: "short", // returns 'Mon', 'Tue', etc.
        });

        // Query trains that match source, destination, and run on the given day
        const result = await pool.query(
            `
            SELECT t.*,
                   json_agg(
                       json_build_object(
                           'type', tc.class_type,
                           'totalSeats', tc.total_seats,
                           'fare', tc.fare,
                           'availableSeats', tc.total_seats - COALESCE(
                               (SELECT COUNT(*)
                                FROM bookings b
								LEFT JOIN passengers p ON p.booking_id = b.id
                                WHERE b.train_id = t.id
                                  AND b.travel_date = $3
                                  AND b.class_type = tc.class_type
                                  AND b.status = 'Confirmed'), 0
                           )
                       )
                   ) as availability
            FROM trains t
            LEFT JOIN train_classes tc ON t.id = tc.train_id
            WHERE t.source_code ILIKE $1
              AND t.destination_code ILIKE $2
              AND $4 = ANY(t.running_days)
            GROUP BY t.id
            `,
            [source, destination, date, dayOfWeek]
        );

        res.json(result.rows);
    } catch (error) {
        console.error("Search trains error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getStations = async (req: Request, res: Response) => {
    try {
        const { query } = req.query;

        if (!query || typeof query !== "string") {
            return res
                .status(400)
                .json({ message: "Query parameter is required" });
        }

        const result = await pool.query(
            `
            SELECT DISTINCT code, name FROM (
                SELECT source_code AS code, source AS name FROM trains
                UNION
                SELECT destination_code AS code, destination AS name FROM trains
            ) AS stations
            WHERE name ILIKE $1 OR code ILIKE $1
            ORDER BY name
            LIMIT 10
            `,
            [`%${query}%`]
        );

        res.json(result.rows);
    } catch (error) {
        console.error("Station suggestion error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
