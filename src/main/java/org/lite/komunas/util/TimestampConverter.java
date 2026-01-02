package org.lite.komunas.util;

import java.time.LocalDateTime;
import java.time.ZoneOffset;

/**
 * Utility class for converting between LocalDateTime and Unix timestamp strings
 * used in WhatsApp message queries.
 */
public class TimestampConverter {

    /**
     * Convert LocalDateTime to Unix timestamp string (seconds since epoch)
     * 
     * @param dateTime LocalDateTime to convert
     * @return Unix timestamp as string
     */
    public static String toUnixTimestampString(LocalDateTime dateTime) {
        if (dateTime == null) {
            return null;
        }
        long epochSeconds = dateTime.toEpochSecond(ZoneOffset.UTC);
        return String.valueOf(epochSeconds);
    }

    /**
     * Convert Unix timestamp string to LocalDateTime
     * 
     * @param timestamp Unix timestamp string (seconds since epoch)
     * @return LocalDateTime representation
     */
    public static LocalDateTime fromUnixTimestampString(String timestamp) {
        if (timestamp == null || timestamp.trim().isEmpty()) {
            return null;
        }
        try {
            long epochSeconds = Long.parseLong(timestamp.trim());
            return LocalDateTime.ofEpochSecond(epochSeconds, 0, ZoneOffset.UTC);
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("Invalid timestamp format: " + timestamp, e);
        }
    }

    /**
     * Get current Unix timestamp as string
     * 
     * @return Current Unix timestamp as string
     */
    public static String getCurrentUnixTimestampString() {
        long currentEpoch = System.currentTimeMillis() / 1000;
        return String.valueOf(currentEpoch);
    }

    /**
     * Get Unix timestamp string for a specific number of days ago
     * 
     * @param daysAgo Number of days to go back
     * @return Unix timestamp string for that many days ago
     */
    public static String getUnixTimestampStringDaysAgo(long daysAgo) {
        long daysAgoEpoch = System.currentTimeMillis() / 1000 - (daysAgo * 24 * 60 * 60);
        return String.valueOf(daysAgoEpoch);
    }
}