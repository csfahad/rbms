export const generatePNR = (): string => {
    const now = new Date();
    const day = now.getDate().toString().padStart(2, "0"); // 2 digits day
    const month = (now.getMonth() + 1).toString().padStart(2, "0"); // 2 digits month
    const random = Math.floor(Math.random() * 1_000_000)
        .toString()
        .padStart(6, "0"); // 6-digit random number

    return `${day}${month}${random}`;
};
