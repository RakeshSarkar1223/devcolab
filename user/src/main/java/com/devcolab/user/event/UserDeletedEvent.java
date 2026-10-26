package com.devcolab.user.event;

public class UserDeletedEvent {

    private String email;

    public UserDeletedEvent() {
    }

    public UserDeletedEvent(String email) {
        this.email = email;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }
}
