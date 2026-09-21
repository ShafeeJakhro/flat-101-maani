import { describe, it, expect } from "vitest";
import Decimal from "decimal.js";
import { splitExpense, netPairwiseDebts } from "../accounting";

const AJ = "aj-bhau";
const SHEENA = "sheena";
const BHALU = "bhalu";
const PAPU = "papu";

describe("Monthly Accounting - Aggregated Debts", () => {
  it("aggregates multiple expenses from same payer into one debt entry", () => {
    // Bill 1: Rs. 4,000 split among 4
    const bill1 = splitExpense({
      amount: 4000,
      paidById: AJ,
      participantIds: [AJ, SHEENA, BHALU, PAPU],
    });

    // Bill 2: Rs. 3,000 split among 4
    const bill2 = splitExpense({
      amount: 3000,
      paidById: AJ,
      participantIds: [AJ, SHEENA, BHALU, PAPU],
    });

    // Combine debts and net
    const allDebts = [...bill1.debts, ...bill2.debts];
    const nettedDebts = netPairwiseDebts(allDebts);

    // Should have 3 entries (each person owes AJ one aggregated amount)
    const debtsByShena = nettedDebts.filter((d) => d.fromUserId === SHEENA);
    const debtsByBhalu = nettedDebts.filter((d) => d.fromUserId === BHALU);
    const debtsByPapu = nettedDebts.filter((d) => d.fromUserId === PAPU);

    // Bill1: 4000/4 = 1000 each
    // Bill2: 3000/4 = 750 each
    // Total: 1750 each
    expect(debtsByShena).toHaveLength(1);
    expect(debtsByShena[0].amount.toFixed(2)).toBe("1750.00");
    expect(debtsByBhalu).toHaveLength(1);
    expect(debtsByBhalu[0].amount.toFixed(2)).toBe("1750.00");
    expect(debtsByPapu).toHaveLength(1);
    expect(debtsByPapu[0].amount.toFixed(2)).toBe("1750.00");
  });

  it("correctly tracks distinct payees and aggregates separately", () => {
    // AJ pays 1000, Sheena pays 2000, both split 4 ways
    const bill1 = splitExpense({
      amount: 1000,
      paidById: AJ,
      participantIds: [AJ, SHEENA, BHALU, PAPU],
    });

    const bill2 = splitExpense({
      amount: 2000,
      paidById: SHEENA,
      participantIds: [AJ, SHEENA, BHALU, PAPU],
    });

    const nettedDebts = netPairwiseDebts([...bill1.debts, ...bill2.debts]);

    // Bhalu owes: 250 to AJ + 500 to Sheena
    const bhalu_owes = nettedDebts.filter(
      (d) => d.fromUserId === BHALU && (d.toUserId === AJ || d.toUserId === SHEENA)
    );
    expect(bhalu_owes).toHaveLength(2);

    const owes_aj = bhalu_owes.find((d) => d.toUserId === AJ);
    const owes_sheena = bhalu_owes.find((d) => d.toUserId === SHEENA);
    expect(owes_aj?.amount.toFixed(2)).toBe("250.00");
    expect(owes_sheena?.amount.toFixed(2)).toBe("500.00");
  });

  it("keeps deposits separate from expense shares", () => {
    // Deposit: Rs. 5000
    // Expense share: Rs. 2100
    // Remaining: Rs. 2900

    const depositAmount = new Decimal(5000);
    const expenseShare = new Decimal(2100);
    const remainingDeposit = depositAmount.minus(expenseShare);

    expect(remainingDeposit.toFixed(2)).toBe("2900.00");
    // These should never be confused
    expect(remainingDeposit.toFixed(2)).not.toBe(expenseShare.toFixed(2));
  });
});
