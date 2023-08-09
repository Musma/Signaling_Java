"use client";
import { useEffect, useRef } from "react";

const Video = ({ stream, socketID }: any) => {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.srcObject = stream;
  }, [stream]);
  return (
    <>
      <video
        id="remotevideo"
        style={{
          width: 240,
          height: 240,
          backgroundColor: "black",
        }}
        ref={ref}
        autoPlay
        controls
      />
    </>
  );
};
export default Video;
