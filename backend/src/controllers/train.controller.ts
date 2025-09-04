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
    stoppages: z
        .array(
            z.object({
                stationName: z.string().min(1, "Station name is required"),
                stationCode: z.string().min(1, "Station code is required"),
                arrivalTime: z.string().optional(),
                departureTime: z.string().optional(),
                stopNumber: z.number().min(1),
                platformNumber: z.string().optional(),
                haltDuration: z.number().min(0).default(0),
                distanceFromSource: z.number().min(0).default(0),
            })
        )
        .optional()
        .default([]),
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
        COALESCE(
            (SELECT json_agg(
                json_build_object(
                    'type', tc.class_type,
                    'totalSeats', tc.total_seats,
                    'fare', tc.fare
                ) ORDER BY tc.class_type
            )
            FROM train_classes tc 
            WHERE tc.train_id = t.id), '[]'::json
        ) AS classes,
        COALESCE(
            (SELECT json_agg(
                json_build_object(
                    'id', ts.id,
                    'stationName', ts.station_name,
                    'stationCode', ts.station_code,
                    'arrivalTime', ts.arrival_time,
                    'departureTime', ts.departure_time,
                    'stopNumber', ts.stop_number,
                    'platformNumber', ts.platform_number,
                    'haltDuration', ts.halt_duration_minutes,
                    'distanceFromSource', ts.distance_from_source
                ) ORDER BY ts.stop_number
            )
            FROM train_stoppages ts 
            WHERE ts.train_id = t.id), '[]'::json
        ) AS stoppages
      FROM trains t
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

        // insert train stoppages if provided
        if (trainData.stoppages && trainData.stoppages.length > 0) {
            const insertStoppageQuery = `
                INSERT INTO train_stoppages (
                    train_id, station_name, station_code, arrival_time,
                    departure_time, stop_number, platform_number,
                    halt_duration_minutes, distance_from_source
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            `;

            for (const stoppage of trainData.stoppages) {
                await client.query(insertStoppageQuery, [
                    train.id,
                    stoppage.stationName,
                    stoppage.stationCode,
                    stoppage.arrivalTime || null,
                    stoppage.departureTime || null,
                    stoppage.stopNumber,
                    stoppage.platformNumber || null,
                    stoppage.haltDuration,
                    stoppage.distanceFromSource,
                ]);
            }
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

        // handle stoppages update
        await client.query(`DELETE FROM train_stoppages WHERE train_id = $1`, [
            id,
        ]);

        const insertStoppageQuery = `
            INSERT INTO train_stoppages (train_id, station_name, station_code, arrival_time,
                departure_time, stop_number, platform_number, halt_duration_minutes, distance_from_source)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `;

        for (const stoppageData of trainData.stoppages) {
            await client.query(insertStoppageQuery, [
                train.id,
                stoppageData.stationName,
                stoppageData.stationCode,
                stoppageData.arrivalTime,
                stoppageData.departureTime,
                stoppageData.stopNumber,
                stoppageData.platformNumber,
                stoppageData.haltDuration,
                stoppageData.distanceFromSource,
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

        // train basic information
        const trainResult = await pool.query(
            `SELECT * FROM trains WHERE id = $1`,
            [id]
        );

        const train = trainResult.rows[0];
        if (!train) {
            return res.status(404).json({ message: "Train not found" });
        }

        // train classes
        const classesResult = await pool.query(
            `SELECT class_type as type, total_seats as "totalSeats", fare 
             FROM train_classes 
             WHERE train_id = $1 
             ORDER BY class_type`,
            [id]
        );

        // train stoppages
        const stoppagesResult = await pool.query(
            `SELECT id, station_name as "stationName", station_code as "stationCode",
                    arrival_time as "arrivalTime", departure_time as "departureTime",
                    stop_number as "stopNumber", platform_number as "platformNumber",
                    halt_duration_minutes as "haltDuration", distance_from_source as "distanceFromSource"
             FROM train_stoppages 
             WHERE train_id = $1 
             ORDER BY stop_number`,
            [id]
        );

        // combine the results
        const response = {
            ...train,
            classes: classesResult.rows,
            stoppages: stoppagesResult.rows,
        };

        res.json(response);
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

        const dayOfWeek = new Date(date as string).toLocaleDateString("en-US", {
            weekday: "short", // returns 'Mon', 'Tue', etc.
        });

        // query trains that match source, destination, and run on the given day
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
                UNION
                SELECT station_code AS code, station_name AS name FROM train_stoppages
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

// search trains by stoppage stations (segment-based search)
export const searchTrainsByStoppage = async (req: Request, res: Response) => {
    try {
        const { source, destination, date } = req.query as {
            source: string;
            destination: string;
            date: string;
        };

        if (!source || !destination || !date) {
            return res.status(400).json({
                message: "Source, destination, and date are required",
            });
        }

        const dayOfWeek = new Date(date as string).toLocaleDateString("en-US", {
            weekday: "short", // returns 'Mon', 'Tue', etc.
        });

        // find trains that have both source and destination in their stoppages/route
        const result = await pool.query(
            `
            WITH train_routes AS (
                -- Get all possible routes for each train including source, destination, and stoppages
                SELECT 
                    t.id,
                    t.name,
                    t.number,
                    t.source,
                    t.destination,
                    t.source_code,
                    t.destination_code,
                    t.departure_time,
                    t.arrival_time,
                    t.duration,
                    t.distance,
                    t.running_days,
                    -- Source station as stop 0
                    0 as stop_number,
                    t.source as station_name,
                    t.source_code as station_code,
                    NULL::time as arrival_time_stop,
                    t.departure_time as departure_time_stop
                FROM trains t
                
                UNION ALL
                
                -- All intermediate stoppages
                SELECT 
                    t.id,
                    t.name,
                    t.number,
                    t.source,
                    t.destination,
                    t.source_code,
                    t.destination_code,
                    t.departure_time,
                    t.arrival_time,
                    t.duration,
                    t.distance,
                    t.running_days,
                    ts.stop_number,
                    ts.station_name,
                    ts.station_code,
                    ts.arrival_time as arrival_time_stop,
                    ts.departure_time as departure_time_stop
                FROM trains t
                JOIN train_stoppages ts ON t.id = ts.train_id
                
                UNION ALL
                
                -- Destination station as last stop
                SELECT 
                    t.id,
                    t.name,
                    t.number,
                    t.source,
                    t.destination,
                    t.source_code,
                    t.destination_code,
                    t.departure_time,
                    t.arrival_time,
                    t.duration,
                    t.distance,
                    t.running_days,
                    999 as stop_number, -- Large number to ensure it's last
                    t.destination as station_name,
                    t.destination_code as station_code,
                    t.arrival_time as arrival_time_stop,
                    NULL::time as departure_time_stop
                FROM trains t
            ),
            valid_trains AS (
                SELECT DISTINCT tr1.id
                FROM train_routes tr1
                JOIN train_routes tr2 ON tr1.id = tr2.id
                WHERE (tr1.station_name ILIKE $1 OR tr1.station_code ILIKE $1)
                AND (tr2.station_name ILIKE $2 OR tr2.station_code ILIKE $2)
                AND tr1.stop_number < tr2.stop_number
                AND $4 = ANY(tr1.running_days)
            )
            SELECT 
                t.id,
                t.name,
                t.number,
                t.source,
                t.destination,
                t.source_code,
                t.destination_code,
                t.departure_time,
                t.arrival_time,
                t.duration,
                t.distance,
                t.running_days,
                COALESCE(
                    (SELECT json_agg(
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
                        ) ORDER BY tc.class_type
                    )
                    FROM train_classes tc 
                    WHERE tc.train_id = t.id), '[]'::json
                ) AS availability,
                COALESCE(
                    (SELECT json_agg(
                        json_build_object(
                            'id', ts.id,
                            'stationName', ts.station_name,
                            'stationCode', ts.station_code,
                            'arrivalTime', ts.arrival_time,
                            'departureTime', ts.departure_time,
                            'stopNumber', ts.stop_number,
                            'platformNumber', ts.platform_number,
                            'haltDuration', ts.halt_duration_minutes,
                            'distanceFromSource', ts.distance_from_source
                        ) ORDER BY ts.stop_number
                    )
                    FROM train_stoppages ts 
                    WHERE ts.train_id = t.id), '[]'::json
                ) AS stoppages
            FROM trains t
            WHERE t.id IN (SELECT id FROM valid_trains)
            ORDER BY t.departure_time;
            `,
            [source, destination, date, dayOfWeek]
        );

        res.json(result.rows);
    } catch (error) {
        console.error("Search trains by stoppage error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
