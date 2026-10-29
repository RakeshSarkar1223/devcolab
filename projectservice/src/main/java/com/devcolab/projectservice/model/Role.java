package com.devcolab.projectservice.model;

import com.fasterxml.jackson.annotation.JsonCreator;

public enum Role {
    OWNER,
    DEVELOPER,
    VIEWER;

    @JsonCreator
    public static Role fromString(String value) {
        if (value == null) {
            return null;
        }
        for (Role r : Role.values()) {
            if (r.name().equalsIgnoreCase(value.trim())) {
                return r;
            }
        }
        throw new IllegalArgumentException("Unknown role: " + value + ". Valid roles are: OWNER, DEVELOPER, VIEWER");
    }
}
