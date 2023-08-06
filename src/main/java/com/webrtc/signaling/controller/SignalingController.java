package com.webrtc.signaling.controller;

import com.webrtc.signaling.dto.SignalingMessage;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class SignalingController {
    @MessageMapping("/simple-peer/offer/{roomId}")
    @SendTo("/topic/simple-peer/answer/{roomId}")
    public String simplePeerHandleOffer(@Payload String offer, @DestinationVariable String roomId) {
        return offer;
    }

    @MessageMapping("/simple-peer/iceCandidate/{roomId}")
    @SendTo("/topic/simple-peer/iceCandidate/{roomId}")
    public String SimplePeerHandleIceCandidate(@Payload String candidate, @DestinationVariable String roomId) {
        return candidate;
    }

    @MessageMapping("/peer/offer/{roomId}")
    @SendTo("/topic/peer/offer/{roomId}")
    public String PeerHandleOffer(@Payload String offer, @DestinationVariable String roomId) {
        return offer;
    }

    @MessageMapping("/peer/iceCandidate/{roomId}")
    @SendTo("/topic/peer/iceCandidate/{roomId}")
    public String PeerHandleIceCandidate(@Payload String candidate, @DestinationVariable String roomId) {
        return candidate;
    }

    @MessageMapping("/peer/answer/{roomId}")
    @SendTo("/topic/peer/answer/{roomId}")
    public String PeerHandleAnswer(@Payload String answer, @DestinationVariable String roomId){
        return answer;
    }

    @MessageMapping("/call")
    @SendTo("/topic/call")
    public SignalingMessage processCallMessage(@Payload SignalingMessage message) {
        return message;
    }
}
