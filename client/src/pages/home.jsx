import { FiCalendar } from "react-icons/fi";
import { socket } from "../App";
import { useState } from "react";
import { IoIosAddCircle } from "react-icons/io";
import { MdPassword } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import { useStore } from "../store";

const Home = () => {
  const [meetingId, setMeetingId] = useState(null);
  const [inputMeetingId, setInputMeetingId] = useState("");
  const nav = useNavigate();

  const createMeetingIdContext = useStore((state) => state.setMeetingId);

  const scheduleMeeting = () => {
    const newMeetingId = Math.random().toString(36).substring(7);
    setMeetingId(newMeetingId);
    socket.emit("scheduleMeeting", { meetingId: newMeetingId });
    createMeetingIdContext(newMeetingId);
    nav(`/meeting/${newMeetingId}`);
  };

  return (
    <div className="home-wrapper w-full h-screen p-6 flex  flex-col-reverse sm:flex-row gap-9 justify-center items-center">
      <div className="home flex-1 flex flex-col justify-center items-center">
        <h1 className="text-4xl mb-3">WebRTC Video Call</h1>
        <div className="join flex flex-col gap-2 ">
          <button
            className="btn-schedule w-fit flex justify-center items-center gap-2 bg-emerald-300 rounded-full p-2"
            onClick={scheduleMeeting}
          >
            <IoIosAddCircle />
            Create New Meeting
          </button>
          <span>------------OR------------</span>
          <div
            className="join-btn w-fit flex justify-center items-center gap-2 bg-sky-300 rounded-full p-2"
            onClick={() => {}}
          >
            <MdPassword />

            <input
              type="text"
              placeholder="Enter Code To Join"
              onChange={(e) => setInputMeetingId(e.target.value)}
            />
          </div>
          <button
            className="w-fit flex justify-start items-center gap-2 rounded-lg p-2 hover:text-sky-400 hover:bg-sky-50 cursor-pointer "
            onClick={() => {
              createMeetingIdContext(inputMeetingId);
              nav(`/meeting/${inputMeetingId}`);
            }}
            disabled={!inputMeetingId}
          >
            Join
          </button>
        </div>
      </div>
      <div className="home-decor flex-1 rounded-xl overflow-hidden ">
        <img
          src="https://cdn.dribbble.com/users/1673573/screenshots/17948067/media/2e4e13c5daac51bde82a0f291029a4d4.png?resize=1600x1200&vertical=center"
          alt="decor"
          className="w-full h-full object-cover"
        />
      </div>
    </div>
  );
};

export default Home;
