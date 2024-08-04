import React, { useEffect } from "react";
import { useStore } from "../store"; // Adjust the path as necessary
import { MdChatBubbleOutline } from "react-icons/md";

const Chat = (props) => {
  const messages = useStore((state) => state.messages);
  const addMessage = useStore((state) => state.addMessage); // Assuming you have an action to add messages to the store

  useEffect(() => {
    const chatbox = document.getElementById("chatbox");
    const chatContainer = document.getElementById("chat-container");
    const userInput = document.getElementById("user-input");
    const sendButton = document.getElementById("send-button");
    const openChatButton = document.getElementById("open-chat");
    const closeChatButton = document.getElementById("close-chat");

    let isChatboxOpen = false;

    function toggleChatbox() {
      chatContainer.classList.toggle("hidden");
      isChatboxOpen = !isChatboxOpen;
    }

    openChatButton.addEventListener("click", toggleChatbox);
    closeChatButton.addEventListener("click", toggleChatbox);

    sendButton.addEventListener("click", sendMessage);
    userInput.addEventListener("keyup", handleKeyUp);

    function sendMessage() {
      const userMessage = userInput.value;
      if (userMessage.trim() !== "") {
        props.chatMessage(userMessage);
        userInput.value = "";
      }
    }

    function handleKeyUp(event) {
      if (event.key === "Enter") {
        sendMessage();
      }
    }

    function respondToUser(userMessage) {
      setTimeout(() => {
        addMessage({
          text: "This is a response from the chatbot.",
          sender: "bot",
        });
      }, 500);
    }

    // Clean up event listeners on component unmount
    return () => {
      openChatButton.removeEventListener("click", toggleChatbox);
      closeChatButton.removeEventListener("click", toggleChatbox);
      sendButton.removeEventListener("click", sendMessage);
      userInput.removeEventListener("keyup", handleKeyUp);
    };
  }, [addMessage]);

  return (
    <>
      <div className="fixed bottom-0 right-0 mb-4 mr-4">
        <button
          id="open-chat"
          className="bg-blue-500 text-white p-4 rounded-full hover:bg-blue-600 transition duration-300 flex items-center"
        >
          <MdChatBubbleOutline />
        </button>
      </div>
      <div id="chat-container" className="hidden fixed bottom-16 right-4 w-96">
        <div className="bg-white shadow-md rounded-lg max-w-lg w-full">
          <div className="p-4 border-b bg-blue-500 text-white rounded-t-lg flex justify-between items-center">
            <p className="text-lg font-semibold">Messages</p>
            <button
              id="close-chat"
              className="text-gray-300 hover:text-gray-400 focus:outline-none focus:text-gray-400"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-6 h-6"
                fill="none"
                viewBox="0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                ></path>
              </svg>
            </button>
          </div>
          <div id="chatbox" className="p-4 h-80 overflow-y-auto">
            {messages.map((msg, index) => (
              <div
                className={`mb-2 ${msg.sender === "user" ? "text-right" : ""}`}
                key={index}
              >
                <p
                  className={`p-2 rounded-lg inline-block ${
                    msg.sender === "user"
                      ? "bg-blue-500 text-white rounded-br-none"
                      : "bg-gray-200 text-black rounded-bl-none"
                  }`}
                >
                  {msg.message}
                </p>
              </div>
            ))}
          </div>
          <div className="p-4 border-t flex">
            <input
              id="user-input"
              type="text"
              placeholder="Type a message"
              className="w-full px-3 py-2 border rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              id="send-button"
              className="bg-blue-500 text-white px-4 py-2 rounded-r-md hover:bg-blue-600 transition duration-300"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Chat;
