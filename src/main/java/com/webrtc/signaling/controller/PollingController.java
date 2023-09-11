package com.webrtc.signaling.controller;

import com.webrtc.signaling.config.GlobalVariables;
import com.webrtc.signaling.dto.CommonResp;
import com.webrtc.signaling.dto.EnterRoomReq;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.context.request.async.DeferredResult;

import java.util.HashMap;
import java.util.Map;

@RestController
public class PollingController {
    private final long timeoutTime = 1L;

    @Autowired
    private GlobalVariables globalVariables;

    //long polling 상태 저장 map
    private final Map<String, DeferredResult<ResponseEntity<CommonResp>>> roomCreateWaitingClient = new HashMap<>();


    // CCTV 룸 생성 및 접속 확인 long polling api
    @GetMapping("/poll/enter/room/{path}")
    public DeferredResult<ResponseEntity<CommonResp>> pollCreateRoom(@PathVariable(name = "path") String path){
        //DeferredResult 생성, 대기 만료 시간은 1시간으로 지정
        DeferredResult<ResponseEntity<CommonResp>> deferredResult = new DeferredResult<>(timeoutTime * 60 * 60 * 60,"what!!");

        //map 에 생성한 deferredResult 저장, key는 path 지정 값 ( roomId )
        roomCreateWaitingClient.put(path,deferredResult);

        //해당 deferredResult 가 setResult 가 되었다면 map 에서 지운다.
        deferredResult.onCompletion(() -> roomCreateWaitingClient.remove(path));

        //받은 result 값을 반환 해준다.
        return deferredResult;
    }

    // CCTV 룸 생성 및 접속 확인 receive-events api
    @PostMapping("/receive-events/create/room/{path}")
    public void receiveEventCreateRoom(@RequestBody EnterRoomReq enterRoomReq, @PathVariable(name = "path") String path){
        // 만약 path 의 값의 roomCreateWaitingClient key 값에 있다면 실행
        if(roomCreateWaitingClient.containsKey(path)){
            // 해당되는 value에 result 값을 넣는다.
            roomCreateWaitingClient.get(path).setResult(
                    new ResponseEntity<>(CommonResp.builder()
                            .data(enterRoomReq)
                            .status_code(HttpStatus.OK.value())
                            .result(CommonResp.ResultType.SUCCESS)
                            .build(),
                            HttpStatus.OK));
        }

    }

    @GetMapping("/poll/leave/room/{path}")
    public DeferredResult<ResponseEntity<CommonResp>> pollcheckRoom(@PathVariable(name = "path") String path){
        //DeferredResult 생성, 대기 만료 시간은 1시간으로 지정
        DeferredResult<ResponseEntity<CommonResp>> deferredResult = new DeferredResult<>(timeoutTime * 60 * 60 * 60,"what!!");

        //map 에 생성한 deferredResult 저장, key는 path 지정 값 ( roomId )
        globalVariables.getRoomCheckWaitingClient().put(path,deferredResult);

        //해당 deferredResult 가 setResult 가 되었다면 map 에서 지운다.
        deferredResult.onCompletion(() -> globalVariables.getRoomCheckWaitingClient().remove(path));

        //받은 result 값을 반환 해준다.
        return deferredResult;
    }



}
