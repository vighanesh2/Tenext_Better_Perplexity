export type MessageRole = "user" | "assistant";

export interface Source {
  title: string;
  url: string;
  snippet?: string;
}

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  sources?: Source[];
  isStreaming?: boolean;
  fromCache?: boolean;
}
