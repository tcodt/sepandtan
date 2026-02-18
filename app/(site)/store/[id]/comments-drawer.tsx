// components/comments-drawer.tsx
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { HeartIcon, MessageCircleIcon, SendHorizontal, X } from "lucide-react";
import { Comment } from "@/lib/products-type";

// Mock comments data
// const mockComments = [
//   {
//     id: 1,
//     user: "علی رضایی",
//     avatar: "/avatars/1.jpg",
//     comment: "محصول عالی بود، کیفیت ساخت خیلی خوبه",
//     time: "۲ ساعت پیش",
//     likes: 5,
//   },
//   {
//     id: 2,
//     user: "سارا محمدی",
//     avatar: "/avatars/2.jpg",
//     comment: "قیمت مناسبی داره نسبت به بقیه فروشگاه‌ها",
//     time: "۵ ساعت پیش",
//     likes: 3,
//   },
//   {
//     id: 3,
//     user: "رضا کریمی",
//     avatar: "/avatars/3.jpg",
//     comment: "بسته‌بندی عالی و ارسال سریع، ممنون از تیم خوبتون",
//     time: "۱ روز پیش",
//     likes: 8,
//   },
//   {
//     id: 4,
//     user: "مریم احمدی",
//     avatar: "/avatars/4.jpg",
//     comment: "رنگ‌بندی خوبی داره، دقیقا همون چیزیه که می‌خواستم",
//     time: "۲ روز پیش",
//     likes: 2,
//   },
//   {
//     id: 5,
//     user: "حسین نوری",
//     avatar: "/avatars/5.jpg",
//     comment: "کیفیتش از انتظارم بهتر بود، پیشنهاد میکنم حتما بخرید",
//     time: "۳ روز پیش",
//     likes: 12,
//   },
// ];

export function CommentsDrawer({
  productComments,
  productName,
}: {
  productComments: Comment[];
  productName: string;
}) {
  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="ghost" className="relative flex items-center gap-2">
          <span className="text-xs md:text-sm">{productComments.length}</span>
          <MessageCircleIcon />
          {/* <span className="absolute -top-1 -right-1 bg-primary text-white text-xs rounded-full w-auto h-4 flex items-center justify-center p-1">
            {mockComments.length}
          </span> */}
        </Button>
      </DrawerTrigger>
      <DrawerContent className="h-[80vh]">
        <DrawerHeader className="border-b">
          <div className="flex items-center justify-between">
            <div>
              <DrawerTitle className="text-right">نظرات کاربران</DrawerTitle>
              <DrawerDescription className="text-right">
                {productName} - {productComments.length} نظر
              </DrawerDescription>
            </div>
            <DrawerClose asChild>
              <Button variant="ghost" size="icon">
                <X className="h-4 w-4" />
              </Button>
            </DrawerClose>
          </div>
        </DrawerHeader>

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {productComments.map((comment) => (
              <div key={comment.id} className="flex gap-3 border-b pb-4">
                <div className="flex-1 text-right">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      {new Date(comment.date).toLocaleDateString("fa-IR")}
                    </span>
                    <span className="font-semibold">{comment.user}</span>
                  </div>
                  <p className="text-sm mt-1">{comment.text}</p>
                  <div className="flex items-center justify-end gap-4 mt-2">
                    <Button variant="ghost" size="sm" className="h-8 px-2">
                      <HeartIcon className="h-4 w-4 ml-1" />
                      <span className="text-xs">{comment.likes}</span>
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8">
                      پاسخ
                    </Button>
                  </div>
                </div>

                <Avatar>
                  <AvatarImage src={comment.user} />
                  <AvatarFallback className="bg-primary text-white ring ring-primary ring-offset-2">
                    {comment.user.slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
              </div>
            ))}
          </div>
        </ScrollArea>

        <DrawerFooter className="border-t p-4">
          <form className="flex gap-2">
            <Input
              placeholder="نظر خود را بنویسید..."
              className="flex-1 text-right"
              dir="rtl"
            />
            <Button type="submit" size="icon">
              <SendHorizontal className="h-4 w-4" />
            </Button>
          </form>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
