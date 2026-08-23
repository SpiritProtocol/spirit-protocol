import { Nfc, Wifi } from "lucide-react";
import { ScreenHeader } from "../components/ScreenHeader";
import { PlaceholderScreen } from "../components/PlaceholderScreen";

export function ProfilePage() {
  return (
    <div className="pb-4">
      <ScreenHeader title="Profile" />
      <PlaceholderScreen
        icon={Nfc}
        eyebrow="Physical Authentication"
        title="NFC Scanner Controls"
        description="Tap a physical artifact's chip to verify authenticity and sync it to your collection."
        action={
          <button
            type="button"
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-neutral-200 py-3.5 text-[13px] font-medium tracking-[0.05em] active:bg-neutral-50"
          >
            <Wifi size={14} strokeWidth={2} />
            [ Scan NFC Tag ]
          </button>
        }
      />
    </div>
  );
}
