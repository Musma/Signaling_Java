package com.webrtc.signaling.dto;

import lombok.Builder;
import lombok.Getter;

@Builder
@Getter
public class CommonResp {
    private int status_code;
    private String error_code;
    private ResultType result;
    private String message;
    private Object data;
    private Object error;

    public enum ResultType{
        SUCCESS, FAIL;
    }
}
