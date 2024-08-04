import { io } from "socket.io-client";
import { useRef, useEffect, useState } from "react";
import { FiMic, FiMicOff } from "react-icons/fi";
import { useStore } from "./store";
import { PiPhoneDisconnectBold } from "react-icons/pi";
import { useNavigate } from "react-router-dom";
import { FaRegShareFromSquare } from "react-icons/fa6";
import { MdDownloadDone } from "react-icons/md";
import Chat from "./components/chat";

const configuration = {
  iceServers: [
    {
      urls: ["stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302"],
    },
  ],
  iceCandidatePoolSize: 10,
};

export const socket = io("https://xoom-pnqd.onrender.com", {
  transports: ["websocket"],
});

let pc;
let localStream;

function App() {
  const mId = useStore((state) => state.meetingId);
  const messageStreak = useStore((state) => state.addMessage);
  const nav = useNavigate();
  const hangupButton = useRef(null);
  const muteAudButton = useRef(null);
  const localVideo = useRef(null);
  const remoteVideo = useRef(null);
  const [audiostate, setAudio] = useState(true);
  const [meetingId, setMeetingId] = useState(mId);
  const [remoteStream, setRemoteStream] = useState(null);
  const [copyStatus, setCopyStatus] = useState(false);

  useEffect(() => {
    hangupButton.current.disabled = true;
    muteAudButton.current.disabled = true;

    const handleMessage = (message) => {
      if (!localStream) {
        console.log("Not ready yet");
        return;
      }
      switch (message.type) {
        case "offer":
          handleOffer(message);
          break;
        case "answer":
          handleAnswer(message);
          break;
        case "candidate":
          handleCandidate(message);
          break;
        case "ready":
          if (pc) {
            console.log("Already in call, ignoring");
            return;
          }
          makeCall();
          break;
        case "bye":
          if (pc) {
            hangup();
          }
          break;
        case "chat":
          messageStreak({
            sender: "other",
            message: message.message,
          });
          break;
        default:
          console.log("Unhandled message type", message);
          break;
      }
    };

    socket.on("message", handleMessage);
    socket.on("error", (error) => {
      alert(error.message);
    });

    return () => {
      socket.off("message", handleMessage);
      socket.off("error");

      // Cleanup media and peer connection
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
        localStream = null;
      }
      if (pc) {
        pc.close();
        pc = null;
      }
    };
  }, []);

  async function makeCall() {
    try {
      pc = new RTCPeerConnection(configuration);
      pc.onicecandidate = (e) => {
        if (e.candidate) {
          socket.emit("message", {
            type: "candidate",
            candidate: e.candidate,
          });
        }
      };
      pc.ontrack = (e) => {
        if (!remoteStream) {
          const newRemoteStream = new MediaStream();
          setRemoteStream(newRemoteStream);
          newRemoteStream.addTrack(e.track);
        } else {
          remoteStream.addTrack(e.track);
        }
      };

      localStream.getTracks().forEach((track) => {
        pc.addTrack(track, localStream);
      });

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit("message", { type: "offer", sdp: offer.sdp });
    } catch (e) {
      console.log("makeCall error:", e);
    }
  }

  async function handleOffer(message) {
    if (pc) {
      console.error("Existing peer connection");
      return;
    }
    try {
      pc = new RTCPeerConnection(configuration);
      pc.onicecandidate = (e) => {
        if (e.candidate) {
          socket.emit("message", {
            type: "candidate",
            candidate: e.candidate,
          });
        }
      };
      pc.ontrack = (e) => {
        if (!remoteStream) {
          const newRemoteStream = new MediaStream();
          setRemoteStream(newRemoteStream);
          newRemoteStream.addTrack(e.track);
        } else {
          remoteStream.addTrack(e.track);
        }
      };

      localStream.getTracks().forEach((track) => {
        pc.addTrack(track, localStream);
      });

      await pc.setRemoteDescription(new RTCSessionDescription(message));

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("message", { type: "answer", sdp: answer.sdp });
    } catch (e) {
      console.log("handleOffer error:", e);
    }
  }

  async function handleAnswer(message) {
    if (!pc) {
      console.error("No peer connection");
      return;
    }
    try {
      await pc.setRemoteDescription(new RTCSessionDescription(message));
    } catch (e) {
      console.log("handleAnswer error:", e);
    }
  }

  async function handleCandidate(message) {
    if (!pc) {
      console.error("No peer connection");
      return;
    }
    try {
      await pc.addIceCandidate(new RTCIceCandidate(message.candidate));
    } catch (e) {
      console.log("handleCandidate error:", e);
    }
  }

  async function hangup() {
    if (pc) {
      pc.close();
      pc = null;
    }
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      localStream = null;
    }
    setRemoteStream(null);
  }

  async function chatMessage(m) {
    console.log("chatMessage", m);
    messageStreak({
      sender: "user",
      message: m,
    });
    socket.emit("chat", m);
  }

  const startB = async () => {
    try {
      localStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: true,
      });
      localVideo.current.srcObject = localStream;

      hangupButton.current.disabled = false;
      muteAudButton.current.disabled = false;

      if (meetingId) {
        socket.emit("joinMeeting", { meetingId: meetingId });
      } else {
        hangupButton.current.disabled = true;
        muteAudButton.current.disabled = true;
        nav("/");
      }
    } catch (err) {
      console.log("startB error:", err);
    }
  };

  const hangB = async () => {
    hangup();
    socket.emit("leaveMeeting");

    hangupButton.current.disabled = true;
    muteAudButton.current.disabled = true;
    setMeetingId(null);
  };

  function muteAudio() {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setAudio(audioTrack.enabled);
      }
    }
  }

  useEffect(() => {
    startB();
  }, [meetingId, remoteStream]);

  useEffect(() => {
    console.log("====================================");
    console.log(remoteStream);
    console.log("====================================");
    if (remoteVideo.current && remoteStream) {
      remoteVideo.current.srcObject = remoteStream;
      startB();
    }
  }, [remoteStream]);

  const handleShare = () => {
    // copy to clipboard
    if (!meetingId) {
      alert("No meeting id found");
      return;
    }
    navigator.clipboard.writeText(meetingId);
    setCopyStatus(true);
    setTimeout(() => {
      setCopyStatus(false);
    }, 3000);
  };

  return (
    <>
      <div className="bg-body w-full h-screen p-10 flex">
        <main className="container flex-1 min-w-full h-full rounded-lg bg-slate-100">
          <div className="video bg-main flex flex-col md:flex-row gap-2 w-full overflow-hidden ">
            <video
              ref={localVideo}
              className="video-item flex-1 shrink w-full md:w-1/2 rounded-lg flex justify-center items-center"
              autoPlay
              playsInline
            ></video>
            {remoteStream ? (
              <video
                ref={remoteVideo}
                className="video-item flex-1 shrink w-full md:w-1/2 rounded-lg flex justify-center items-center"
                autoPlay
                playsInline
              ></video>
            ) : (
              <div className="video-item flex-1 shrink w-full md:w-1/2 rounded-lg flex justify-center items-center bg-slate-200 text-black">
                Waiting for someone to join...
              </div>
            )}
          </div>

          <div className="btn w-full flex gap-4 justify-center items-center m-10">
            <button
              className="btn-item btn-end bg-blue-300 rounded-full p-4"
              ref={muteAudButton}
              onClick={muteAudio}
            >
              {audiostate ? <FiMic /> : <FiMicOff />}
            </button>
            <button
              className="btn-item btn-end bg-red-300 rounded-full p-4"
              ref={hangupButton}
              onClick={hangB}
            >
              <PiPhoneDisconnectBold />
            </button>
            <button
              className="btn-item btn-end bg-blue-300 rounded-full p-4"
              onClick={handleShare}
            >
              {copyStatus ? <MdDownloadDone /> : <FaRegShareFromSquare />}
            </button>
            <Chat chatMessage={chatMessage} />
          </div>
        </main>
      </div>
    </>
  );
}

export default App;
