package com.webrtc.signaling.pure.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Builder
@Data
@AllArgsConstructor
@NoArgsConstructor
public class SocketMessage {
    private String from; // 보내는 유저 UUID
    private String type; // 메시지 타입
    private String roomId; // roomId
    private Object candidate; // ice
    private Object sdp; // sdp 정보
    private List<String> allUsers; // 방에 속한 모든 유저
}
