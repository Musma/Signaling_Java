package com.webrtc.signaling.kurento;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonObject;
import lombok.extern.slf4j.Slf4j;
import org.kurento.client.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
public class KurentoHandler extends TextWebSocketHandler {
    public static final String PRESENTER = "presenter";
    public static final String VIEWER = "viewer";
    public static final String ON_ICE_CANDIDATE = "onIceCandidate";
    public static final String ACCEPTED = "accepted";
    public static final String REJECTED = "rejected";
    public static final String STOP_COMMUNICATION = "stopCommunication";
    public static final String PRESENTER_RESPONSE = "presenterResponse";
    public static final String ICE_CANDIDATE_RESPONSE = "iceCandidate";
    public static final String VIEWER_RESPONSE = "viewerResponse";

    @Autowired
    private KurentoClient kurento;
    private final ConcurrentHashMap<String, UserSession> viewers = new ConcurrentHashMap<>();
    private static final Gson gson = new GsonBuilder().create();
    private MediaPipeline pipeline;
    private UserSession presenterUserSession;

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        super.afterConnectionEstablished(session);
        log.info("Connection established");
    }

    @Override
    public void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        JsonObject jsonObject = gson.fromJson(message.getPayload(), JsonObject.class);
        log.info("Incoming message from session '{}' : {}", session.getId(), jsonObject);

        switch (jsonObject.get("id").getAsString()) {
            case PRESENTER -> {
                try {
                    presenter(session, jsonObject);
                } catch (Throwable t) {
                    handleErrorResponse(t, session, PRESENTER_RESPONSE);
                }
            }
            case VIEWER -> {
                try {
                    viewer(session, jsonObject);
                } catch (Throwable t) {
                    handleErrorResponse(t, session, VIEWER_RESPONSE);
                }
            }
            case ON_ICE_CANDIDATE -> {
                JsonObject candidate = jsonObject.get("candidate").getAsJsonObject();
                UserSession user = null;
                if (presenterUserSession != null) {
                    if (presenterUserSession.getSession() == session) {
                        user = presenterUserSession;
                    } else {
                        user = viewers.get(session.getId());
                    }
                }
                if (user != null) {
                    IceCandidate cand =
                            new IceCandidate(candidate.get("candidate").getAsString(), candidate.get("sdpMid")
                                    .getAsString(), candidate.get("sdpMLineIndex").getAsInt());
                    user.addCandidate(cand);
                }
            }
            case "stop" -> {
                stop(session);
            }
            default -> {
                break;
            }
        }
    }

    private synchronized void viewer(WebSocketSession session, JsonObject jsonObject) throws IOException {
        log.info("Start Viewer process");
        if (presenterUserSession == null || presenterUserSession.getWebRtcEndpoint() == null) {
            KurentoMessage message = KurentoMessage.builder()
                    .id(VIEWER_RESPONSE)
                    .response(REJECTED)
                    .message("No active sender now. Become sender or. Try again later...")
                    .build();
            sendMessage(session, message);
        } else {
            if (viewers.containsKey(session.getId())) {
                KurentoMessage message = KurentoMessage.builder()
                        .id(VIEWER_RESPONSE)
                        .response(REJECTED)
                        .message("You are already viewing in this session. Use a different breower to add additional viewers.")
                        .build();
                sendMessage(session, message);
                return;
            }
            UserSession viewer = new UserSession(session);
            viewers.put(session.getId(), viewer);
            WebRtcEndpoint nextWebRtc = new WebRtcEndpoint.Builder(pipeline).build();
            nextWebRtc.addIceCandidateFoundListener(new EventListener<IceCandidateFoundEvent>() {
                @Override
                public void onEvent(IceCandidateFoundEvent event) {
                    log.info("Send ice from viewer");
                    KurentoMessage message = KurentoMessage.builder()
                            .id(ICE_CANDIDATE_RESPONSE)
                            .candidate(event.getCandidate())
                            .build();
                    synchronized (session) {
                        sendMessage(session, message);
                    }
                }
            });

            viewer.setWebRtcEndpoint(nextWebRtc);
            presenterUserSession.getWebRtcEndpoint().connect(nextWebRtc);
            log.info("Create offer from viewer");
            String sdpOffer = jsonObject.getAsJsonPrimitive("sdpOffer").getAsString();
            String sdpAnswer = nextWebRtc.processOffer(sdpOffer);
            log.info("Create answer from viewer");
            KurentoMessage message = KurentoMessage.builder()
                    .id(VIEWER_RESPONSE)
                    .response(ACCEPTED)
                    .sdpAnswer(sdpAnswer)
                    .build();
            synchronized (session) {
                viewer.sendMessage(gson.toJson(message));
            }
            nextWebRtc.gatherCandidates();
        }
    }


    private synchronized void presenter(WebSocketSession session, JsonObject jsonObject) throws IOException {
        log.info("Start Presenter process");
        if (presenterUserSession == null) {
            log.info("Create presenterUserSession");
            presenterUserSession = new UserSession(session);
            pipeline = kurento.createMediaPipeline();
            presenterUserSession.setWebRtcEndpoint(new WebRtcEndpoint.Builder(pipeline).build());
            WebRtcEndpoint presenterWebRtc = presenterUserSession.getWebRtcEndpoint();
            presenterWebRtc.addIceCandidateFoundListener(new EventListener<IceCandidateFoundEvent>() {
                @Override
                public void onEvent(IceCandidateFoundEvent event) {
                    log.info("Send ice from presenter");
                    KurentoMessage message = KurentoMessage.builder()
                            .id(ICE_CANDIDATE_RESPONSE)
                            .candidate(event.getCandidate())
                            .build();
                    synchronized (session) {
                        sendMessage(session, message);
                    }
                }
            });
            log.info("Create offer from presenter");
            String sdpOffer = jsonObject.getAsJsonPrimitive("sdpOffer").getAsString();
            String sdpAnswer = presenterWebRtc.processOffer(sdpOffer);
            log.info("Send anser from presenter");
            KurentoMessage message = KurentoMessage.builder()
                    .id(PRESENTER_RESPONSE)
                    .response(ACCEPTED)
                    .sdpAnswer(sdpAnswer)
                    .build();
            synchronized (session) {
                presenterUserSession.sendMessage(gson.toJson(message));
            }
            presenterWebRtc.gatherCandidates();
        } else {
            KurentoMessage message = KurentoMessage.builder()
                    .id(PRESENTER_RESPONSE)
                    .response(REJECTED)
                    .message("Another user is currently acting as sender. Try again later ...")
                    .build();
            sendMessage(session, message);
        }
    }

    private void handleErrorResponse(Throwable t, WebSocketSession session, String responseId) throws IOException {
        stop(session);
        log.error(t.getMessage(), t);
        KurentoMessage message = KurentoMessage.builder()
                .id(responseId)
                .response(REJECTED)
                .message(t.getMessage())
                .build();
        sendMessage(session, message);
    }

    private void stop(WebSocketSession session) throws IOException {
        String sessionId = session.getId();
        if (presenterUserSession != null && presenterUserSession.getSession().getId().equals(sessionId)) {
            for (UserSession viewer : viewers.values()) {
                KurentoMessage message = KurentoMessage.builder()
                        .id(STOP_COMMUNICATION)
                        .build();
                viewer.sendMessage(gson.toJson(message));
            }
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        stop(session);
    }

    private void sendMessage(WebSocketSession session, KurentoMessage message) {
        try {
            String json = gson.toJson(message);
            log.info("발송 to : {}", session.getId());
            log.info("발송 내용 : {}", json);
            session.sendMessage(new TextMessage(json));
        } catch (IOException e) {
            log.error("sendMessage Error: " + e.getMessage());
        }
    }
}
