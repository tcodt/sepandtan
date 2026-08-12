"use client";

import { useEffect, useRef, useState, startTransition } from "react";
import { Brain } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { ChatMessage, type ChatMessageType } from "./chat-message";
import { ChatInput } from "./chat-input";
import { QuickPrompts } from "./quick-prompts";

const fakeReplies: Record<string, string> = {
  default:
    "سوالت رو متوجه شدم. برای جواب دقیق‌تر بگو هدف‌ت چیه: کاهش وزن، افزایش عضله یا تناسب عمومی؟",
  "برنامه تمرینی بده":
    "عالی! برای ساخت برنامه بگو:\n\n۱. چند روز در هفته تمرین می‌کنی؟\n۲. خانه یا باشگاه؟\n۳. هدف اصلیت چیه؟\n\nاگر آنبوردینگ را کامل کردی، از داشبورد هم می‌تونی برنامه کامل بگیری.",
  "رژیم غذایی پیشنهادی":
    "برای رژیم شخصی، کالری هدف و ترجیحات غذایی مهمه.\n\nچارچوب کلی:\n• پروتئین در هر وعده\n• سبزیجات کافی\n• کربوهیدرات اطراف تمرین\n• آب زیاد\n\nوزنت و هدفت را بگو تا دقیق‌تر بگم.",
  "چطور وزن کم کنم؟":
    "کاهش وزن پایدار = کسری کالری ملایم + تمرین + خواب.\n\nپیشنهاد:\n۱. هفته‌ای ۳–۴ جلسه قدرتی\n۲. ۲ جلسه کاردی سبک\n۳. یک هفته ثبت وعده‌ها\n\nاگر بخوای پلن ۷ روزه برات می‌چینم.",
  "تمرین خانگی بدون تجهیزات":
    "جلسه ۳۰ دقیقه‌ای بدون وسیله:\n\n• اسکوات — ۳×۱۵\n• شنا — ۳×۱۰\n• لانگز معکوس — ۳×۱۰ هر پا\n• پلانک — ۳×۴۰ ثانیه\n• کوهنورد — ۳×۳۰ ثانیه\n\nاستراحت بین ست‌ها ۶۰ ثانیه.",
  "تقویت میان‌تنه":
    "ترکیب پیشنهادی:\n\n• پلانک جلو\n• پلانک پهلو\n• Dead Bug\n• Bird Dog\n\n۳ جلسه در هفته، هر حرکت ۳ ست. اگر کمر درد گرفت فرم را اصلاح کن.",
};

function getFakeReply(input: string) {
  const key = Object.keys(fakeReplies).find(
    (k) => k !== "default" && input.includes(k),
  );
  return key ? fakeReplies[key] : fakeReplies.default;
}

const welcomeMessage: ChatMessageType = {
  id: "welcome",
  role: "assistant",
  content:
    "سلام! من مربی هوشمند سپندتن هستم 💪\n\nمی‌تونم کمک کنم برای:\n• برنامه تمرینی\n• تغذیه\n• کاهش وزن\n• تمرین خانگی\n\nاز کجا شروع کنیم؟",
  time: "الان",
};

type AiChatProps = {
  chatId: string | null;
};

export function AiChat({ chatId }: AiChatProps) {
  const [messages, setMessages] = useState<ChatMessageType[]>([welcomeMessage]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // وقتی چت جدید انتخاب می‌شود، پیام‌ها ریست شوند (Mock)
  useEffect(() => {
    // Avoid calling setState synchronously inside effect to prevent cascading renders
    startTransition(() => {
      setMessages([welcomeMessage]);
      setInput("");
      setIsTyping(false);
    });
  }, [chatId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isTyping) return;

    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        role: "user",
        content: trimmed,
        time: "الان",
      },
    ]);
    setInput("");
    setIsTyping(true);

    await new Promise((r) => setTimeout(r, 800 + Math.random() * 700));

    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        role: "assistant",
        content: getFakeReply(trimmed),
        time: "الان",
      },
    ]);
    setIsTyping(false);
  };

  const showWelcome = messages.length <= 1;

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Top bar */}
      <div className="h-14 shrink-0 border-b border-border bg-card/60 backdrop-blur-sm flex items-center justify-between px-3 sm:px-4">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Brain className="w-4 h-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">
              مربی هوشمند سپندتن
            </p>
            <p className="text-[11px] text-muted-foreground">آنلاین</p>
          </div>
        </div>
        <Badge variant="secondary" className="text-[10px] shrink-0">
          آزمایشی
        </Badge>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="mx-auto w-full max-w-3xl px-3 sm:px-4 py-4 sm:py-6 space-y-4">
          {showWelcome && (
            <div className="text-center space-y-4 pb-2">
              <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Brain className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-bold text-foreground">
                  مربی شخصی هوشمند تو
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  سوال بپرس یا از پیشنهادهای زیر شروع کن
                </p>
              </div>
              <QuickPrompts
                onSelect={(t) => sendMessage(t)}
                disabled={isTyping}
              />
            </div>
          )}

          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))}

          {isTyping && (
            <div className="flex gap-2.5">
              <div className="h-8 w-8 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                <Brain className="h-4 w-4 text-primary" />
              </div>
              <div className="rounded-2xl rounded-tr-md bg-muted px-4 py-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:0ms]" />
                  <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:150ms]" />
                  <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="shrink-0 border-t border-border bg-card/80 backdrop-blur-sm p-3 sm:p-4 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto w-full max-w-3xl space-y-2.5">
          {!showWelcome && (
            <QuickPrompts
              onSelect={(t) => sendMessage(t)}
              disabled={isTyping}
            />
          )}
          <ChatInput
            value={input}
            onChange={setInput}
            onSubmit={() => sendMessage(input)}
            disabled={isTyping}
          />
          <p className="text-[10px] text-center text-muted-foreground">
            پاسخ‌ها آزمایشی‌اند و جایگزین مربی متخصص نیستند
          </p>
        </div>
      </div>
    </div>
  );
}
