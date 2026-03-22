from decimal import Decimal
from dataclasses import dataclass
from typing import Optional

@dataclass
class SavingsGoal:
    goal_id: int
    user_id: int
    name: str
    target_amount: Decimal
    current_amount: Decimal
    target_date: Optional[str] = None
    created_at: Optional[str] = None

    def to_dict(self):
        return {
            'id': self.goal_id,
            'name': self.name,
            'target_amount': float(self.target_amount),
            'current_amount': float(self.current_amount),
            'target_date': self.target_date,
            'created_at': self.created_at
        }
