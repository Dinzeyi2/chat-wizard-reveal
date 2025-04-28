import React from "react";
import { SidebarItem } from "@/types/chat";

const sidebarItems: SidebarItem[] = [
  { id: "chatgpt", name: "ChatGPT", icon: "💬", selected: true },
  { id: "sora", name: "Sora", icon: "🌊" },
  { id: "pall-e", name: "PALL-E", icon: "🤖" },
  { id: "edom", name: "EDOM.AI", icon: "🌐" },
  { id: "youtube", name: "Youtube title", icon: "🎥" },
  { id: "articlas", name: "ARTICLAS", icon: "📑" },
  { id: "leads", name: "LEADS AI", icon: "💼" },
  { id: "nikola", name: "Nikola Tesla Reborn", icon: "⚡" },
  { id: "flirt", name: "Flirt Helper", icon: "❤️" },
];

const recentChats = [
  { id: "web", name: "WebContainer API in Lovable" },
  { id: "affordable", name: "Affordable Claude Usage Tips" },
  { id: "overview", name: "Lovable.dev Overview" },
];

const Sidebar = () => {
  return (
    <div className="w-64 h-full bg-gray-50 border-r flex flex-col">
      <div className="p-3 flex">
        <button className="p-2 hover:bg-gray-200 rounded-md mr-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
          </svg>
        </button>
        <button className="p-2 hover:bg-gray-200 rounded-md mr-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        </button>
        <button className="p-2 hover:bg-gray-200 rounded-md">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 19l7-7 3 3-7 7-3-3z" />
            <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
            <path d="M2 2l7.586 7.586" />
            <circle cx="11" cy="11" r="2" />
          </svg>
        </button>
      </div>

      <div className="">
        <div className="px-3 py-2">
          {sidebarItems.map((item) => (
            <div key={item.id} className={`flex items-center px-3 py-2 my-1 rounded-md cursor-pointer ${item.selected ? "bg-gray-200" : "hover:bg-gray-200"}`}>
              <span className="w-5 h-5 flex items-center justify-center text-sm mr-3">{item.icon}</span>
              <span className="text-sm">{item.name}</span>
            </div>
          ))}

          <div className="flex items-center px-3 py-2 my-1 rounded-md cursor-pointer hover:bg-gray-200">
            <span className="w-5 h-5 flex items-center justify-center text-sm mr-3">⋯</span>
            <span className="text-sm">2 more</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>

          <div className="flex items-center px-3 py-2 my-1 rounded-md cursor-pointer hover:bg-gray-200">
            <span className="w-5 h-5 flex items-center justify-center text-sm mr-3">🧭</span>
            <span className="text-sm">Explore GPTs</span>
          </div>

          <div className="flex items-center px-3 py-2 my-1 rounded-md cursor-pointer hover:bg-gray-200">
            <span className="w-5 h-5 flex items-center justify-center text-sm mr-3">📚</span>
            <span className="text-sm">Library</span>
            <span className="ml-auto text-xs text-gray-500">5</span>
          </div>
        </div>

        <div className="mt-4 px-3">
          <div className="text-xs text-gray-500 font-medium px-3 py-1">Yesterday</div>
          {recentChats.map((chat) => (
            <div key={chat.id} className="px-3 py-2 my-1 rounded-md cursor-pointer text-sm hover:bg-gray-200">
              {chat.name}
            </div>
          ))}
        </div>

        <div className="mt-4 px-3">
          <div className="text-xs text-gray-500 font-medium px-3 py-1">Previous 7 Days</div>
          {recentChats.map((chat) => (
            <div key={chat.id} className="px-3 py-2 my-1 rounded-md cursor-pointer text-sm hover:bg-gray-200">
              {chat.name}
            </div>
          ))}
        </div>

        <div className="mt-4 px-3 mb-4">
          <div className="flex items-center px-3 py-2 my-1 rounded-md cursor-pointer hover:bg-gray-200">
            <span className="w-5 h-5 flex items-center justify-center text-sm mr-3">⭐</span>
            <span className="text-sm">Renew Plus</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
