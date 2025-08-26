import { useState, useEffect, useRef } from "react";
import { MapPin } from "lucide-react";
import { getStationSuggestions, Station } from "../../services/trainService";

interface StationAutocompleteProps {
    label: string;
    placeholder: string;
    value: string;
    onChange: (value: string) => void;
    onStationSelect: (station: Station) => void;
}

const StationAutocomplete = ({
    label,
    placeholder,
    value,
    onChange,
    onStationSelect,
}: StationAutocompleteProps) => {
    const [suggestions, setSuggestions] = useState<Station[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchSuggestions = async () => {
            if (value.length < 2) {
                setSuggestions([]);
                return;
            }

            setIsLoading(true);
            try {
                const result = await getStationSuggestions(value);
                setSuggestions(result);
            } catch (error) {
                console.error("Error fetching station suggestions:", error);
            } finally {
                setIsLoading(false);
            }
        };

        const timer = setTimeout(fetchSuggestions, 300);
        return () => clearTimeout(timer);
    }, [value]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                wrapperRef.current &&
                !wrapperRef.current.contains(event.target as Node)
            ) {
                setShowSuggestions(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(e.target.value);
        setShowSuggestions(true);
    };

    const handleStationSelect = (station: Station) => {
        onStationSelect(station);
        setShowSuggestions(false);
    };

    return (
        <div className="w-full" ref={wrapperRef}>
            <label htmlFor={label} className="form-label">
                {label}
            </label>
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin className="h-5 w-5 text-gray-400" />
                </div>
                <input
                    type="text"
                    id={label}
                    value={value}
                    onChange={handleInputChange}
                    onFocus={() => setShowSuggestions(true)}
                    className="form-input pl-10 sm:py-2 lg:py-3"
                    placeholder={placeholder}
                    autoComplete="off"
                />

                {isLoading && (
                    <div className="absolute inset-y-0 right-3 flex items-center">
                        <svg
                            className="animate-spin h-5 w-5 text-primary\"
                            xmlns="http://www.w3.org/2000/svg\"
                            fill="none\"
                            viewBox="0 0 24 24"
                        >
                            <circle
                                className="opacity-25\"
                                cx="12\"
                                cy="12\"
                                r="10\"
                                stroke="currentColor\"
                                strokeWidth="4"
                            ></circle>
                            <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                        </svg>
                    </div>
                )}
            </div>

            {showSuggestions && suggestions.length > 0 && (
                <div className="station-suggestions-container max-w-[376px]">
                    {suggestions.map((station) => (
                        <div
                            key={station.code}
                            className="station-suggestion"
                            onClick={() => handleStationSelect(station)}
                        >
                            <div className="font-medium">
                                {station.name} ({station.code})
                            </div>
                            <div className="text-xs text-gray-500">
                                {station.state}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showSuggestions &&
                value.length >= 2 &&
                suggestions.length === 0 &&
                !isLoading && (
                    <div className="station-suggestions-container max-w-[376px]">
                        <div className="p-2 text-gray-500">
                            No stations found
                        </div>
                    </div>
                )}
        </div>
    );
};

export default StationAutocomplete;
