package com.devcolab.projectservice.model;

import com.fasterxml.jackson.annotation.JsonCreator;

public enum Visibility {
    PUBLIC,
    PRIVATE;

    @JsonCreator
    public static Visibility fromString(String value) {
        if (value == null) {
            return PUBLIC;
        }
        for (Visibility v : Visibility.values()) {
            if (v.name().equalsIgnoreCase(value.trim())) {
                return v;
            }
        }
        throw new IllegalArgumentException("Unknown visibility: " + value + ". Valid values are: PUBLIC, PRIVATE");
    }
}
