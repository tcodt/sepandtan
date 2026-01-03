"use client";

import Image from "next/image";
import { Button } from "../ui/button";
import { BotIcon, BrainCircuitIcon, HeartPulseIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { motion } from "framer-motion";
import Threads from "../Threads";

export default function HeroSection() {
  return (
    <section className="flex flex-col gap-8 md:gap-20 md:flex-row items-center justify-between relative overflow-hidden bg-muted p-8 md:p-16 z-10">
      <div className="absolute -top-32 md:top-0 left-0 w-full h-screen -z-10">
        <Threads
          color={[1, 0.47058823529411764, 0.16862745098039217]}
          amplitude={1.8}
          distance={0.3}
          enableMouseInteraction={false}
        />
      </div>
      <div className="space-y-4 text-center md:text-start relative">
        <div className="absolute -top-20 right-0 py-1 px-3 bg-primary/10 rounded-full border border-primary/40 hidden md:block">
          <span className="text-xs text-primary font-semibold flex items-center gap-1">
            <BrainCircuitIcon /> قدرت گرفته از هوش مصنوعی
          </span>
        </div>
        <h1 className="text-3xl md:text-5xl font-extrabold text-foreground leading-tight">
          سپندتن
          <span className="block text-primary">مربی شخصی هوشمند تو</span>
        </h1>
        <p className="text-xs md:text-base text-muted-foreground">
          برنامه تمرینی شخصی‌سازی‌شده با هوش مصنوعی ورزش در خانه یا باشگاه +
          رژیم واقعی ۳۰ روز تا بدنی قوی‌تر و سالم‌تر
        </p>
        <div className="*:data-[slot=avatar]:ring-background flex -space-x-2 *:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:grayscale">
          <Avatar>
            <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
          <Avatar>
            <AvatarImage
              src="https://github.com/maxleiter.png"
              alt="@maxleiter"
            />
            <AvatarFallback>LR</AvatarFallback>
          </Avatar>
          <Avatar>
            <AvatarImage
              src="https://github.com/evilrabbit.png"
              alt="@evilrabbit"
            />
            <AvatarFallback>ER</AvatarFallback>
          </Avatar>
          <p className="text-xs md:text-sm text-foreground self-center mr-4">
            تائید شده توسط{" "}
            <span className="text-primary font-semibold">10</span> هزار ورزشکار
          </p>
        </div>
        <div className="flex items-center justify-center md:justify-start gap-4 my-8">
          <Button
            variant={"default"}
            className="rounded-full shadow-lg"
            size={"lg"}
          >
            شروع رایگان
          </Button>
          <Button
            variant={"outline"}
            className="rounded-full shadow-lg"
            size={"lg"}
          >
            برنامه شخصی
            <BotIcon />
          </Button>
        </div>
      </div>
      <motion.div
        animate={{ y: [0, -20, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="relative overflow-hidden rounded-2xl shadow-lg"
      >
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-4 left-4 bg-popover py-1 px-3 md:py-2 md:px-4 rounded-2xl shadow-md flex items-center gap-2"
        >
          <div className="p-1 md:p-2 rounded-full bg-green-100 flex items-center justify-center shadow-lg">
            <HeartPulseIcon className="text-green-500" />
          </div>{" "}
          <span className="text-xs text-foreground">ضربان قلب 128 bpm</span>
        </motion.div>
        <Image
          src="/images/man.png"
          alt="Hero Section Image"
          className="object-contain rounded-2xl border border-border"
          width={600}
          height={600}
        />
      </motion.div>
    </section>
  );
}
