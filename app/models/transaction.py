from datetime import date
from decimal import Decimal
from dataclasses import dataclass
from typing import Optional

@dataclass
class Transaction:
    transaction_id: int
    user_id: int
    type: str  # 'income' or 'expense'
    amount: Decimal
    category: str
    date: date
    description: Optional[str] = None
    method: str = 'Cash'
    created_at: Optional[date] = None

    def to_dict(self):
        return {
            'id': self.transaction_id,
            'type': self.type,
            'amount': float(self.amount),
            'category': self.category,
            'description': self.description,
            'date': self.date.isoformat(),
            'method': self.method,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
