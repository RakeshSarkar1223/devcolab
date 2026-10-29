package com.devcolab.projectservice.model;

import com.fasterxml.jackson.annotation.JsonCreator;

public enum MemberStatus {
    ACTIVE,
    PENDING,
    INVITED,
    REMOVED;

    @JsonCreator
    public static MemberStatus fromString(String value) {
        if (value == null) {
            return ACTIVE;
        }
        for (MemberStatus status : MemberStatus.values()) {
            if (status.name().equalsIgnoreCase(value.trim())) {
                return status;
            }
        }
        throw new IllegalArgumentException("Unknown status: " + value + ". Valid statuses are: ACTIVE, PENDING, INVITED, REMOVED");
    }
}
