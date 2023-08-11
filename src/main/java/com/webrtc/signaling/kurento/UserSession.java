package com.webrtc.signaling.kurento;

import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.kurento.client.IceCandidate;
import org.kurento.client.WebRtcEndpoint;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;

import java.io.IOException;

@Slf4j
@Getter
public class UserSession {
    private final WebSocketSession session;
    private WebRtcEndpoint webRtcEndpoint;

    public UserSession(WebSocketSession session) {
        this.session = session;
    }

    public void sendMessage(String message) throws IOException {
        log.debug("Sending message from user with session ID '{}': {}", session.getId(), message);
        session.sendMessage(new TextMessage(message));
    }

    public void setWebRtcEndpoint(WebRtcEndpoint webRtcEndpoint) {
        this.webRtcEndpoint = webRtcEndpoint;
    }

    public void addCandidate(IceCandidate candidate) {
        webRtcEndpoint.addIceCandidate(candidate);
    }
}
