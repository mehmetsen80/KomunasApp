package org.lite.komunas.enums;

import lombok.Getter;

/**
 * High-fidelity enumeration for USCIS Resource Change Types.
 * Standardizes the "changeType" field across all synchronization streams.
 */
@Getter
public enum ResourceChangeType {
    FORM_UPDATE("FORM_UPDATE"),
    ANNOUNCEMENT_UPDATE("ANNOUNCEMENT_UPDATE"),
    POLICY_UPDATE("POLICY_UPDATE"),
    VISA_BULLETIN_UPDATE("VISA_BULLETIN_UPDATE");

    private final String value;

    ResourceChangeType(String value) {
        this.value = value;
    }

    @Override
    public String toString() {
        return this.value;
    }
}
