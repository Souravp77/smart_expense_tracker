from decimal import Decimal
from dataclasses import dataclass
from typing import Optional

@dataclass
class Budget:
    budget_id: int
    user_id: int
    category: str
    amount: Decimal
    month: str  # YYYY-MM
    created_at: Optional[str] = None

    def to_dict(self):
        return {
            'id': self.budget_id,
            'category': self.category,
            'amount': float(self.amount),
            'month': self.month,
            'created_at': self.created_at
        }
