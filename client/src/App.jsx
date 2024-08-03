import "./App.css";
import { io } from "socket.io-client";
import { useRef, useEffect, useState } from "react";
import {
  FiVideo,
  FiVideoOff,
  FiMic,
  FiMicOff,
  FiCalendar,
  FiUserPlus,
} from "react-icons/fi";

const configuration = {
  iceServers: [
    {
      urls: ["stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302"],
    },
  ],
  iceCandidatePoolSize: 10,
};

export const socket = io("http://localhost:3001", {
  transports: ["websocket"],
});

let pc;
let localStream;

function App() {
  const startButton = useRef(null);
  const hangupButton = useRef(null);
  const muteAudButton = useRef(null);
  const localVideo = useRef(null);
  const remoteVideo = useRef(null);
  const [audiostate, setAudio] = useState(true);
  const [meetingId, setMeetingId] = useState(null);
  const [inputMeetingId, setInputMeetingId] = useState("");
  const [remoteStream, setRemoteStream] = useState(null);

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

  const startB = async (joinMeetingId = null) => {
    try {
      localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: { echoCancellation: true },
      });
      localVideo.current.srcObject = localStream;

      startButton.current.disabled = true;
      hangupButton.current.disabled = false;
      muteAudButton.current.disabled = false;

      if (joinMeetingId) {
        socket.emit("joinMeeting", { meetingId: joinMeetingId });
      } else if (meetingId) {
        socket.emit("joinMeeting", { meetingId: meetingId });
      } else {
        alert("Please schedule a meeting or enter a meeting ID to join.");
        startButton.current.disabled = false;
        hangupButton.current.disabled = true;
        muteAudButton.current.disabled = true;
      }
    } catch (err) {
      console.log("startB error:", err);
      alert(
        "Failed to access media devices. Please check your camera and microphone permissions."
      );
    }
  };

  const hangB = async () => {
    hangup();
    socket.emit("leaveMeeting");
    startButton.current.disabled = false;
    hangupButton.current.disabled = true;
    muteAudButton.current.disabled = true;
    setMeetingId(null);
    setInputMeetingId("");
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

  const scheduleMeeting = () => {
    const newMeetingId = Math.random().toString(36).substring(7);
    setMeetingId(newMeetingId);
    socket.emit("scheduleMeeting", { meetingId: newMeetingId });
    alert(`Your meeting ID is: ${newMeetingId}`);
  };

  useEffect(() => {
    if (remoteVideo.current && remoteStream) {
      remoteVideo.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  console.log("====================================");
  console.log("remoteStream", remoteStream);
  console.log("====================================");

  return (
    <>
      <div className="bg-body">
        <main className="container">
          <h1 className="heading">WebRTC Video Call</h1>
          <div className="video bg-main">
            <video
              ref={localVideo}
              className="video-item"
              autoPlay
              playsInline
              muted
            ></video>
            <video
              ref={remoteVideo}
              className="video-item"
              autoPlay
              playsInline
            ></video>
          </div>

          <div className="btn">
            <button
              className="btn-item btn-start"
              ref={startButton}
              onClick={() => startB()}
            >
              <FiVideo />
            </button>
            <button
              className="btn-item btn-end"
              ref={hangupButton}
              onClick={hangB}
            >
              <FiVideoOff />
            </button>
            <button
              className="btn-item btn-start"
              ref={muteAudButton}
              onClick={muteAudio}
            >
              {audiostate ? <FiMic /> : <FiMicOff />}
            </button>
            <button className="btn-item btn-schedule" onClick={scheduleMeeting}>
              <FiCalendar /> Schedule Meeting
            </button>
          </div>

          <div className="join-meeting">
            <input
              type="text"
              value={inputMeetingId}
              onChange={(e) => setInputMeetingId(e.target.value)}
              placeholder="Enter Meeting ID"
            />
            <button onClick={() => startB(inputMeetingId)}>
              <FiUserPlus /> Join Meeting
            </button>
          </div>
        </main>
      </div>
    </>
  );
}

export default App;
