"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { MailIcon, PhoneCallIcon } from "lucide-react";

export function ContactInput() {
  const [contactType, setContactType] = useState<"phone" | "email">("phone");

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-200">
        روش ارتباطی
      </label>
      <Tabs
        defaultValue="phone"
        className="w-full"
        onValueChange={(val) => setContactType(val as "phone" | "email")}
      >
        <TabsList className="grid w-full grid-cols-2 bg-white/10 text-white border border-white/10 mb-3">
          <TabsTrigger
            value="phone"
            className="data-[state=active]:bg-white/20"
          >
            <PhoneCallIcon className="w-4 h-4 ml-2" />
            تلفن همراه
          </TabsTrigger>
          <TabsTrigger
            value="email"
            className="data-[state=active]:bg-white/20"
          >
            <MailIcon className="w-4 h-4 ml-2" />
            ایمیل
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <Input
        name={contactType}
        type={contactType === "phone" ? "tel" : "email"}
        placeholder={
          contactType === "phone" ? "09xx xxx xxxx" : "example@mail.com"
        }
        className="bg-white/10 border-white/10 text-white placeholder:text-slate-400 focus:bg-white/20 transition-all"
        required
      />
    </div>
  );
}
