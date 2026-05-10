from datetime import datetime
from typing import Optional
from beanie import Document, PydanticObjectId
from pydantic import Field

class Report(Document):
    case_id: PydanticObjectId
    title: str
    report_type: str = "legal"  # legal | evidence | timeline | risk | autopsy | graph
    content: str = ""
    pages: int = 0
    status: str = "generating"  # generating | complete | failed
    created_at: datetime = Field(default_factory=datetime.utcnow)
    created_by: Optional[PydanticObjectId] = None

    class Settings:
        name = "reports"
