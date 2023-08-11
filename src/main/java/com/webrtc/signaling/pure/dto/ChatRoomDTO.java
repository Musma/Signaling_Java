package com.webrtc.signaling.pure.dto;

import lombok.Builder;
import lombok.Data;

import java.util.HashMap;
import java.util.UUID;

@Data
@Builder
public class ChatRoomDTO {
    private String roomId;
    private String roomName;
    private long userCount;

    private HashMap<String, String> userList = new HashMap<>();

    public ChatRoomDTO create(String roomName){
        return ChatRoomDTO.builder()
                .roomId(UUID.randomUUID().toString())
                .roomName(roomName)
                .build();
    }
}
