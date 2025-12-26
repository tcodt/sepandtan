import { ModeToggle } from "@/components/common/mode-toggle";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div>
      <h1 className="text-gray-800 text-3xl font-bold">سلام دنیا</h1>
      <Button>Hey</Button>
      <ModeToggle />
    </div>
  );
}
