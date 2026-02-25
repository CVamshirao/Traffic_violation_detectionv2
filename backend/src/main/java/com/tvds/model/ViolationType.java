package com.tvds.model;

import java.util.HashMap;
import java.util.Map;

public enum ViolationType {
    OVER_SPEED("Over Speed"),
    NO_HELMET("No Helmet"),
    SIGNAL_JUMP("Signal Jump"),
    ILLEGAL_PARKING("Illegal Parking"),
    WRONG_WAY("Wrong Way Driving"),
    NO_SEATBELT("No Seatbelt"),
    TRIPLE_RIDING("Triple Riding"),
    USING_MOBILE("Using Mobile While Driving"),
    DRUNK_DRIVING("Drunk Driving"),
    NO_LICENSE_PLATE("No License Plate"),
    OVERLOADING("Overloading"),
    LANE_VIOLATION("Lane Violation");

    private final String displayName;

    private static final Map<String, ViolationType> DISPLAY_NAME_MAP = new HashMap<>();
    private static final Map<String, ViolationType> FLEXIBLE_MAP = new HashMap<>();

    static {
        for (ViolationType vt : values()) {
            DISPLAY_NAME_MAP.put(vt.displayName.toLowerCase(), vt);
            FLEXIBLE_MAP.put(vt.name().toLowerCase(), vt);
            // Also map short forms: "Using Mobile" -> USING_MOBILE
            String shortForm = vt.displayName.toLowerCase()
                    .replace("driving", "").replace("while", "").trim()
                    .replaceAll("\\s+", " ");
            FLEXIBLE_MAP.put(shortForm, vt);
        }
    }

    ViolationType(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }

    /**
     * Flexible lookup: tries enum name, display name, and normalized forms.
     */
    public static ViolationType fromString(String input) {
        if (input == null || input.isBlank()) {
            throw new IllegalArgumentException("Violation type cannot be empty");
        }
        String normalized = input.trim().toLowerCase();

        // Try exact enum name
        ViolationType found = FLEXIBLE_MAP.get(normalized);
        if (found != null)
            return found;

        // Try display name
        found = DISPLAY_NAME_MAP.get(normalized);
        if (found != null)
            return found;

        // Try converting to enum-style: "Over Speed" -> "OVER_SPEED"
        String enumStyle = normalized.replace(" ", "_");
        found = FLEXIBLE_MAP.get(enumStyle);
        if (found != null)
            return found;

        // Last resort: try valueOf
        try {
            return ViolationType.valueOf(input.toUpperCase().replace(" ", "_"));
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid violation type: " + input);
        }
    }
}
