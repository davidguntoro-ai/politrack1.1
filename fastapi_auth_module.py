from fastapi import FastAPI, Header, HTTPException, Depends, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import uuid
import jwt
import datetime
import logging
import hashlib
import math
from contextvars import ContextVar
from starlette.middleware.base import BaseHTTPMiddleware

# Configure Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("politrack-security")

# Database Session Context Simulation
tenant_context: ContextVar[str] = ContextVar("tenant_id", default="")

app = FastAPI()

# 1. Implement CORS Middleware restricted to .politrack.id
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https://.*\.politrack\.id",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SECRET_KEY = "politrack-super-secret-key"
ALGORITHM = "HS256"

from enum import Enum

class AccessScope(str, Enum):
    DAPIL = "DAPIL"
    KECAMATAN = "KECAMATAN"
    DESA = "DESA"

class UserRole(str, Enum):
    SUPER_ADMIN = "SUPER_ADMIN"
    ADMIN_KECAMATAN = "ADMIN_KECAMATAN"
    ADMIN_DESA = "ADMIN_DESA"
    DATA_ENTRY = "DATA_ENTRY"
    RELAWAN = "RELAWAN"

class Tenant(BaseModel):
    id: str
    name: str
    candidate_name: str
    emergency_lockdown: bool = False

class User(BaseModel):
    id: str
    tenant_id: str
    role: UserRole
    access_scope: AccessScope
    assigned_district_code: Optional[str] = None
    assigned_village_code: Optional[str] = None
    email: str
    phone_number: str
    password_hash: str
    device_id: Optional[str] = None
    is_device_locked: bool = False
    is_locked: bool = False
    locked_at: Optional[str] = None
    assigned_village: Optional[str] = None
    is_restricted: bool = False

class TenantCreate(BaseModel):
    name: str
    candidate_name: str
    region: str

class LoginRequest(BaseModel):
    phone_number: str
    password_hash: str
    device_id: str

class SecurityAudit(BaseModel):
    user_id: str
    action: str
    ip_address: str
    timestamp: datetime.datetime

# Mock Audit Table
audit_logs: List[SecurityAudit] = []

def log_audit(user_id: str, action: str, request: Request):
    client_ip = request.client.host if request.client else "unknown"
    audit_entry = SecurityAudit(
        user_id=user_id,
        action=action,
        ip_address=client_ip,
        timestamp=datetime.datetime.utcnow()
    )
    audit_logs.append(audit_entry)
    logger.info(f"[AUDIT] User: {user_id} | Action: {action} | IP: {client_ip}")

# Middleware: SaaS Isolation & Intrusion Detection
class TenantIsolationMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Skip middleware for auth/health endpoints
        if request.url.path.startswith("/api/auth") or request.url.path.startswith("/api/tenants/register"):
            return await call_next(request)

        # 1. Extract X-Tenant-ID from header
        x_tenant_id = request.headers.get("X-Tenant-ID")
        if not x_tenant_id:
            return Response("X-Tenant-ID header missing", status_code=400)

        # 2. Extract User Info from JWT (Simulation)
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return Response("Unauthorized", status_code=401)
        
        token = auth_header.split(" ")[1]
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            user_id = payload.get("sub")
            user_tenant_id = payload.get("tenant_id")

            # 3. Verify if User belongs to the requested Tenant
            if user_tenant_id != x_tenant_id:
                # 5. Log Intrusion Attempt
                client_ip = request.client.host if request.client else "unknown"
                logger.warning(
                    f"INTRUSION ATTEMPT: User {user_id} (Tenant: {user_tenant_id}) "
                    f"tried to access Tenant {x_tenant_id} from IP {client_ip}"
                )
                return Response("Forbidden: Tenant access denied", status_code=403)

            # 4. Inject tenant_id into Database Session Context
            token_context = tenant_context.set(x_tenant_id)
            
            try:
                response = await call_next(request)
                return response
            finally:
                # Clean up context
                tenant_context.reset(token_context)

        except jwt.ExpiredSignatureError:
            return Response("Token expired", status_code=401)
        except jwt.InvalidTokenError:
            return Response("Invalid token", status_code=401)

# Add Middleware to App
app.add_middleware(TenantIsolationMiddleware)

# Models
class AreaAssignment(BaseModel):
    user_id: str
    assigned_village: str
    is_restricted: bool

class ActivityReport(BaseModel):
    description: str
    lat: float
    lng: float

class VoterRegister(BaseModel):
    name: str
    email: Optional[str] = None
    address: Optional[str] = None
    comment: str
    nik: str
    district_code: str
    village_code: str
    village_clade: Optional[str] = None

# Mock Voter DB
voters_db = [
    {"id": "v1", "name": "Voter 1", "nik_encrypted": "hashed_nik_1", "assigned_to_user_id": "user_2", "tenantId": "tenant_1"}
]

# 5. Smart Voter Entry with Double-Entry Protection
@app.post("/api/voters/register")
async def register_voter(voter: VoterRegister, tenant_id: str = Depends(get_current_tenant), request: Request = None):
    # Get user from token
    auth_header = request.headers.get("Authorization")
    token = auth_header.split(" ")[1]
    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    uid = payload.get("sub")

    # Data Masking
    nik_encrypted = hashlib.sha256(voter.nik.encode()).hexdigest()

    # Duplicate Detection
    existing = next((v for v in voters_db if v["tenantId"] == tenant_id and v["nik_encrypted"] == nik_encrypted), None)
    if existing:
        relawan_id = existing["assigned_to_user_id"]
        relawan = users_db.get(relawan_id)
        relawan_name = relawan.email if relawan else "Relawan Lain"
        
        # Log Audit: Failed Entry (Duplicate)
        log_audit(uid, f"VOTER_ENTRY_FAILED_DUPLICATE: {nik_encrypted}", request)
        
        raise HTTPException(
            status_code=409, 
            detail=f"Data pemilih ini sudah terdaftar oleh {relawan_name}"
        )

    # Smart Association & Save
    new_voter_id = f"voter_{uuid.uuid4().hex[:6]}"
    voters_db.append({
        "id": new_voter_id,
        "name": voter.name,
        "nik_encrypted": nik_encrypted,
        "address": voter.address,
        "districtCode": voter.district_code,
        "villageCode": voter.village_code,
        "assigned_to_user_id": uid,
        "tenantId": tenant_id,
        "lat": -6.15, # Mock lat for distance check
        "lng": 106.85, # Mock lng for distance check
        "sentiment": "pending",
        "sentimentScore": 0,
        "supportStatusPrediction": "Unknown"
    })

    # Log Audit: Successful Entry
    log_audit(uid, f"VOTER_ENTRY_SUCCESS: {new_voter_id}", request)

    return {"id": new_voter_id, "status": "Verified"}

# Mock Village Coordinates (Simulating Geo-fencing data)
VILLAGE_BOUNDS = {
    "Village_A": {"lat_min": -6.2, "lat_max": -6.1, "lng_min": 106.8, "lng_max": 106.9},
    "Village_B": {"lat_min": -6.3, "lat_max": -6.2, "lng_min": 106.9, "lng_max": 107.0}
}

# 1. Admin: Assign Area
@app.put("/api/admin/assign-area")
async def assign_area(assignment: AreaAssignment, tenant_id: str = Depends(get_current_tenant)):
    user = users_db.get(assignment.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.assigned_village = assignment.assigned_village
    user.is_restricted = assignment.is_restricted
    return {"message": f"Area assigned to {user.id}", "is_restricted": user.is_restricted}

# 2. Server-side Filtering: GET /voters with ScopeInterceptor simulation
@app.get("/api/voters")
async def get_voters(
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    radius_km: Optional[float] = 5.0,
    tenant_id: str = Depends(get_current_tenant),
    request: Request = None
):
    # Get user from token (simulated)
    auth_header = request.headers.get("Authorization")
    token = auth_header.split(" ")[1]
    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    user = users_db.get(payload["sub"])

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Mock Voter Data with Coordinates and Geo Codes
    all_voters = [
        {
            "id": "v1", "name": "Voter 1", "nik_encrypted": "hashed_1", "address": "Jl. Merdeka 1",
            "districtCode": "KEC_01", "villageCode": "DESA_01", "village_clade": "Village_A", 
            "tenantId": "tenant_1", "lat": -6.12, "lng": 106.82,
            "sentiment": "positive", "sentimentScore": 0.85, "supportStatusPrediction": "Strong Support"
        },
        {
            "id": "v2", "name": "Voter 2", "nik_encrypted": "hashed_2", "address": "Jl. Merdeka 2",
            "districtCode": "KEC_02", "villageCode": "DESA_02", "village_clade": "Village_B", 
            "tenantId": "tenant_1", "lat": -6.25, "lng": 106.95,
            "sentiment": "negative", "sentimentScore": 0.15, "supportStatusPrediction": "Opponent"
        },
        {
            "id": "v3", "name": "Voter 3", "nik_encrypted": "hashed_3", "address": "Jl. Merdeka 3",
            "districtCode": "KEC_01", "villageCode": "DESA_03", "village_clade": "Village_A", 
            "tenantId": "tenant_1", "lat": -6.13, "lng": 106.83,
            "sentiment": "neutral", "sentimentScore": 0.5, "supportStatusPrediction": "Undecided"
        }
    ]

    # Filter by Tenant
    tenant_voters = [v for v in all_voters if v["tenantId"] == tenant_id]

    # ScopeInterceptor Simulation: Automatically append filters based on user's scope
    filtered_voters = tenant_voters
    
    if user.role == UserRole.ADMIN_KECAMATAN:
        filtered_voters = [v for v in tenant_voters if v["districtCode"] == user.assigned_district_code]
    elif user.role == UserRole.ADMIN_DESA:
        filtered_voters = [v for v in tenant_voters if v["villageCode"] == user.assigned_village_code]
    elif user.role == UserRole.RELAWAN and user.is_restricted:
        filtered_voters = [v for v in tenant_voters if v["village_clade"] == user.assigned_village]

    # Data Privacy (Blind Entry): Exclude sensitive columns for DATA_ENTRY
    if user.role == UserRole.DATA_ENTRY:
        return [
            {
                "id": v["id"],
                "name": v["name"],
                "nik_encrypted": v["nik_encrypted"],
                "address": v["address"]
            } for v in filtered_voters
        ]

    # PostGIS Distance Check Integration (Nearby Voters)
    if lat is not None and lng is not None:
        nearby_voters = []
        for v in filtered_voters:
            # Haversine Formula to calculate distance
            R = 6371 # Earth radius in km
            dlat = math.radians(v["lat"] - lat)
            dlng = math.radians(v["lng"] - lng)
            a = math.sin(dlat/2)**2 + math.cos(math.radians(lat)) * math.cos(math.radians(v["lat"])) * math.sin(dlng/2)**2
            c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
            distance = R * c
            
            if distance <= radius_km:
                v["distance_km"] = round(distance, 2)
                nearby_voters.append(v)
        
        return sorted(nearby_voters, key=lambda x: x["distance_km"])

    return filtered_voters

# 6. Admin Lockdown Endpoints
@app.post("/api/admin/lockdown/{user_id}")
async def lockdown_user(
    user_id: str,
    tenant_id: str = Depends(get_current_tenant),
    request: Request = None
):
    # Verify requester is SUPER_ADMIN
    auth_header = request.headers.get("Authorization")
    token = auth_header.split(" ")[1]
    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    requester = users_db.get(payload["sub"])

    if not requester or requester.role != UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Only SUPER_ADMIN can trigger lockdown")

    user = users_db.get(user_id)
    if not user or user.tenant_id != tenant_id:
        raise HTTPException(status_code=404, detail="User not found in your tenant")

    user.is_locked = True
    user.locked_at = datetime.utcnow().isoformat()
    
    # Log Audit
    print(f"AUDIT_LOG: USER_LOCKED | User: {user_id} | Admin: {requester.id} | Time: {user.locked_at}")
    
    return {"message": f"User {user_id} has been locked.", "locked_at": user.locked_at}

@app.post("/api/admin/unlock/{user_id}")
async def unlock_user(
    user_id: str,
    tenant_id: str = Depends(get_current_tenant),
    request: Request = None
):
    # Verify requester is SUPER_ADMIN
    auth_header = request.headers.get("Authorization")
    token = auth_header.split(" ")[1]
    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    requester = users_db.get(payload["sub"])

    if not requester or requester.role != UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Only SUPER_ADMIN can restore access")

    user = users_db.get(user_id)
    if not user or user.tenant_id != tenant_id:
        raise HTTPException(status_code=404, detail="User not found")

    user.is_locked = False
    user.locked_at = None
    
    return {"message": f"User {user_id} access restored."}

@app.post("/api/admin/tenant-lockdown/{target_tenant_id}")
async def toggle_tenant_lockdown(
    target_tenant_id: str,
    lock: bool = True,
    request: Request = None
):
    # Verify requester is SUPER_ADMIN of the target tenant
    auth_header = request.headers.get("Authorization")
    token = auth_header.split(" ")[1]
    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    requester = users_db.get(payload["sub"])

    if not requester or requester.role != UserRole.SUPER_ADMIN or requester.tenant_id != target_tenant_id:
        raise HTTPException(status_code=403, detail="Unauthorized: Only Tenant Candidate can trigger global lockdown")

    tenant = tenants_db.get(target_tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")

    tenant.emergency_lockdown = lock
    
    status = "LOCKED" if lock else "RESTORED"
    print(f"AUDIT_LOG: TENANT_LOCKDOWN_{status} | Tenant: {target_tenant_id} | Admin: {requester.id}")
    
    return {"message": f"Tenant {target_tenant_id} status: {status}", "emergency_lockdown": lock}

# 3. Geo-fencing Warning: POST /activity
@app.post("/api/activity")
async def post_activity(
    report: ActivityReport,
    tenant_id: str = Depends(get_current_tenant),
    request: Request = None
):
    # Get user from token
    auth_header = request.headers.get("Authorization")
    token = auth_header.split(" ")[1]
    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    user = users_db.get(payload["sub"])

    out_of_assignment = False

    if user and getattr(user, 'is_restricted', False):
        village = getattr(user, 'assigned_village', '')
        bounds = VILLAGE_BOUNDS.get(village)
        
        if bounds:
            # Check if coordinates are outside assigned_village
            if not (bounds["lat_min"] <= report.lat <= bounds["lat_max"] and 
                    bounds["lng_min"] <= report.lng <= bounds["lng_max"]):
                out_of_assignment = True
                logger.warning(f"GEO-FENCE WARNING: User {user.id} reported from outside {village} at ({report.lat}, {report.lng})")

    # Save activity (Mock)
    activity_id = f"act_{uuid.uuid4().hex[:6]}"
    return {
        "id": activity_id,
        "status": "Received",
        "out_of_assignment": out_of_assignment,
        "message": "Activity logged successfully" + (" (Audit Flagged)" if out_of_assignment else "")
    }

# Mock Database (Simulating core.tenants)
tenants_db = {
    "tenant_1": Tenant(id="tenant_1", name="Candidate A", candidate_name="John Doe", emergency_lockdown=False)
}

# Mock Database (Simulating core.tenants)
tenants_db = {
    "tenant_1": Tenant(id="tenant_1", name="Candidate A", candidate_name="John Doe", emergency_lockdown=False)
}

# Mock Database (Simulating core.users)
users_db = {
    "user_1": User(
        id="user_1", 
        tenant_id="tenant_1", 
        role=UserRole.SUPER_ADMIN,
        access_scope=AccessScope.DAPIL,
        email="admin@politrack.ai",
        phone_number="08123456789",
        password_hash="hashed_password_123"
    ),
    "user_2": User(
        id="user_2", 
        tenant_id="tenant_1", 
        role=UserRole.RELAWAN,
        access_scope=AccessScope.DESA,
        email="koor@politrack.ai",
        phone_number="08123456780",
        password_hash="hashed_password_456"
    ),
    "user_kec": User(
        id="user_kec",
        tenant_id="tenant_1",
        role=UserRole.ADMIN_KECAMATAN,
        access_scope=AccessScope.KECAMATAN,
        assigned_district_code="KEC_01",
        email="kec@politrack.id",
        phone_number="08123456781",
        password_hash="hashed_password_kec"
    ),
    "user_data": User(
        id="user_data",
        tenant_id="tenant_1",
        role=UserRole.DATA_ENTRY,
        access_scope=AccessScope.DAPIL,
        email="data@politrack.id",
        phone_number="08123456782",
        password_hash="hashed_password_data"
    )
}

# Dependency: Get Current Tenant & Verify Device with Lockdown Check
async def get_current_tenant(request: Request):
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid token")
    
    token = auth_header.split(" ")[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        token_device_id = payload.get("device_id")
        tenant_id = payload.get("tenant_id")

        # 1.1 Fast-lookup: Check User Lockdown Status
        user = users_db.get(user_id)
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        
        if user.is_locked:
            raise HTTPException(
                status_code=403,
                detail={
                    "error": "ACCOUNT_LOCKED",
                    "message": "Akses Anda telah ditangguhkan oleh Admin Pusat. Silakan hubungi koordinator Anda."
                }
            )

        # 1.2 Fast-lookup: Check Global Tenant Lockdown
        tenant = tenants_db.get(tenant_id)
        if tenant and tenant.emergency_lockdown:
            # Allow SUPER_ADMIN to bypass tenant lockdown to restore access
            if user.role != UserRole.SUPER_ADMIN:
                raise HTTPException(
                    status_code=403,
                    detail={
                        "error": "TENANT_LOCKDOWN",
                        "message": "Sistem sedang dalam mode pemeliharaan darurat. Akses ditangguhkan sementara."
                    }
                )

        # 1.3 Verify device_id against database
        if user.device_id != token_device_id:
            raise HTTPException(
                status_code=401, 
                detail="Unauthorized: Device mismatch. Token is invalid for this device."
            )

        return tenant_id
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Could not validate credentials")
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=401, detail="Invalid Authentication")

# 1. Tenant Provisioning
@app.post("/api/tenants/register")
async def register_tenant(tenant: TenantCreate):
    tenant_id = f"tenant_{uuid.uuid4().hex[:8]}"
    return {"message": "Tenant registered", "tenant_id": tenant_id}

# 2. JWT Generator with Tenant Isolation & Device Binding
@app.post("/api/auth/login")
async def login(request: LoginRequest, req_obj: Request):
    # 1. Verify phone_number and password_hash (Mock core.users lookup)
    user = next((u for u in users_db.values() if u.phone_number == request.phone_number), None)
    
    if not user or user.password_hash != request.password_hash:
        # Log Audit: Failed Login
        log_audit("unknown", f"LOGIN_FAILED: {request.phone_number}", req_obj)
        raise HTTPException(status_code=401, detail="Invalid phone number or password")

    # 3. Add a Device-Binding Check on the /login endpoint
    if user.device_id and user.device_id != request.device_id:
        # Log Audit: Device Mismatch
        log_audit(user.id, f"LOGIN_FAILED_DEVICE_MISMATCH: {request.device_id}", req_obj)
        # Return a specific error code ERR_DEVICE_MISMATCH
        raise HTTPException(
            status_code=401, 
            detail={"error_code": "ERR_DEVICE_MISMATCH", "message": "Device mismatch. Contact Admin."}
        )

    if not user.device_id:
        user.device_id = request.device_id
        user.is_device_locked = True

    # 4. Generate JWT Token with tenant_id, role, and device_id in payload
    payload = {
        "sub": user.id,
        "tenant_id": user.tenant_id,
        "role": user.role,
        "device_id": user.device_id,
        "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=24)
    }
    token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

    # Log Audit: Successful Login
    log_audit(user.id, "LOGIN_SUCCESS", req_obj)

    return {
        "access_token": token, 
        "token_type": "bearer", 
        "tenant_id": user.tenant_id,
        "role": user.role
    }

# 6. Admin Lockdown Endpoints
@app.post("/api/admin/lockdown/{user_id}")
async def lockdown_user(
    user_id: str,
    tenant_id: str = Depends(get_current_tenant),
    request: Request = None
):
    # Verify requester is SUPER_ADMIN
    auth_header = request.headers.get("Authorization")
    token = auth_header.split(" ")[1]
    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    requester_id = payload.get("sub")
    requester = users_db.get(requester_id)

    if not requester or requester.role != UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Only SUPER_ADMIN can trigger lockdown")

    user = users_db.get(user_id)
    if not user or user.tenant_id != tenant_id:
        raise HTTPException(status_code=404, detail="User not found in your tenant")

    user.is_locked = True
    user.locked_at = datetime.datetime.utcnow().isoformat()
    
    # Log Audit
    log_audit(requester_id, f"LOCKDOWN_USER: {user_id}", request)
    
    return {"message": f"User {user_id} has been locked.", "locked_at": user.locked_at}

@app.post("/api/admin/unlock/{user_id}")
async def unlock_user(
    user_id: str,
    tenant_id: str = Depends(get_current_tenant),
    request: Request = None
):
    # Verify requester is SUPER_ADMIN
    auth_header = request.headers.get("Authorization")
    token = auth_header.split(" ")[1]
    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    requester_id = payload.get("sub")
    requester = users_db.get(requester_id)

    if not requester or requester.role != UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Only SUPER_ADMIN can restore access")

    user = users_db.get(user_id)
    if not user or user.tenant_id != tenant_id:
        raise HTTPException(status_code=404, detail="User not found")

    user.is_locked = False
    user.locked_at = None
    
    log_audit(requester_id, f"UNLOCK_USER: {user_id}", request)
    
    return {"message": f"User {user_id} access restored."}

@app.post("/api/admin/tenant-lockdown/{target_tenant_id}")
async def toggle_tenant_lockdown(
    target_tenant_id: str,
    lock: bool = True,
    request: Request = None
):
    # Verify requester is SUPER_ADMIN of the target tenant
    auth_header = request.headers.get("Authorization")
    token = auth_header.split(" ")[1]
    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    requester_id = payload.get("sub")
    requester = users_db.get(requester_id)

    if not requester or requester.role != UserRole.SUPER_ADMIN or requester.tenant_id != target_tenant_id:
        raise HTTPException(status_code=403, detail="Unauthorized: Only Tenant Candidate can trigger global lockdown")

    tenant = tenants_db.get(target_tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")

    tenant.emergency_lockdown = lock
    
    status = "LOCKED" if lock else "RESTORED"
    log_audit(requester_id, f"TENANT_LOCKDOWN_{status}: {target_tenant_id}", request)
    
    return {"message": f"Tenant {target_tenant_id} status: {status}", "emergency_lockdown": lock}

# 3. API Example using get_current_tenant
@app.get("/api/dashboard/summary")
async def get_summary(tenant_id: str = Depends(get_current_tenant)):
    return {
        "message": "Access granted",
        "tenant_id": tenant_id,
        "data": "Confidential political analytics for your tenant."
    }
