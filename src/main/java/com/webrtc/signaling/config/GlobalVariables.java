package com.webrtc.signaling.config;

import com.webrtc.signaling.dto.CommonResp;
import lombok.Data;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.async.DeferredResult;

import java.util.HashMap;
import java.util.Map;

@Component
@Data
public class GlobalVariables {
    //룸 ID 확인 map ( sessionId, roomId )
    private Map<String, String> checkRoomId = new HashMap<>();
    //룸 ID 인원 확인 map ( roomId, roomUserCount )
    private Map<String, Integer> checkRoomIdCount = new HashMap<>();
    //유저 camKey 확인 map ( sessionId, camKey )
    private Map<String, String> checkCamKey = new HashMap<>();
    //룸 퇴장 체크 poll Map ( roomId , DeferredResult )
    private final Map<String, DeferredResult<ResponseEntity<CommonResp>>> roomCheckWaitingClient = new HashMap<>();
}
