# app/crud/crud_waitlist.py
from sqlalchemy.orm import Session
from .. import models, schemas

def add_to_waitlist(db: Session, email: str):
    db_entry = models.waitlist.WaitlistEntry(email=email)
    db.add(db_entry)
    db.commit()
    db.refresh(db_entry)
    return db_entry