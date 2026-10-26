package com.devcolab.auth.event;

public class UserCreatedEvent {
    private String email;
    public UserCreatedEvent(){}
    public UserCreatedEvent(String email){
        this.email = email;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email){
        this.email = email;
    }
}
