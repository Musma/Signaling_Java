package com.webrtc.signaling.kurento;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;

@JsonInclude(JsonInclude.Include.NON_NULL)
@Builder
public record KurentoMessage(
        String id,
        String response,
        String message,
        Object candidate,
        String sdpAnswer
) {
}
