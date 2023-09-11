package com.webrtc.signaling.dto;

import lombok.Data;

@Data
public class EnterRoomReq {
    private String roomId;
    private String camKey;
}
