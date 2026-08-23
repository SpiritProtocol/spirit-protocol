import { Link } from "react-router-dom";
import type { TransactionDto } from "@spirit/shared";
import { TransactionStatusBadge } from "../TransactionStatusBadge";
import { currencyFormat, dateFormat } from "../../lib/format";

export function AdminTransactionRow({ transaction }: { transaction: TransactionDto }) {
  return (
    <li className="rounded-xl border border-neutral-200 p-3">
      <div className="flex items-center justify-between gap-2">
        <TransactionStatusBadge status={transaction.status} />
        <span className="text-xs text-neutral-400">{dateFormat.format(new Date(transaction.createdAt))}</span>
      </div>
      <div className="mt-2 flex items-center justify-between gap-2">
        <p className="text-sm text-neutral-500">
          <span className="font-medium text-neutral-900">{transaction.seller.displayName}</span> →{" "}
          <span className="font-medium text-neutral-900">{transaction.buyer.displayName}</span>
        </p>
        <span className="font-semibold">{currencyFormat.format(transaction.amount)}</span>
      </div>
      <Link to={`/artworks/${transaction.artworkId}`} className="mt-1 inline-block text-xs text-sky-600 hover:underline">
        View artwork →
      </Link>
    </li>
  );
}
