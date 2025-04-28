
export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface SidebarItem {
  id: string;
  name: string;
  icon: string;
  selected?: boolean;
}

export interface ActionButton {
  id: string;
  label: string;
  icon: string;
}
