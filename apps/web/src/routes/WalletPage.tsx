import { Wallet as WalletIcon } from "lucide-react";
import { ScreenHeader } from "../components/ScreenHeader";
import { PlaceholderScreen } from "../components/PlaceholderScreen";

export function WalletPage() {
  return (
    <div className="pb-4">
      <ScreenHeader title="Wallet" />
      <PlaceholderScreen
        icon={WalletIcon}
        eyebrow="Connected Wallet"
        title="No Wallet Connected"
        description="Connect a wallet to view your balance and manage vault redemptions."
        action={
          <button
            type="button"
            className="w-full rounded-xl bg-black py-3.5 text-[13px] font-medium tracking-[0.05em] text-white active:opacity-80"
          >
            [ Connect Wallet ]
          </button>
        }
      />
    </div>
  );
}
