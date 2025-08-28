import Cookies from "js-cookie";

export const cookieUtils = {
    set: (name: string, value: string, days: number = 7) => {
        // use secure cookies only in production (HTTPS)
        const isProduction = import.meta.env.PROD;

        Cookies.set(name, value, {
            expires: days,
            secure: isProduction, // only secure in production
            sameSite: "lax",
            path: "/", // ensure cookie is available across all paths
        });
    },

    get: (name: string): string | undefined => {
        return Cookies.get(name);
    },

    remove: (name: string) => {
        Cookies.remove(name, { path: "/" });
    },
};
