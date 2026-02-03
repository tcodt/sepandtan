import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ItemMedia } from "@/components/ui/item";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  ArrowUpIcon,
  BrainIcon,
  DumbbellIcon,
  HistoryIcon,
  HouseIcon,
  LibraryBigIcon,
  SquarePenIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const quickAccessButtons = [
  {
    id: 1,
    title: " برنامه تمرینی شخصی",
    description: "طراحی برنامه بر اساس اهداف شما",
    imageUrl: "/images/ai-banner-1.jpg",
  },
  {
    id: 2,
    title: "مشاوره تغذیه",
    description: "راهنمایی برای تغذیه صحیح",
    imageUrl: "/images/ai-banner-2.jpg",
  },
  {
    id: 3,
    title: "تمرینات خانگی",
    description: " بدون نیاز به تجهیزات",
    imageUrl: "/images/ai-banner-3.jpg",
  },
  {
    id: 4,
    title: "تراکنش وزن",
    description: "مشاوره کاهش وزن سالم",
    imageUrl: "/images/ai-banner-4.jpg",
  },
];

export default async function AiPage() {
  await new Promise((res) => setTimeout(res, 3000));
  return (
    <div className="h-screen w-screen bg-background flex overflow-hidden">
      <Sidebar dir="rtl" side="right" className="shrink-0">
        <SidebarHeader>
          <div className="flex items-center gap-3 p-2 bg-background border rounded-xl cursor-pointer hover:bg-secondary transition">
            <ItemMedia variant={"default"}>
              <SquarePenIcon className="text-primary" />
            </ItemMedia>

            <div className="text-sm">
              <p className="font-medium">گفتگوی جدید</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-2 bg-background border rounded-xl cursor-pointer hover:bg-secondary transition">
            <ItemMedia variant={"default"}>
              <LibraryBigIcon className="text-primary" />
            </ItemMedia>

            <div className="text-sm">
              <p className="font-medium">دانستنی ها</p>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <div className="px-2 py-2">
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <HistoryIcon className="text-primary" />
                تاریخچه چت‌ها
              </h3>
              <SidebarMenu className="ps-4">
                <SidebarMenuItem className="text-muted-foreground list-disc">
                  برنامه فیتنس شخصی
                </SidebarMenuItem>
                <SidebarMenuItem className="text-muted-foreground list-disc">
                  تغذیه برای ورزشکاران
                </SidebarMenuItem>
                <SidebarMenuItem className="text-muted-foreground list-disc">
                  بهبود سرعت دویدن
                </SidebarMenuItem>
                <SidebarMenuItem className="text-muted-foreground list-disc">
                  تمرینات خانگی بدون تجهیزات
                </SidebarMenuItem>
                <SidebarMenuItem className="text-muted-foreground list-disc">
                  کاهش وزن سالم
                </SidebarMenuItem>
                <SidebarMenuItem className="text-muted-foreground list-disc">
                  عضلات شکم قوی
                </SidebarMenuItem>
                <SidebarMenuItem className="text-muted-foreground list-disc">
                  راهنمای تناسب اندام
                </SidebarMenuItem>
              </SidebarMenu>
            </div>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <div className="flex items-center gap-3 p-2 bg-background border rounded-xl">
            <ItemMedia>
              <Avatar>
                <AvatarImage src="https://github.com/evilrabbit.png" />
                <AvatarFallback>AK</AvatarFallback>
              </Avatar>
            </ItemMedia>

            <div className="text-sm">
              <p className="font-medium">امیر خانجانی</p>
              <p className="text-muted-foreground text-xs">09379646210</p>
            </div>
          </div>
        </SidebarFooter>
      </Sidebar>

      {/* Main Section */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Top Menu */}
        <div className="h-14 border-b bg-sidebar flex items-center px-4 shrink-0 gap-10">
          <Link
            href="/"
            className="p-2 rounded-lg hover:bg-accent/50 transition"
          >
            <HouseIcon />
          </Link>
          <span className="text-lg font-semibold text-primary flex items-center gap-2">
            <BrainIcon size={25} />
            هوش مصنوعی سپندتن
          </span>
        </div>

        {/* Page Content */}
        <div className="flex-1 bg-background overflow-auto p-6">
          <div className="flex flex-col h-full gap-4">
            {/* Welcome Header with Icon */}
            <div className="text-center py-8 mb-4">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-primary/10 rounded-full animate-pulse">
                  <BrainIcon size={40} className="text-primary" />
                </div>
              </div>
              <h2 className="text-2xl font-bold mb-2">خوش آمدید</h2>
              <p className="text-muted-foreground">
                چه کاری می‌توانم برایتان انجام دهم؟
              </p>
            </div>
            {/* Quick Access Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              {quickAccessButtons.map((button) => (
                <div
                  key={button.id}
                  className="group relative overflow-hidden z-10 w-full rounded-lg"
                >
                  <Image
                    src={button.imageUrl}
                    alt={button.title}
                    fill
                    className="absolute inset-0 -z-10 object-cover opacity-70 rounded-lg group-hover:opacity-100 transition duration-150 group-hover:scale-105"
                  />
                  <button className="p-4 border rounded-lg transition text-right relative z-10 w-full">
                    <p className="font-semibold text-sm text-background bg-primary w-2/4 px-1 rounded">
                      {button.title}
                    </p>
                    <p className="text-xs text-muted bg-primary/70 w-2/4 px-1 rounded mt-1">
                      {button.description}
                    </p>
                  </button>
                </div>
              ))}
            </div>

            {/* Chat Box */}
            <div className="flex-1 flex flex-col rounded-lg bg-card">
              {/* Messages Area */}
              <div className="flex-1 overflow-auto p-6">
                {/* Messages would be displayed here */}
              </div>

              {/* Input Area */}
              <div className="pb-6 md:p-6 bg-card">
                <div className="flex flex-col gap-3">
                  <div className=" flex gap-2 justify-end flex-wrap md:border rounded-full py-2 px-4 md:bg-background">
                    <button className="px-3 py-1 border rounded-lg bg-background hover:bg-accent transition text-sm">
                      تمرین
                    </button>
                    <button className="px-3 py-1 border rounded-lg bg-background hover:bg-accent transition text-sm">
                      تغذیه
                    </button>
                    <button className="px-3 py-1 border rounded-lg bg-background hover:bg-accent transition text-sm">
                      وزن
                    </button>
                    <button className="px-3 py-1 border rounded-lg bg-background hover:bg-accent transition text-sm">
                      سرعت
                    </button>
                    <button className="px-3 py-1 border rounded-lg bg-background hover:bg-accent transition text-sm">
                      عضلات
                    </button>
                    <button className="p-2 border rounded-lg bg-background hover:bg-accent transition">
                      <DumbbellIcon size={20} className="text-primary" />
                    </button>
                    <button className="p-2 border rounded-lg bg-background hover:bg-accent transition">
                      <BrainIcon size={20} className="text-primary" />
                    </button>
                  </div>
                  <div className="flex gap-2 relative">
                    <textarea
                      placeholder="پیام خود را بنویسید..."
                      className="flex-1 px-16 py-3 border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary resize-none focus:bg-accent/50 transition-colors"
                      rows={8}
                    />
                    <Button className="absolute top-2 right-2">
                      <ArrowUpIcon size={25} />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
