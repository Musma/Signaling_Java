package com.webrtc.signaling.config;

import com.webrtc.signaling.dto.CommonResp;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.event.EventListener;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.MessageHeaders;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.GenericMessage;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.util.*;

@Slf4j
@Component
public class WebSocketEventListener {

    @Autowired
    private GlobalVariables globalVariables;


    @EventListener
    public void handleWebsocketConnectListener(SessionConnectedEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        String sessionId = headerAccessor.getSessionId();

        Map<String, List<String>> nativeHeaders = getNativeHeaders(event);
        String roomId = nativeHeaders.get("roomId").get(0);
        String camKey = nativeHeaders.get("camKey").get(0);

        if(!globalVariables.getCheckRoomId().containsKey(sessionId)){
            globalVariables.getCheckRoomId().put(sessionId, roomId);
            if(globalVariables.getCheckRoomIdCount().containsKey(roomId)){
                globalVariables.getCheckRoomIdCount().put(roomId, globalVariables.getCheckRoomIdCount().get(roomId)+1);
            }
            else{
                globalVariables.getCheckRoomIdCount().put(roomId, 1);
            }
        }

        if(!globalVariables.getCheckCamKey().containsKey(sessionId)){
            globalVariables.getCheckCamKey().put(sessionId, camKey);
        }

        log.info("\n웹소켓 접속 : "+sessionId + "\n"
                + "룸 ID : "+ roomId + "\n"
                + "룸 인원 : "+globalVariables.getCheckRoomIdCount().get(roomId));
    }

    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event){
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        String sessionId = headerAccessor.getSessionId();

        String roomId = globalVariables.getCheckRoomId().get(sessionId);

        if(globalVariables.getCheckRoomIdCount().containsKey(roomId)){
            if(globalVariables.getCheckRoomIdCount().get(roomId) - 1 <= 0){
                globalVariables.getCheckRoomIdCount().remove(roomId);
            }
            else{
                globalVariables.getCheckRoomIdCount().put(roomId, globalVariables.getCheckRoomIdCount().get(roomId) - 1);
            }
        }

        if(globalVariables.getRoomCheckWaitingClient().containsKey(roomId)){
            Map<String , String> returnMap = new HashMap<>();

            returnMap.put("camKey", globalVariables.getCheckCamKey().get(sessionId));
            returnMap.put("roomCount", String.valueOf(globalVariables.getCheckRoomIdCount().get(roomId)));

            globalVariables.getRoomCheckWaitingClient().get(roomId).setResult(
                    new ResponseEntity<>(CommonResp.builder()
                            .data(returnMap)
                            .status_code(HttpStatus.OK.value())
                            .result(CommonResp.ResultType.SUCCESS)
                            .build(),
                            HttpStatus.OK)
            );
        }



        log.info("\n웹소켓 끊김 : "+sessionId+"\n"
                +"룸 ID : "+roomId + "\n"
                +"룸 인원 : "+ globalVariables.getCheckRoomIdCount().get(roomId) );
    }


    //SessionConnectedEvent 에서 NativeHeader 찾기 메서드
    private Map<String, List<String>> getNativeHeaders(SessionConnectedEvent event){
        //messageHeaders 를 추출
        MessageHeaders headers = event.getMessage().getHeaders();
        //simpConnectMessage 를 추출
        GenericMessage<?> simpConnectMessage = (GenericMessage<?>) headers.get("simpConnectMessage");
        //simpConnectMessage 의 MessageHeader 를 추출
        MessageHeaders simpHeaders = Objects.requireNonNull(simpConnectMessage).getHeaders();

        //Map<String, List<String>>로 nativeHeader를 추출하여 리턴한다.
        return (Map<String, List<String>>) simpHeaders.get("nativeHeaders");
    }
}
