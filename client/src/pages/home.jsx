import { socket } from "../App";

const Home = () => {
  //   schedule a meeting
  const scheduleMeeting = async () => {
    const newMeetingId = Math.random().toString(36).substring(7);
    setMeetingId(newMeetingId);
    socket.emit("scheduleMeeting", { meetingId: newMeetingId });
    alert(`Your meeting ID is: ${newMeetingId}`);

    socket.on("scheduleMeeting", ({ meetingId }) => {
      console.log(`Meeting scheduled with ID: ${meetingId}`);
      rooms.set(meetingId, new Set());
    });
  };
  return (
    <div>
      <h1>Home</h1>
      <button onClick={scheduleMeeting}>Schedule Meeting</button>
    </div>
  );
};

export default Home;
