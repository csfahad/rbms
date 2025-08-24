// import { jsPDF } from 'jspdf';
// import { Booking, Passenger } from '../services/bookingService';

// export const generateTicketPDF = (booking: Booking, passengers: Passenger[]) => {
//   const doc = new jsPDF();
//   const pageWidth = doc.internal.pageSize.getWidth();

//   // Header with Railway Logo
//   doc.setFontSize(20);
//   doc.text('Railway E-Ticket', pageWidth / 2, 20, { align: 'center' });

//   // Booking Details
//   doc.setFontSize(12);
//   doc.text(`PNR: ${booking.pnr}`, 20, 40);
//   doc.text(`Train: ${booking.trainName} (${booking.trainNumber})`, 20, 50);
//   doc.text(`From: ${booking.source}`, 20, 60);
//   doc.text(`To: ${booking.destination}`, 20, 70);
//   doc.text(`Date: ${new Date(booking.travelDate).toLocaleDateString()}`, 20, 80);
//   doc.text(`Class: ${booking.class}`, 20, 90);
//   doc.text(`Booking Status: ${booking.status}`, 20, 100);

//   // Passenger Details
//   doc.text('Passenger Details:', 20, 120);
//   let y = 130;
//   passengers.forEach((passenger, index) => {
//     doc.text(`${index + 1}. ${passenger.name}`, 30, y);
//     doc.text(`Age: ${passenger.age}, Gender: ${passenger.gender}`, 30, y + 5);
//     doc.text(`Seat: ${passenger.seatNumber}`, 30, y + 10);
//     y += 20;
//   });

//   // Fare Details
//   doc.text('Fare Details:', 20, y + 10);
//   doc.text(`Total Fare: ₹${booking.totalFare}`, 30, y + 20);

//   // Important Instructions
//   y += 40;
//   doc.setFontSize(10);
//   doc.text('Important Instructions:', 20, y);
//   doc.text('1. Please carry a valid photo ID proof during the journey.', 25, y + 10);
//   doc.text('2. Be present at the station at least 30 minutes before departure.', 25, y + 20);
//   doc.text('3. This is a valid proof of travel when shown with ID proof.', 25, y + 30);

//   // Footer
//   doc.setFontSize(8);
//   doc.text('This is a computer-generated ticket and does not require a signature.', pageWidth / 2, 280, { align: 'center' });

//   return doc;
// };

// export const downloadTicket = (booking: Booking) => {
//   const doc = generateTicketPDF(booking, booking.passengers);
//   doc.save(`ticket_${booking.pnr}.pdf`);
// };

// export const printTicket = (booking: Booking) => {
//   const doc = generateTicketPDF(booking, booking.passengers);
//   const pdfData = doc.output('bloburl');
//   window.open(pdfData, '_blank');
// };

import { jsPDF } from "jspdf";
import { Booking } from "../services/bookingService";

const classMappings: Record<string, string> = {
    SL: "Sleeper (SL)",
    "3A": "AC 3 Tier (3A)",
    "2A": "AC 2 Tier (2A)",
    "1A": "AC First Class (1A)",
};

export const generateTicket = (booking: Booking): jsPDF => {
    const doc = new jsPDF();

    // Add railway logo
    // doc.addImage("path_to_logo", "PNG", 20, 10, 30, 30);

    // Header
    doc.setFontSize(20);
    doc.setTextColor(26, 35, 126); // Primary color
    doc.text("Railway E-Ticket", 105, 25, { align: "center" });

    // PNR and Status
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text(`PNR: ${booking.pnr}`, 20, 45);
    doc.text(`Status: ${booking.status}`, 150, 45);

    // Train Details
    doc.setFontSize(12);
    doc.text("Train Details:", 20, 60);
    doc.setFontSize(10);
    doc.text(`Train: ${booking.train_name} (${booking.train_number})`, 25, 70);
    doc.text(`From: ${booking.source}`, 25, 80);
    doc.text(`To: ${booking.destination}`, 25, 90);
    doc.text(
        `Date: ${new Date(booking.travel_date).toLocaleDateString()}`,
        25,
        100
    );
    doc.text(`Class: ${classMappings[booking.class_type]}`, 25, 110);

    // Passenger Details
    doc.setFontSize(12);
    doc.text("Passenger Details:", 20, 130);
    doc.setFontSize(10);

    // Table header
    doc.setFillColor(240, 240, 240);
    doc.rect(25, 140, 160, 10, "F");
    doc.text("Name", 30, 146);
    doc.text("Age", 90, 146);
    doc.text("Gender", 110, 146);
    doc.text("Seat", 140, 146);

    // Passenger rows
    let y = 155;
    booking.passengers.forEach((passenger, index) => {
        if (index % 2 === 0) {
            doc.setFillColor(250, 250, 250);
            doc.rect(25, y - 5, 160, 10, "F");
        }
        doc.text(passenger.name, 30, y);
        doc.text(passenger.age.toString(), 90, y);
        doc.text(passenger.gender, 110, y);
        doc.text(passenger.seatNumber, 140, y);
        y += 10;
    });

    // Fare Details
    y += 10;
    doc.setFontSize(12);
    doc.text("Fare Details:", 20, y);
    doc.setFontSize(10);
    doc.text(`Total Fare: ₹${booking.total_fare}`, 25, y + 10);

    // Booking Details
    y += 30;
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(
        `Booking Date: ${new Date(booking.booking_date).toLocaleString()}`,
        20,
        y
    );
    doc.text(`Booking ID: ${booking.id}`, 20, y + 7);

    // Footer
    doc.setFontSize(8);
    doc.text(
        "This is a computer-generated ticket and does not require signature.",
        105,
        280,
        { align: "center" }
    );
    doc.text(
        "For any assistance, please contact our 24/7 helpline: 1800-123-4567",
        105,
        285,
        { align: "center" }
    );

    return doc;
};

export const downloadTicket = (booking: Booking) => {
    const doc = generateTicket(booking);
    doc.save(`RailBooking_Ticket_${booking.pnr}.pdf`);
};

export const printTicket = (booking: Booking) => {
    const doc = generateTicket(booking);
    window.open(doc.output("bloburl"), "_blank");
};
