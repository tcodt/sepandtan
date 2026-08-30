"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Bot, User, Clock } from "lucide-react";

export type ChatMessageType = {
  id: string;
  role: "user" | "assistant";
  content: string;
  time?: string;
};

type ChatMessageProps = {
  message: ChatMessageType;
};

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "flex gap-2.5 sm:gap-3 w-full animate-in fade-in-0 slide-in-from-bottom-2 duration-300",
        isUser ? "flex-row-reverse" : "flex-row",
      )}
    >
      <Avatar className="h-8 w-8 shrink-0 mt-0.5">
        <AvatarFallback
          className={cn(
            isUser
              ? "bg-primary text-primary-foreground"
              : "bg-primary/15 text-primary",
          )}
        >
          {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
        </AvatarFallback>
      </Avatar>

      <div
        dir="rtl"
        className={cn(
          "max-w-[85%] sm:max-w-[75%] rounded-2xl px-3.5 py-2.5 text-sm leading-7 shadow-sm",
          isUser
            ? "bg-primary text-primary-foreground rounded-tr-md"
            : "bg-muted text-foreground rounded-tl-md",
        )}
      >
        <p className="whitespace-pre-wrap text-right">{message.content}</p>
        {message.time && (
          <p
            className={cn(
              "text-[10px] mt-1.5 flex items-center gap-1",
              isUser ? "text-primary-foreground/70" : "text-muted-foreground",
            )}
          >
            <Clock className="w-3 h-3" />
            {message.time}
          </p>
        )}
      </div>
    </div>
  );
}
