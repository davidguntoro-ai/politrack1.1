import os
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, ForeignKey, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from datetime import datetime
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("politrack-db")

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./politrack.db")

if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    engine = create_engine(DATABASE_URL, pool_pre_ping=True)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


# 1. User Model (Admin / Campaign Staff)
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=True)
    phone = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, default="Admin")
    status = Column(String, default="Active")
    photo_url = Column(String, nullable=True)
    tenant_id = Column(String, index=True, default="tenant_1")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


# 2. Survey Model (4-Pillar Data)
class Survey(Base):
    __tablename__ = "surveys"

    id = Column(Integer, primary_key=True, index=True)
    voter_id = Column(String, index=True, nullable=True)
    voter_name = Column(String, index=True)
    voter_nik = Column(String, index=True, nullable=True)
    volunteer_name = Column(String, index=True)
    loyalty_score = Column(Integer)
    sentiment_score = Column(Integer)
    support_status = Column(String)
    awareness = Column(String, nullable=True)
    program_rating = Column(Integer, nullable=True)
    issues = Column(JSON, nullable=True)
    swing_reason = Column(String, nullable=True)
    note = Column(String, nullable=True)
    photo_url = Column(String, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    accuracy = Column(Float, nullable=True)
    is_mock_location = Column(Integer, default=0)
    pekerjaan = Column(String, nullable=True)
    issue_tag = Column(String, nullable=True)
    voter_status = Column(String, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    tenant_id = Column(String, index=True, default="tenant_1")


# 3. Incident Model (Emergency Reporting)
class Incident(Base):
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True)
    category = Column(String)
    description = Column(String)
    location = Column(JSON)
    status = Column(String, default="NEW")
    digital_signature = Column(String)
    evidence_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    tenant_id = Column(String, index=True)


# 4. TPS Result Model (Real-time Count)
class TpsResult(Base):
    __tablename__ = "tps_results"

    id = Column(Integer, primary_key=True, index=True)
    tps_id = Column(String, index=True)
    candidate_votes = Column(Integer)
    total_votes = Column(Integer)
    voter_turnout_percent = Column(Float)
    reported_at = Column(DateTime, default=datetime.utcnow)
    tenant_id = Column(String, index=True)


# 5. Voter Model (Bulk Upload Target)
class Voter(Base):
    __tablename__ = "voters"

    id = Column(Integer, primary_key=True, index=True)
    nik = Column(String(16), unique=True, index=True, nullable=False)
    name = Column(String, index=True)
    address = Column(String, nullable=True)
    kecamatan = Column(String, nullable=True)
    kelurahan = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    pekerjaan = Column(String, nullable=True)
    status = Column(String, default="Unvisited")
    created_at = Column(DateTime, default=datetime.utcnow)
    tenant_id = Column(String, index=True)


# 6. Upload Log Model (Bulk Upload History)
class UploadLog(Base):
    __tablename__ = "upload_logs"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String)
    total_rows = Column(Integer)
    success_count = Column(Integer)
    failed_count = Column(Integer)
    errors = Column(JSON)
    status = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    tenant_id = Column(String, index=True)


# 7. Activity Log Model (Audit Trail)
class Log(Base):
    __tablename__ = "logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=True)
    action = Column(String)
    detail = Column(String, nullable=True)
    ip_address = Column(String, nullable=True)
    tenant_id = Column(String, index=True, default="tenant_1")
    created_at = Column(DateTime, default=datetime.utcnow)


def init_db():
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created successfully.")
    except Exception as e:
        logger.error(f"Error creating database tables: {e}")


def seed_db(db: Session):
    try:
        if db.query(Voter).count() > 0:
            return

        logger.info("Seeding database with sample data...")

        voters = [
            Voter(nik="1234567890123451", name="Budi Santoso", kecamatan="Kecamatan A", kelurahan="Kelurahan 1", pekerjaan="Petani", tenant_id="tenant_1"),
            Voter(nik="1234567890123452", name="Siti Aminah", kecamatan="Kecamatan A", kelurahan="Kelurahan 2", pekerjaan="Pedagang", tenant_id="tenant_1"),
            Voter(nik="1234567890123453", name="Agus Wijaya", kecamatan="Kecamatan B", kelurahan="Kelurahan 3", pekerjaan="ASN", tenant_id="tenant_1"),
            Voter(nik="1234567890123454", name="Rina Kartika", kecamatan="Kecamatan B", kelurahan="Kelurahan 4", pekerjaan="Buruh", tenant_id="tenant_1"),
            Voter(nik="1234567890123455", name="Dewi Lestari", kecamatan="Kecamatan C", kelurahan="Kelurahan 5", pekerjaan="IRT", tenant_id="tenant_1"),
        ]
        db.add_all(voters)
        db.commit()

        surveys = [
            Survey(voter_nik="1234567890123451", voter_name="Budi Santoso", volunteer_name="Relawan 1", loyalty_score=9, sentiment_score=8, support_status="HIJAU", pekerjaan="Petani", tenant_id="tenant_1"),
            Survey(voter_nik="1234567890123452", voter_name="Siti Aminah", volunteer_name="Relawan 1", loyalty_score=5, sentiment_score=6, support_status="KUNING", pekerjaan="Pedagang", tenant_id="tenant_1"),
            Survey(voter_nik="1234567890123453", voter_name="Agus Wijaya", volunteer_name="Relawan 2", loyalty_score=1, sentiment_score=2, support_status="MERAH", pekerjaan="ASN", tenant_id="tenant_1"),
            Survey(voter_nik="1234567890123454", voter_name="Rina Kartika", volunteer_name="Relawan 2", loyalty_score=7, sentiment_score=7, support_status="HIJAU", pekerjaan="Buruh", tenant_id="tenant_1"),
            Survey(voter_nik="1234567890123455", voter_name="Dewi Lestari", volunteer_name="Relawan 3", loyalty_score=4, sentiment_score=5, support_status="KUNING", pekerjaan="IRT", tenant_id="tenant_1"),
        ]
        db.add_all(surveys)
        db.commit()

        logger.info("Database seeded successfully.")
    except Exception as e:
        db.rollback()
        logger.error(f"Error seeding database: {e}")


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
