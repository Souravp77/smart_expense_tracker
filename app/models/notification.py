from dataclasses import dataclass
from typing import Optional

@dataclass
class Notification:
    notification_id: int
    user_id: int
    type: str
    title: str
    message: str
    link: Optional[str] = None
    is_read: bool = False
    created_at: Optional[str] = None

    def to_dict(self):
        return {
            'id': self.notification_id,
            'type': self.type,
            'title': self.title,
            'message': self.message,
            'link': self.link,
            'is_read': self.is_read,
            'created_at': self.created_at
        }
