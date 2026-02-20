# from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime
# from sqlalchemy.ext.declarative import declarative_base
# from sqlalchemy.orm import sessionmaker
# from datetime import datetime

# Base = declarative_base()

# class Agent(Base):
#     __tablename__ = "agents"
    
#     id = Column(Integer, primary_key=True)
#     name = Column(String(100))
#     role = Column(String(200))
#     instructions = Column(Text)
#     model = Column(String(50), default="claude-sonnet-4-20250514")
#     created_at = Column(DateTime, default=datetime.utcnow)

# class Message(Base):
#     __tablename__ = "messages"
    
#     id = Column(Integer, primary_key=True)
#     agent_id = Column(Integer)
#     role = Column(String(20))  # user or assistant
#     content = Column(Text)
#     created_at = Column(DateTime, default=datetime.utcnow)

# # Create database
# engine = create_engine('sqlite:///agents.db')
# Base.metadata.create_all(engine)

# SessionLocal = sessionmaker(bind=engine)


from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime

Base = declarative_base()

# ── User Table ─────────────────────────────────
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    email = Column(String(150), unique=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    agents = relationship("Agent", back_populates="owner")


# ── Agent Table ────────────────────────────────
class Agent(Base):
    __tablename__ = "agents"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))  # 🔑 owner
    name = Column(String(100))
    role = Column(String(200))
    instructions = Column(Text)
    model = Column(String(50), default="claude-sonnet-4-20250514")
    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User", back_populates="agents")


# ── Messages Table ─────────────────────────────
class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True)
    agent_id = Column(Integer)
    role = Column(String(20))
    content = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)


engine = create_engine("sqlite:///agents.db")
Base.metadata.create_all(engine)

SessionLocal = sessionmaker(bind=engine)
