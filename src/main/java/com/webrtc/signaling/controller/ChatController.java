package com.webrtc.signaling.controller;

import com.webrtc.signaling.dto.ChatDTO;
import com.webrtc.signaling.dto.MessageType;
import com.webrtc.signaling.dto.SocketMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;


@Slf4j
@Controller
public class ChatController {
    Map<String, List<String>> rooms = new HashMap<String, List<String>>();

    @MessageMapping("/chat/{roomId}")
    @SendTo("/sub/chat/{roomId}")
    public ChatDTO chatRoom(@DestinationVariable("roomId") String roomId, ChatDTO message) {
        ChatDTO response = null;
        switch (message.getType()) {
            case ENTER -> {
                if (rooms.containsKey(roomId)) {
                    log.info("join 0 : 방 있음 : {}", roomId);
                    List<String> users = rooms.get(roomId);
                    log.info("join 1 : 방({}) 참가 : {}", roomId, message.getSender());
                    users.add(message.getSender());
                    rooms.put(roomId, users);
                } else {
                    log.info("join 0 : 방 생성 : {}", roomId);
                    ArrayList<String> users = new ArrayList<>();
                    users.add(message.getSender());
                    log.info("join 1 : 방({}) 참가 : {}", roomId, message.getSender());
                    rooms.put(roomId, users);
                }
                response = ChatDTO.builder()
                        .type(MessageType.ENTER)
                        .sender(message.getSender())
                        .roomId(roomId)
                        .build();
            }
            case TALK -> {
                response = ChatDTO.builder()
                        .type(MessageType.TALK)
                        .sender(message.getSender())
                        .roomId(roomId)
                        .message(message.getMessage())
                        .build();
            }
            case LEAVE -> {
                response = ChatDTO.builder()
                        .type(MessageType.LEAVE)
                        .sender(message.getSender())
                        .roomId(roomId)
                        .build();
            }
            default -> {
                log.info("Type Error : " + message.getType());
            }
        }
        return response;
    }
}
