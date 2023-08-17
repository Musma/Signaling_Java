package com.webrtc.signaling.controller;

import com.webrtc.signaling.dto.SignalingMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
public class SignalingController {
    @MessageMapping("/simple-peer/offer/{camId}/{roomId}")
    @SendTo("/topic/simple-peer/answer/{camId}/{roomId}")
    public String simplePeerHandleOffer(@Payload String offer,
                                        @DestinationVariable(value = "roomId") String roomId,
                                        @DestinationVariable(value = "camId") String camId) {
        return offer;
    }

    @MessageMapping("/simple-peer/iceCandidate/{roomId}")
    @SendTo("/topic/simple-peer/iceCandidate/{roomId}")
    public String SimplePeerHandleIceCandidate(@Payload String candidate, @DestinationVariable String roomId) {
        return candidate;
    }

    @MessageMapping("/simple-peer/cam/getCamId/{roomId}")
    @SendTo("/topic/simple-peer/cam/getCamId/{roomId}")
    public String SimplePeerCamGetCamId(@Payload String body, @DestinationVariable String roomId) {
        return body;
    }

    @MessageMapping("/simple-peer/stream/getCamId/{roomId}")
    @SendTo("/topic/simple-peer/stream/getCamId/{roomId}")
    public String SimplePeerStreamGetCamId(@Payload String body, @DestinationVariable String roomId) {
        return body;
    }


    @MessageMapping("/peer/offer/{camKey}/{roomId}")
    @SendTo("/topic/peer/offer/{camKey}/{roomId}")
    public String PeerHandleOffer(@Payload String offer, @DestinationVariable(value = "roomId") String roomId,
                                  @DestinationVariable(value = "camKey") String camKey) {
        log.info("[OFFER] {} : {}", camKey, offer);
        return offer;
    }

    @MessageMapping("/peer/iceCandidate/{camKey}/{roomId}")
    @SendTo("/topic/peer/iceCandidate/{camKey}/{roomId}")
    public String PeerHandleIceCandidate(@Payload String candidate, @DestinationVariable(value = "roomId") String roomId,
                                         @DestinationVariable(value = "camKey") String camKey) {
        log.info("[ICECANDIDATE] {} : {}", camKey, candidate);
        return candidate;
    }

    @MessageMapping("/peer/answer/{camKey}/{roomId}")
    @SendTo("/topic/peer/answer/{camKey}/{roomId}")
    public String PeerHandleAnswer(@Payload String answer, @DestinationVariable(value = "roomId") String roomId,
                                   @DestinationVariable(value = "camKey") String camKey) {
        log.info("[ANSWER] {} : {}", camKey, answer);
        return answer;
    }

    @MessageMapping("/call/key")
    @SendTo("/topic/call/key")
    public String callKey(@Payload String message) {
        log.info("[Key] : {}", message);
        return message;
    }

    @MessageMapping("/send/key")
    @SendTo("/topic/send/key")
    public String sendKey(@Payload String message) {
        return message;
    }

    @MessageMapping("/peer/start/steam")
    @SendTo("/topic/peer/start/steam")
    public String peerStartSteam(@Payload String message) {
        return message;
    }
}
