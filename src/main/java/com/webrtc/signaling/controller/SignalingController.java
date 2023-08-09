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
    public String SimplePeerCamGetCamId(@Payload String body, @DestinationVariable String roomId){
        return body;
    }

    @MessageMapping("/simple-peer/stream/getCamId/{roomId}")
    @SendTo("/topic/simple-peer/stream/getCamId/{roomId}")
    public String SimplePeerStreamGetCamId(@Payload String body, @DestinationVariable String roomId){
        return body;
    }


//    @MessageMapping("/peer/offer/{roomId}")
//    @SendTo("/topic/peer/offer/{roomId}")
//    public String PeerHandleOffer(@Payload String offer, @DestinationVariable String roomId) {
//        return offer;
//    }
//
//    @MessageMapping("/peer/iceCandidate/{roomId}")
//    @SendTo("/topic/peer/iceCandidate/{roomId}")
//    public String PeerHandleIceCandidate(@Payload String candidate, @DestinationVariable String roomId) {
//        return candidate;
//    }
//
//    @MessageMapping("/peer/answer/{roomId}")
//    @SendTo("/topic/peer/answer/{roomId}")
//    public String PeerHandleAnswer(@Payload String answer, @DestinationVariable String roomId){
//        return answer;
//    }
//
//    @MessageMapping("/call")
//    @SendTo("/topic/call")
//    public SignalingMessage processCallMessage(@Payload SignalingMessage message) {
//        return message;
//    }
}
