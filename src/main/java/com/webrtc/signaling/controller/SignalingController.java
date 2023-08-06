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
//    @MessageMapping("/offer/{roomId}")
//    @SendTo("/topic/answer/{roomId}")
//    public String handleOffer(@Payload String offer, @DestinationVariable String roomId) {
//        return offer;
//    }
//
//    @MessageMapping("/iceCandidate/{roomId}")
//    @SendTo("/topic/iceCandidate/{roomId}")
//    public String handleIceCandidate(@Payload String candidate, @DestinationVariable String roomId) {
//        return candidate;
//    }

    @MessageMapping("/offer/{roomId}")
    @SendTo("/topic/offer/{roomId}")
    public String handleOffer(@Payload String offer, @DestinationVariable String roomId) {
        return offer;
    }

    @MessageMapping("/iceCandidate/{roomId}")
    @SendTo("/topic/iceCandidate/{roomId}")
    public String handleIceCandidate(@Payload String candidate, @DestinationVariable String roomId) {
        return candidate;
    }

    @MessageMapping("/answer/{roomId}")
    @SendTo("/topic/answer/{roomId}")
    public String handleAnswer(@Payload String answer, @DestinationVariable String roomId){
        return answer;
    }

    @MessageMapping("/call")
    @SendTo("/topic/call")
    public SignalingMessage processCallMessage(@Payload SignalingMessage message) {
        return message;
    }
}
