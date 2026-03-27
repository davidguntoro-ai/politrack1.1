from fastapi import FastAPI, Depends, HTTPException, Request, Response, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from sqlalchemy import func
import os
import logging
import io
import pandas as pd
import bcrypt
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

# Import Database Layer
from database import get_db, init_db, seed_db, SessionLocal, Survey, Incident, TpsResult, Voter, UploadLog, User, Log

# Configure Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("politrack-api")

# Initialize Database
init_db()

# Seed Database & Auto-create default Admin
with SessionLocal() as db:
    seed_db(db)
    # Auto-Admin Creation: insert default admin if users table is empty
    if db.query(User).count() == 0:
        try:
            default_password = "Admin123(ChangeMe)"
            hashed = bcrypt.hashpw(default_password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
            admin_user = User(
                name="Administrator",
                phone="08123456789",
                password_hash=hashed,
                role="Admin",
                status="Active",
                tenant_id="tenant_1",
            )
            db.add(admin_user)
            db.commit()
            logger.info("Default admin user created: phone=08123456789")
        except Exception as e:
            db.rollback()
            logger.error(f"Failed to create default admin: {e}")

app = FastAPI(title="PoliTrack AI System")

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict to specific domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Pydantic Models for API ---
class SurveyCreate(BaseModel):
    voter_id: Optional[str] = None
    voter_name: str
    voter_nik: Optional[str] = None
    volunteer_name: str
    support_status: str
    awareness: Optional[str] = None
    program_support_rating: Optional[int] = None
    issues: Optional[List[str]] = None
    swing_voter_reason: Optional[str] = None
    note: Optional[str] = None
    photo_base64: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    accuracy: Optional[float] = None
    is_mock_location: Optional[bool] = False
    pekerjaan: Optional[str] = None
    tenant_id: Optional[str] = "tenant_1"

class IncidentReport(BaseModel):
    category: str
    description: str
    location: dict
    digital_signature: str
    evidence_url: Optional[str] = None
    tenant_id: str

class TpsReport(BaseModel):
    tps_id: str
    candidate_votes: int
    total_votes: int
    tenant_id: str

# --- API Endpoints ---

# 0. PIN Verification for War Room
@app.post("/api/war-room/verify-pin")
async def verify_pin(request: Request, db: Session = Depends(get_db)):
    try:
        data = await request.json()
        pin = data.get("pin")
        tenant_id = request.headers.get("x-tenant-id", "tenant_1")
        
        # In a real app, check against tenant.tps_pin
        # For now, mock success for '123456'
        if pin == "123456":
            return {"status": "success"}
        else:
            raise HTTPException(status_code=401, detail="Invalid PIN")
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        logger.error(f"Error verifying PIN: {e}")
        raise HTTPException(status_code=500, detail="Verification failed")

# 1. Survey Data Persistence
@app.post("/api/survey")
async def create_survey(survey: SurveyCreate, db: Session = Depends(get_db)):
    try:
        # Calculate scores for VPI
        loyalty = 5
        if survey.support_status == "HIJAU": loyalty = 9
        elif survey.support_status == "KUNING": loyalty = 5
        elif survey.support_status == "MERAH": loyalty = 1
        
        sentiment = (survey.program_support_rating or 5) * 2

        new_survey = Survey(
            voter_id=survey.voter_id,
            voter_name=survey.voter_name,
            voter_nik=survey.voter_nik,
            volunteer_name=survey.volunteer_name,
            loyalty_score=loyalty,
            sentiment_score=sentiment,
            support_status=survey.support_status,
            awareness=survey.awareness,
            program_rating=survey.program_support_rating,
            issues=survey.issues,
            swing_reason=survey.swing_voter_reason,
            note=survey.note,
            photo_url=survey.photo_base64,
            latitude=survey.latitude,
            longitude=survey.longitude,
            accuracy=survey.accuracy,
            is_mock_location=1 if survey.is_mock_location else 0,
            pekerjaan=survey.pekerjaan,
            tenant_id=survey.tenant_id
        )
        db.add(new_survey)
        db.commit()
        db.refresh(new_survey)
        logger.info(f"Survey created for voter: {survey.voter_name}")
        return {"status": "success", "id": new_survey.id}
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating survey: {e}")
        raise HTTPException(status_code=500, detail="Database error occurred")

# 2. Victory Probability Index (VPI) Calculation
@app.get("/api/analytics/vpi")
async def get_vpi(tenant_id: str = "tenant_1", pekerjaan: Optional[str] = None, db: Session = Depends(get_db)):
    try:
        # 1. Global Stats
        global_query = db.query(
            func.avg(Survey.loyalty_score).label("avg_loyalty"),
            func.avg(Survey.sentiment_score).label("avg_sentiment"),
            func.count(Survey.id).label("total_voters")
        ).filter(Survey.tenant_id == tenant_id)

        if pekerjaan:
            global_query = global_query.filter(Survey.pekerjaan == pekerjaan)

        global_stats = global_query.first()

        # 2. District-wise Stats (Mocking districts for now based on kecamatan if available)
        # In a real app, we'd join with Voter or have a district field
        districts_query = db.query(
            Voter.kecamatan.label("districtName"),
            func.avg(Survey.loyalty_score).label("avg_loyalty"),
            func.avg(Survey.sentiment_score).label("avg_sentiment"),
            func.count(Survey.id).label("total_voters")
        ).join(Survey, Voter.nik == Survey.voter_nik).filter(Survey.tenant_id == tenant_id)

        if pekerjaan:
            districts_query = districts_query.filter(Survey.pekerjaan == pekerjaan)
        
        districts_stats = districts_query.group_by(Voter.kecamatan).all()

        districts_data = []
        for d in districts_stats:
            vpi = ((d.avg_loyalty or 0) + (d.avg_sentiment or 0)) / 2 / 10
            districts_data.append({
                "districtId": d.districtName,
                "districtName": d.districtName,
                "vpi": vpi,
                "status": "Green" if vpi > 0.6 else "Yellow" if vpi > 0.4 else "Red",
                "confidenceLevel": 0.85, # Mock
                "alert": vpi < 0.4
            })

        # Fallback if no districts found
        if not districts_data:
            districts_data = [{
                "districtId": "all",
                "districtName": "All Districts",
                "vpi": ((global_stats.avg_loyalty or 0) + (global_stats.avg_sentiment or 0)) / 2 / 10 if global_stats else 0,
                "status": "Yellow",
                "confidenceLevel": 0.5,
                "alert": False
            }]

        return {
            "vpi": round(((global_stats.avg_loyalty or 0) + (global_stats.avg_sentiment or 0)) / 2 * 10, 2) if global_stats else 0,
            "total_voters": global_stats.total_voters if global_stats else 0,
            "districts": districts_data,
            "status": "Calculated"
        }
    except Exception as e:
        logger.error(f"Error calculating VPI: {e}")
        raise HTTPException(status_code=500, detail="Analytics engine error")

@app.get("/api/voters/jobs")
async def get_voter_jobs(tenant_id: str = "tenant_1", db: Session = Depends(get_db)):
    try:
        jobs = db.query(Voter.pekerjaan).filter(Voter.tenant_id == tenant_id).distinct().all()
        return [j[0] for j in jobs if j[0]]
    except Exception as e:
        logger.error(f"Error fetching jobs: {e}")
        return []

# 2.2 Logistics Map Data (Profession-Based)
PROFESSIONS = ["Petani", "Nelayan", "Pedagang", "Buruh", "IRT", "Mahasiswa", "Wiraswasta", "Guru Swasta", "ASN", "TNI", "POLRI"]
NEUTRAL_PROFESSIONS = ["ASN", "TNI", "POLRI"]

LOGISTICS_RECOMMENDATIONS = {
    "Petani": "Fokus pada isu pertanian: Distribusi pupuk bersubsidi dan bantuan alat mesin pertanian (Alsintan).",
    "Nelayan": "Fokus pada isu kelautan: Bantuan solar bersubsidi dan asuransi nelayan.",
    "Pedagang": "Fokus pada isu ekonomi mikro: Revitalisasi pasar tradisional dan akses modal tanpa bunga.",
    "Buruh": "Fokus pada isu ketenagakerjaan: Advokasi upah layak dan jaminan kesehatan pekerja.",
    "IRT": "Fokus pada isu kesejahteraan keluarga: Program sembako murah dan pelatihan UMKM rumahan.",
    "Mahasiswa": "Fokus pada isu pendidikan: Beasiswa daerah dan penyediaan coworking space gratis.",
    "Wiraswasta": "Fokus pada isu investasi: Kemudahan perizinan usaha dan pameran produk lokal.",
    "Guru Swasta": "Fokus pada isu pendidikan: Peningkatan insentif guru honorer dan sertifikasi mandiri.",
    "ASN": "Netralitas: Pastikan tidak ada mobilisasi politik, fokus pada pelayanan publik.",
    "TNI": "Netralitas: Jaga kondusivitas wilayah dan keamanan tanpa intervensi.",
    "POLRI": "Netralitas: Penegakan hukum yang adil dan pengamanan kampanye."
}

MOCK_DOMINANT_PROFESSION = [
    {"kelurahan": "Kelurahan 1", "dominant_profession": "Petani",   "percentage": 32.5, "total_voters": 1385, "recommendation": LOGISTICS_RECOMMENDATIONS.get("Petani",   "")},
    {"kelurahan": "Kelurahan 2", "dominant_profession": "Pedagang", "percentage": 38.2, "total_voters": 1360, "recommendation": LOGISTICS_RECOMMENDATIONS.get("Pedagang", "")},
    {"kelurahan": "Kelurahan 3", "dominant_profession": "Buruh",    "percentage": 41.5, "total_voters": 1470, "recommendation": LOGISTICS_RECOMMENDATIONS.get("Buruh",    "")},
    {"kelurahan": "Kelurahan 4", "dominant_profession": "ASN",      "percentage": 35.6, "total_voters": 1349, "recommendation": LOGISTICS_RECOMMENDATIONS.get("ASN",      "")},
    {"kelurahan": "Kelurahan 5", "dominant_profession": "Nelayan",  "percentage": 44.8, "total_voters": 1250, "recommendation": LOGISTICS_RECOMMENDATIONS.get("Nelayan",  "")},
]

MOCK_LOGISTICS_MAP = [
    {"kecamatan": "Kelurahan 1", "pekerjaan": "Petani",     "count": 450, "percentage": 32.5},
    {"kecamatan": "Kelurahan 1", "pekerjaan": "Buruh",      "count": 290, "percentage": 21.0},
    {"kecamatan": "Kelurahan 1", "pekerjaan": "IRT",        "count": 210, "percentage": 15.2},
    {"kecamatan": "Kelurahan 1", "pekerjaan": "Pedagang",   "count": 180, "percentage": 13.0},
    {"kecamatan": "Kelurahan 1", "pekerjaan": "Wiraswasta", "count": 255, "percentage": 18.3},
    {"kecamatan": "Kelurahan 2", "pekerjaan": "Pedagang",   "count": 520, "percentage": 38.2},
    {"kecamatan": "Kelurahan 2", "pekerjaan": "Wiraswasta", "count": 340, "percentage": 25.0},
    {"kecamatan": "Kelurahan 2", "pekerjaan": "IRT",        "count": 200, "percentage": 14.7},
    {"kecamatan": "Kelurahan 2", "pekerjaan": "Buruh",      "count": 175, "percentage": 12.9},
    {"kecamatan": "Kelurahan 2", "pekerjaan": "Petani",     "count": 125, "percentage": 9.2 },
    {"kecamatan": "Kelurahan 3", "pekerjaan": "Buruh",      "count": 610, "percentage": 41.5},
    {"kecamatan": "Kelurahan 3", "pekerjaan": "Petani",     "count": 290, "percentage": 19.7},
    {"kecamatan": "Kelurahan 3", "pekerjaan": "Pedagang",   "count": 220, "percentage": 15.0},
    {"kecamatan": "Kelurahan 3", "pekerjaan": "IRT",        "count": 195, "percentage": 13.3},
    {"kecamatan": "Kelurahan 3", "pekerjaan": "Mahasiswa",  "count": 155, "percentage": 10.5},
    {"kecamatan": "Kelurahan 4", "pekerjaan": "ASN",        "count": 480, "percentage": 35.6},
    {"kecamatan": "Kelurahan 4", "pekerjaan": "Guru Swasta","count": 310, "percentage": 23.0},
    {"kecamatan": "Kelurahan 4", "pekerjaan": "Wiraswasta", "count": 240, "percentage": 17.8},
    {"kecamatan": "Kelurahan 4", "pekerjaan": "IRT",        "count": 175, "percentage": 13.0},
    {"kecamatan": "Kelurahan 4", "pekerjaan": "Mahasiswa",  "count": 144, "percentage": 10.6},
    {"kecamatan": "Kelurahan 5", "pekerjaan": "Nelayan",    "count": 560, "percentage": 44.8},
    {"kecamatan": "Kelurahan 5", "pekerjaan": "Petani",     "count": 290, "percentage": 23.2},
    {"kecamatan": "Kelurahan 5", "pekerjaan": "Buruh",      "count": 190, "percentage": 15.2},
    {"kecamatan": "Kelurahan 5", "pekerjaan": "IRT",        "count": 130, "percentage": 10.4},
    {"kecamatan": "Kelurahan 5", "pekerjaan": "Pedagang",   "count":  80, "percentage":  6.4},
]

MOCK_TOP_LOCATIONS = {
    "Petani":     [{"kecamatan": "Kelurahan 1", "count": 450}, {"kecamatan": "Kelurahan 5", "count": 290}, {"kecamatan": "Kelurahan 3", "count": 290}],
    "Pedagang":   [{"kecamatan": "Kelurahan 2", "count": 520}, {"kecamatan": "Kelurahan 3", "count": 220}, {"kecamatan": "Kelurahan 1", "count": 180}],
    "Buruh":      [{"kecamatan": "Kelurahan 3", "count": 610}, {"kecamatan": "Kelurahan 1", "count": 290}, {"kecamatan": "Kelurahan 5", "count": 190}],
    "IRT":        [{"kecamatan": "Kelurahan 1", "count": 210}, {"kecamatan": "Kelurahan 2", "count": 200}, {"kecamatan": "Kelurahan 3", "count": 195}],
    "Wiraswasta": [{"kecamatan": "Kelurahan 2", "count": 340}, {"kecamatan": "Kelurahan 4", "count": 240}, {"kecamatan": "Kelurahan 1", "count": 255}],
    "Mahasiswa":  [{"kecamatan": "Kelurahan 3", "count": 155}, {"kecamatan": "Kelurahan 4", "count": 144}],
    "ASN":        [{"kecamatan": "Kelurahan 4", "count": 480}],
    "Nelayan":    [{"kecamatan": "Kelurahan 5", "count": 560}],
    "Guru Swasta":[{"kecamatan": "Kelurahan 4", "count": 310}],
    "TNI":        [],
    "POLRI":      [],
}

@app.get("/api/analytics/dominant-profession")
async def get_dominant_profession(tenant_id: str = "tenant_1", db: Session = Depends(get_db)):
    try:
        query = db.query(
            Voter.kelurahan,
            Voter.pekerjaan,
            func.count(Voter.id).label("count")
        ).filter(Voter.tenant_id == tenant_id).group_by(Voter.kelurahan, Voter.pekerjaan).all()

        if not query:
            return MOCK_DOMINANT_PROFESSION

        kelurahan_data: dict = {}
        for kel, job, count in query:
            if kel not in kelurahan_data:
                kelurahan_data[kel] = {"top_job": None, "max_count": 0, "total": 0}
            kelurahan_data[kel]["total"] += count
            if count > kelurahan_data[kel]["max_count"]:
                kelurahan_data[kel]["max_count"] = count
                kelurahan_data[kel]["top_job"] = job

        results = []
        for kel, data in kelurahan_data.items():
            top_job = data["top_job"]
            percentage = (data["max_count"] / data["total"]) * 100 if data["total"] else 0
            results.append({
                "kelurahan": kel,
                "dominant_profession": top_job,
                "percentage": round(percentage, 2),
                "recommendation": LOGISTICS_RECOMMENDATIONS.get(top_job, "Fokus pada isu umum kesejahteraan warga."),
                "total_voters": data["total"]
            })

        return results if results else MOCK_DOMINANT_PROFESSION
    except Exception as e:
        logger.error(f"Error calculating dominant profession: {e}")
        return MOCK_DOMINANT_PROFESSION

@app.get("/api/analytics/logistics-map")
async def get_logistics_map(tenant_id: str = "tenant_1", db: Session = Depends(get_db)):
    try:
        total_per_kecamatan = db.query(
            Voter.kecamatan,
            func.count(Voter.id).label("total")
        ).filter(Voter.tenant_id == tenant_id).group_by(Voter.kecamatan).all()

        if not total_per_kecamatan:
            return MOCK_LOGISTICS_MAP

        total_map = {k: t for k, t in total_per_kecamatan}

        voters_by_job = db.query(
            Voter.kecamatan,
            Voter.pekerjaan,
            func.count(Voter.id).label("count")
        ).filter(Voter.tenant_id == tenant_id).group_by(Voter.kecamatan, Voter.pekerjaan).all()

        results = []
        for kec, job, count in voters_by_job:
            total = total_map.get(kec, 1)
            results.append({
                "kecamatan": kec,
                "pekerjaan": job,
                "count": count,
                "percentage": round((count / total) * 100, 2)
            })

        return results if results else MOCK_LOGISTICS_MAP
    except Exception as e:
        logger.error(f"Error calculating logistics map data: {e}")
        return MOCK_LOGISTICS_MAP

@app.get("/api/analytics/top-locations")
async def get_top_locations(tenant_id: str = "tenant_1", db: Session = Depends(get_db)):
    try:
        jobs = db.query(Voter.pekerjaan).filter(Voter.tenant_id == tenant_id).distinct().all()
        jobs_list = [j[0] for j in jobs if j[0]]

        if not jobs_list:
            return MOCK_TOP_LOCATIONS

        top_locations: dict = {}
        for job in jobs_list:
            top_3 = db.query(
                Voter.kecamatan,
                func.count(Voter.id).label("count")
            ).filter(Voter.tenant_id == tenant_id, Voter.pekerjaan == job)\
             .group_by(Voter.kecamatan)\
             .order_by(func.count(Voter.id).desc())\
             .limit(3).all()
            top_locations[job] = [{"kecamatan": k, "count": c} for k, c in top_3]

        return top_locations if top_locations else MOCK_TOP_LOCATIONS
    except Exception as e:
        logger.error(f"Error fetching top locations: {e}")
        return MOCK_TOP_LOCATIONS

# 3. War Room Stats
@app.get("/api/war-room/stats")
async def get_war_room_stats(tenant_id: str = "tenant_1", db: Session = Depends(get_db)):
    try:
        # Aggregate TPS results
        tps_stats = db.query(
            func.sum(TpsResult.candidate_votes).label("candidate_total"),
            func.sum(TpsResult.total_votes).label("grand_total"),
            func.count(TpsResult.id).label("tps_count")
        ).filter(TpsResult.tenant_id == tenant_id).first()

        candidate_total = tps_stats.candidate_total or 0
        grand_total = tps_stats.grand_total or 0
        tps_count = tps_stats.tps_count or 0
        
        others_total = grand_total - candidate_total
        lead_margin = candidate_total - (others_total / 3) # Mock: assume 3 competitors
        lead_percent = (candidate_total / grand_total * 100) if grand_total > 0 else 0
        turnout = 75.5 # Mock turnout for now

        # Mock velocity data (reports per hour)
        velocity = {str(h): 0 for h in range(8, 20)}
        # Real velocity would query created_at grouped by hour
        
        return {
            "totalVotesCandidate": candidate_total,
            "totalVotesOthers": others_total,
            "totalTPS": tps_count,
            "leadMargin": int(lead_margin),
            "leadPercentage": lead_percent,
            "turnoutPercentage": turnout,
            "districtStats": {},
            "velocity": velocity
        }
    except Exception as e:
        logger.error(f"Error fetching War Room stats: {e}")
        raise HTTPException(status_code=500, detail="War Room engine error")

# 4. Incident Stats & Reporting
@app.get("/api/incidents/stats")
async def get_incident_stats(tenant_id: str = "tenant_1", db: Session = Depends(get_db)):
    try:
        incidents = db.query(Incident).filter(Incident.tenant_id == tenant_id).all()
        return [
            {
                "id": inc.id,
                "category": inc.category,
                "description": inc.description,
                "location": inc.location,
                "status": inc.status,
                "createdAt": inc.created_at.isoformat()
            } for inc in incidents
        ]
    except Exception as e:
        logger.error(f"Error fetching incident stats: {e}")
        raise HTTPException(status_code=500, detail="Incident engine error")

@app.post("/api/incidents/report")
async def report_incident(incident: IncidentReport, db: Session = Depends(get_db)):
    try:
        new_incident = Incident(
            category=incident.category,
            description=incident.description,
            location=incident.location,
            digital_signature=incident.digital_signature,
            evidence_url=incident.evidence_url,
            tenant_id=incident.tenant_id
        )
        db.add(new_incident)
        db.commit()
        db.refresh(new_incident)
        return {"status": "success", "id": new_incident.id}
    except Exception as e:
        db.rollback()
        logger.error(f"Error reporting incident: {e}")
        raise HTTPException(status_code=500, detail="Incident reporting failed")

@app.patch("/api/incidents/{incident_id}/status")
async def update_incident_status(incident_id: int, request: Request, db: Session = Depends(get_db)):
    try:
        data = await request.json()
        status = data.get("status")
        incident = db.query(Incident).filter(Incident.id == incident_id).first()
        if not incident:
            raise HTTPException(status_code=404, detail="Incident not found")
        
        incident.status = status
        db.commit()
        return {"status": "success"}
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating incident status: {e}")
        raise HTTPException(status_code=500, detail="Status update failed")

# 5. TPS Results Reporting
@app.post("/api/tps/report")
async def report_tps(report: TpsReport, db: Session = Depends(get_db)):
    try:
        turnout = (report.candidate_votes / report.total_votes * 100) if report.total_votes > 0 else 0
        new_result = TpsResult(
            tps_id=report.tps_id,
            candidate_votes=report.candidate_votes,
            total_votes=report.total_votes,
            voter_turnout_percent=turnout,
            tenant_id=report.tenant_id
        )
        db.add(new_result)
        db.commit()
        db.refresh(new_result)
        return {"status": "success", "id": new_result.id}
    except Exception as e:
        db.rollback()
        logger.error(f"Error reporting TPS result: {e}")
        raise HTTPException(status_code=500, detail="TPS reporting failed")

# 6. Bulk Upload Voter Data
@app.post("/api/voters/upload")
async def upload_voters(
    file: UploadFile = File(...), 
    tenant_id: str = "tenant_1", 
    db: Session = Depends(get_db)
):
    try:
        contents = await file.read()
        if file.filename.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(contents))
        elif file.filename.endswith(('.xlsx', '.xls')):
            df = pd.read_excel(io.BytesIO(contents))
        else:
            raise HTTPException(status_code=400, detail="Unsupported file format")

        # Column Mapping
        mapping = {
            'nik': ['nik', 'nomor induk', 'no induk', 'id'],
            'name': ['name', 'nama', 'nama lengkap'],
            'address': ['address', 'alamat'],
            'kecamatan': ['kecamatan', 'district'],
            'kelurahan': ['kelurahan', 'village', 'desa'],
            'phone': ['phone', 'telepon', 'no hp', 'handphone'],
            'pekerjaan': ['pekerjaan', 'job', 'profesi', 'occupation']
        }

        # Apply mapping
        mapped_columns = {}
        for target, aliases in mapping.items():
            for col in df.columns:
                if str(col).lower() in aliases:
                    mapped_columns[col] = target
                    break
        
        df = df.rename(columns=mapped_columns)

        # Dry Run & Validation
        success_rows = []
        failed_rows = []
        errors = []

        for index, row in df.iterrows():
            row_num = index + 2 # 1-indexed + header
            try:
                # 1. Format Validation
                nik = str(row.get('nik', '')).strip()
                # Handle scientific notation if any
                if 'e' in nik.lower():
                    nik = str(int(float(nik)))
                
                if len(nik) != 16 or not nik.isdigit():
                    raise ValueError(f"NIK harus 16 digit angka pada Baris {row_num}")
                
                phone = str(row.get('phone', '')).strip()
                if not phone.startswith('62'):
                    raise ValueError(f"Nomor telepon harus diawali '62' pada Baris {row_num}")

                pekerjaan = str(row.get('pekerjaan', '')).strip()
                if not pekerjaan:
                    raise ValueError(f"Pekerjaan wajib diisi pada Baris {row_num}")

                # 2. Duplicate Check
                existing = db.query(Voter).filter(Voter.nik == nik).first()
                if existing:
                    raise ValueError(f"NIK Duplikat pada Baris {row_num}")

                # 3. Create Voter Object
                voter = Voter(
                    nik=nik,
                    name=str(row.get('name', '')),
                    address=str(row.get('address', '')),
                    kecamatan=str(row.get('kecamatan', '')),
                    kelurahan=str(row.get('kelurahan', '')),
                    phone=phone,
                    pekerjaan=pekerjaan,
                    tenant_id=tenant_id
                )
                success_rows.append(voter)
            except Exception as e:
                failed_rows.append(row.to_dict())
                errors.append(str(e))

        # Save valid rows
        if success_rows:
            db.add_all(success_rows)
            db.commit()

        # Log the upload
        status = "Success"
        if failed_rows:
            status = "Warning" if success_rows else "Failed"

        log = UploadLog(
            filename=file.filename,
            total_rows=len(df),
            success_count=len(success_rows),
            failed_count=len(failed_rows),
            errors=errors,
            status=status,
            tenant_id=tenant_id
        )
        db.add(log)
        db.commit()

        return {
            "status": status,
            "total": len(df),
            "success": len(success_rows),
            "failed": len(failed_rows),
            "errors": errors[:10] # Return first 10 errors
        }
    except Exception as e:
        logger.error(f"Upload error: {e}")
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

# 7. Download Template
@app.get("/api/download-template")
async def download_template():
    headers = ["nik", "name", "address", "kecamatan", "kelurahan", "phone", "pekerjaan"]
    sample_data = ["1234567890123456", "Budi Santoso", "Jl. Merdeka No. 1", "Kecamatan A", "Kelurahan B", "628123456789", "Petani"]
    
    output = io.StringIO()
    df = pd.DataFrame([sample_data], columns=headers)
    df.to_csv(output, index=False)
    
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=voter_template.csv"}
    )

# 8. Fetch Upload Logs
@app.get("/api/voters/upload-logs")
async def get_upload_logs(tenant_id: str = "tenant_1", db: Session = Depends(get_db)):
    logs = db.query(UploadLog).filter(UploadLog.tenant_id == tenant_id).order_by(UploadLog.created_at.desc()).all()
    return logs

# 9. PoliTrack Intelligence Engine Analysis
@app.get("/api/intelligence/analysis")
async def get_intelligence_analysis(tenant_id: str = "tenant_1", db: Session = Depends(get_db)):
    try:
        # 1. Get Top Local Issue
        top_issue_query = db.query(
            Survey.issue_tag, 
            func.count(Survey.id).label("count")
        ).filter(Survey.tenant_id == tenant_id).group_by(Survey.issue_tag).order_by(func.count(Survey.id).desc()).first()
        
        top_issue = top_issue_query.issue_tag if top_issue_query else "General Welfare"
        
        # 2. Get DPT Count
        dpt_count = db.query(func.count(Voter.id)).filter(Voter.tenant_id == tenant_id).scalar() or 0
        
        # 3. Get Volunteer Activity (Last 5 Days)
        from datetime import timedelta
        five_days_ago = datetime.utcnow() - timedelta(days=5)
        activity_count = db.query(func.count(Survey.id)).filter(
            Survey.tenant_id == tenant_id,
            Survey.created_at >= five_days_ago
        ).scalar() or 0
        
        # 4. Target Kemenangan (Mock: 51% of DPT or min 1000)
        target_kemenangan = max(int(dpt_count * 0.51), 1000)
        
        # 5. Analysis Logic
        activity_density = (activity_count / dpt_count * 100) if dpt_count > 0 else 0
        alert_status = "CRITICAL" if activity_density < 2 else "WARNING" if activity_density < 5 else "OPTIMAL"
        
        # 6. Generate Narratives (Strategic Logic)
        narratives = []
        if top_issue == "Economy":
            narratives = [
                "Pemberdayaan Ekonomi Mikro Berbasis Kelurahan: Dana abadi UMKM lokal untuk modal tanpa bunga.",
                "Digitalisasi Pasar Tradisional: Platform e-commerce khusus produk warga wilayah untuk akses pasar luas.",
                "Program 'Satu Rumah Satu Wirausaha': Pelatihan intensif dan pendampingan sertifikasi halal/PIRT gratis."
            ]
        elif top_issue == "Infrastructure":
            narratives = [
                "Konektivitas 'Last-Mile': Prioritas perbaikan jalan lingkungan dan drainase mikro yang sering terabaikan proyek besar.",
                "Penerangan Wilayah Mandiri: Pemasangan PJU tenaga surya di titik rawan kriminalitas hasil pemetaan relawan.",
                "Balai Warga Digital: Renovasi balai warga menjadi hub coworking space dan pusat layanan publik digital."
            ]
        else:
            narratives = [
                "Layanan Kesehatan 'Door-to-Door': Kunjungan rutin tenaga medis ke rumah lansia dan balita stunting.",
                "Beasiswa Prestasi Wilayah: Dana pendidikan khusus untuk anak berprestasi dari keluarga kurang mampu di dapil.",
                "Pusat Pengaduan 24 Jam: Respon cepat isu lingkungan (sampah, air, keamanan) dengan tracking transparan."
            ]

        return {
            "top_issue": top_issue,
            "dpt_count": dpt_count,
            "target_kemenangan": target_kemenangan,
            "activity_count": activity_count,
            "activity_density": round(activity_density, 2),
            "alert_status": alert_status,
            "narratives": narratives,
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Intelligence analysis error: {e}")
        raise HTTPException(status_code=500, detail="Intelligence engine failed")

# 10. Public Aspiration Submission
class AspirationCreate(BaseModel):
    name: str
    phone: str
    kecamatan: str
    kelurahan: str
    message: str
    tenant_id: str

@app.post("/api/public/aspiration")
async def submit_aspiration(aspiration: AspirationCreate, db: Session = Depends(get_db)):
    try:
        # For now, we'll log it as a special type of survey or just log it to console
        # In a real app, you'd have an 'aspirations' table
        logger.info(f"New Aspiration from {aspiration.name}: {aspiration.message}")
        
        # We can also create a 'Survey' record with a specific status if we want it to show up in the dashboard
        new_survey = Survey(
            voter_name=aspiration.name,
            volunteer_name="Public Microsite",
            loyalty_score=5, # Neutral
            sentiment_score=5, # Neutral
            voter_status="Aspiration Submitted",
            issue_tag="Public Feedback",
            tenant_id=aspiration.tenant_id
        )
        db.add(new_survey)
        db.commit()
        
        return {"status": "success", "message": "Aspirasi Anda telah diterima. Terima kasih atas partisipasi Anda!"}
    except Exception as e:
        logger.error(f"Error submitting aspiration: {e}")
        raise HTTPException(status_code=500, detail="Gagal mengirim aspirasi")

# --- User Profile Endpoints ---

class UserLogin(BaseModel):
    phone: str
    password: str

class UserProfileUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None

class PasswordChange(BaseModel):
    current_password: str
    new_password: str

@app.post("/api/users/login")
async def login_user(body: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.phone == body.phone, User.status == "Active").first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not bcrypt.checkpw(body.password.encode("utf-8"), user.password_hash.encode("utf-8")):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return {
        "id": user.id,
        "name": user.name,
        "phone": user.phone,
        "role": user.role,
        "status": user.status,
        "photo_url": user.photo_url,
        "tenant_id": user.tenant_id,
    }

@app.get("/api/users/{user_id}")
async def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "id": user.id,
        "name": user.name,
        "phone": user.phone,
        "role": user.role,
        "status": user.status,
        "photo_url": user.photo_url,
        "tenant_id": user.tenant_id,
    }

@app.patch("/api/users/{user_id}/profile")
async def update_profile(user_id: int, body: UserProfileUpdate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if body.name is not None:
        user.name = body.name
    if body.phone is not None:
        existing = db.query(User).filter(User.phone == body.phone, User.id != user_id).first()
        if existing:
            raise HTTPException(status_code=409, detail="Phone number already in use")
        user.phone = body.phone
    user.updated_at = datetime.utcnow()
    db.commit()
    return {"status": "success", "message": "Profile updated"}

@app.patch("/api/users/{user_id}/password")
async def change_password(user_id: int, body: PasswordChange, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not bcrypt.checkpw(body.current_password.encode("utf-8"), user.password_hash.encode("utf-8")):
        raise HTTPException(status_code=401, detail="Current password is incorrect")
    if len(body.new_password) < 8:
        raise HTTPException(status_code=400, detail="New password must be at least 8 characters")
    user.password_hash = bcrypt.hashpw(body.new_password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    user.updated_at = datetime.utcnow()
    db.commit()
    return {"status": "success", "message": "Password changed successfully"}

@app.post("/api/users/{user_id}/photo")
async def upload_photo(user_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    allowed_types = ["image/jpeg", "image/png", "image/webp"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Only JPEG, PNG, or WebP images are allowed")
    import base64
    contents = await file.read()
    if len(contents) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size must be under 5MB")
    encoded = f"data:{file.content_type};base64,{base64.b64encode(contents).decode('utf-8')}"
    user.photo_url = encoded
    user.updated_at = datetime.utcnow()
    db.commit()
    return {"status": "success", "photo_url": user.photo_url}


# --- Frontend Serving ---

# Serve static files from 'dist' directory
if os.path.exists("dist"):
    app.mount("/", StaticFiles(directory="dist", html=True), name="static")
else:
    @app.get("/")
    async def root():
        return {"message": "PoliTrack AI API is running. Build frontend to see UI."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)
