import express from "express";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import firebaseConfig from "./firebase-applet-config.json" with { type: "json" };

// Initialize Firebase Admin for background tasks
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: firebaseConfig.projectId,
  });
}

import jwt from "jsonwebtoken";
import crypto from "crypto";
import { volunteerSchema } from "./src/lib/validation.ts";
import { z } from "zod";

import { WebSocketServer, WebSocket } from "ws";
import { createServer } from "http";

const db = getFirestore();
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
const JWT_SECRET = process.env.JWT_SECRET || "politrack-super-secret-key";

// Helper for NIK hashing
const hashNIK = (nik: string) => {
  return crypto.createHash("sha256").update(nik).digest("hex");
};

// Helper for Relawan Code Generation
const generateRelawanCode = (tenantId: string, nik: string) => {
  // Extract numeric part of tenantId (e.g., 'tenant_1' -> '1')
  const tenantNum = tenantId.replace(/\D/g, "") || "1";
  // Last 4 digits of NIK
  const shortNik = nik.slice(-4);
  return `KND${tenantNum}-${shortNik}`;
};

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || "5000", 10);

  // 1. Implement CORS Middleware - allow all origins in dev
  app.use(cors({
    origin: true,
    credentials: true
  }));

  app.use(express.json());

  const httpServer = createServer(app);
  const wss = new WebSocketServer({ server: httpServer });

  const clients = new Set<WebSocket>();

  wss.on("connection", (ws) => {
    clients.add(ws);
    ws.on("close", () => clients.delete(ws));
  });

  const broadcast = (data: any) => {
    const message = JSON.stringify(data);
    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  };

  // Helper: Security Audit Logger
  const logAudit = async (userId: string, action: string, req: express.Request) => {
    const clientIp = req.ip || req.socket.remoteAddress || "unknown";
    await db.collection("security_audits").add({
      userId,
      action,
      ipAddress: clientIp,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log(`[AUDIT] User: ${userId} | Action: ${action} | IP: ${clientIp}`);
  };

  // Middleware: Tenant Isolation & Intrusion Detection
  const tenantIsolationMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    // Skip for non-API routes (let Vite serve frontend assets)
    if (!req.path.startsWith("/api/")) {
      return next();
    }
    // Skip for auth/register and public relawan registration
    if (req.path.startsWith("/api/auth") || req.path.startsWith("/api/tenants/register") || req.path === "/api/register-relawan") {
      return next();
    }

    const tenantId = req.headers["x-tenant-id"] as string;
    if (!tenantId) {
      return res.status(400).json({ error: "X-Tenant-ID header is required for SaaS isolation" });
    }

    // Verify JWT for Tenant Matching
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) return res.status(401).json({ error: "Unauthorized" });

    jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
      if (err) return res.status(403).json({ error: "Invalid token" });

      // Verify if User belongs to the requested Tenant
      if (decoded.tenantId !== tenantId) {
        const clientIp = req.ip || req.socket.remoteAddress;
        console.warn(`[INTRUSION ATTEMPT] User ${decoded.uid} (Tenant: ${decoded.tenantId}) tried to access Tenant ${tenantId} from IP ${clientIp}`);
        return res.status(403).json({ error: "Forbidden: Tenant access denied" });
      }

      // Inject tenantId, uid, and role into request for downstream use
      (req as any).tenantId = tenantId;
      (req as any).uid = decoded.uid;
      (req as any).role = decoded.role;
      next();
    });
  };

  app.use(tenantIsolationMiddleware);

  // 1. Tenant Provisioning
  app.post("/api/tenants/register", async (req, res) => {
    const { name, candidateName, region } = req.body;
    if (!name || !candidateName) return res.status(400).json({ error: "Missing required fields" });

    const tenantId = `tenant_${Math.random().toString(36).substr(2, 9)}`;
    const tenantData = { id: tenantId, name, candidateName, region, createdAt: admin.firestore.FieldValue.serverTimestamp() };

    await db.collection("tenants").doc(tenantId).set(tenantData);
    res.json({ message: "Tenant registered successfully", tenantId });
  });

  // 2. Auth & Device Binding with Lockdown Check
  app.post("/api/auth/login", async (req, res) => {
    const { email, deviceId, firebaseToken } = req.body;
    
    try {
      // Verify Firebase Token
      const decodedToken = await admin.auth().verifyIdToken(firebaseToken);
      const uid = decodedToken.uid;

      const userDoc = await db.collection("users").doc(uid).get();
      if (!userDoc.exists) {
        await logAudit("unknown", `LOGIN_FAILED: ${email}`, req);
        return res.status(404).json({ error: "User not found" });
      }

      const userData = userDoc.data()!;

      // 1.1 Fast-lookup: Check User Lockdown Status
      if (userData.isLocked) {
        await logAudit(uid, `LOGIN_FAILED_ACCOUNT_LOCKED: ${email}`, req);
        return res.status(403).json({
          error: "ACCOUNT_LOCKED",
          message: "Akses Anda telah ditangguhkan oleh Admin Pusat. Silakan hubungi koordinator Anda."
        });
      }

      // 1.2 Fast-lookup: Check Global Tenant Lockdown
      const tenantDoc = await db.collection("tenants").doc(userData.tenantId).get();
      if (tenantDoc.exists && tenantDoc.data()?.emergencyLockdown) {
        if (userData.role !== "SUPER_ADMIN") {
          await logAudit(uid, `LOGIN_FAILED_TENANT_LOCKDOWN: ${email}`, req);
          return res.status(403).json({
            error: "TENANT_LOCKDOWN",
            message: "Sistem sedang dalam mode pemeliharaan darurat. Akses ditangguhkan sementara."
          });
        }
      }
      
      // 3. Add a Device-Binding Check on the /login endpoint
      if (userData.deviceId && userData.deviceId !== deviceId && userData.isDeviceLocked) {
        await logAudit(uid, `LOGIN_FAILED_DEVICE_MISMATCH: ${deviceId}`, req);
        return res.status(401).json({ 
          error: "Unauthorized: Login from a different device is restricted. Please contact Admin to reset device binding.",
          status: "ERR_DEVICE_MISMATCH"
        });
      }

      // Update deviceId if not set
      if (!userData.deviceId) {
        await userDoc.ref.update({ deviceId, isDeviceLocked: true });
      }

      // Generate JWT for cross-subdomain SSO simulation
      const token = jwt.sign({ 
        uid, 
        tenantId: userData.tenantId, 
        role: userData.role,
        accessScope: userData.accessScope,
        assignedDistrictCode: userData.assignedDistrictCode,
        assignedVillageCode: userData.assignedVillageCode,
        email: userData.email 
      }, JWT_SECRET, { expiresIn: "24h" });

      await logAudit(uid, "LOGIN_SUCCESS", req);

      res.json({ token, user: userData });
    } catch (error) {
      await logAudit("unknown", `LOGIN_FAILED_ERROR: ${email}`, req);
      res.status(401).json({ error: "Authentication failed" });
    }
  });

  // Admin: Reset Device Binding
  app.post("/api/admin/reset-device", async (req, res) => {
    const { targetUserId } = req.body;
    // In a real app, verify requester is ADMIN
    await db.collection("users").doc(targetUserId).update({ deviceId: null, isDeviceLocked: false });
    res.json({ message: "Device binding reset successfully" });
  });

  // 3. Dynamic Area Assignment
  app.put("/api/admin/assign-area", async (req, res) => {
    const { userId, assignedVillage, isRestricted } = req.body;
    // In real app, verify requester is ADMIN
    await db.collection("users").doc(userId).update({ assignedVillage, isRestricted });
    res.json({ message: "Area assignment updated" });
  });

  // 4. Geo-fencing Activity Report
  app.post("/api/activity", async (req, res) => {
    const { description, lat, lng } = req.body;
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    jwt.verify(token, JWT_SECRET, async (err: any, decoded: any) => {
      if (err) return res.status(403).json({ error: "Invalid token" });

      const uid = decoded.uid;
      const tenantId = decoded.tenantId;

      const userDoc = await db.collection("users").doc(uid).get();
      const userData = userDoc.data();
      
      let outOfAssignment = false;

      if (userData?.isRestricted) {
        // Simple mock geo-fencing check
        const village = userData.assignedVillage;
        // Mock bounds for Village_A
        if (village === "Village_A" && (lat < -6.2 || lat > -6.1)) {
          outOfAssignment = true;
        }
      }

      const activityRef = await db.collection("activities").add({
        userId: uid,
        tenantId,
        description,
        lat,
        lng,
        outOfAssignment,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      res.json({ id: activityRef.id, outOfAssignment });
    });
  });

  // 5. Smart Voter Entry with Double-Entry Protection
  app.post("/api/voters/register", async (req, res) => {
    const { name, email, address, comment, nik, districtCode, villageCode, villageClade, lat, lng, phone_number, isHighInfluence, mainIssue, competitorActivity } = req.body;
    const tenantId = (req as any).tenantId;
    const uid = (req as any).uid;

    if (!nik || !name || !comment || !districtCode || !villageCode) {
      return res.status(400).json({ error: "NIK, Name, Comment, District, and Village are required" });
    }

    const nik_encrypted = hashNIK(nik);

    try {
      // Duplicate Detection
      const existingVoters = await db.collection("voters")
        .where("tenantId", "==", tenantId)
        .where("nik_encrypted", "==", nik_encrypted)
        .get();

      if (!existingVoters.empty) {
        const firstVoter = existingVoters.docs[0].data();
        const relawanId = firstVoter.assigned_to_user_id;
        let relawanName = "Relawan Lain";

        if (relawanId) {
          const relawanDoc = await db.collection("users").doc(relawanId).get();
          if (relawanDoc.exists) {
            relawanName = relawanDoc.data()?.displayName || relawanDoc.data()?.email || "Relawan Lain";
          }
        }

        return res.status(409).json({ 
          error: `Data pemilih ini sudah terdaftar oleh ${relawanName}`,
          status: "DUPLICATE"
        });
      }

      // Smart Association & Save
      const voterData = {
        tenantId,
        name,
        email,
        address,
        comment,
        nik_encrypted,
        districtCode,
        villageCode,
        assigned_to_user_id: uid,
        villageClade: villageClade || null,
        phone_number: phone_number || null,
        isHighInfluence: isHighInfluence || false,
        mainIssue: mainIssue || "General",
        competitorActivity: competitorActivity || 0,
        gpsAccuracy: req.body.gpsAccuracy || 0,
        exifTimestamp: req.body.exifTimestamp || null,
        ipAddress: req.ip || req.socket.remoteAddress || "unknown",
        deviceId: req.body.deviceId || null,
        lat: lat || null,
        lng: lng || null,
        sentiment: "pending",
        sentimentScore: 0,
        supportStatusPrediction: "Unknown",
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      };

      const voterRef = await db.collection("voters").add(voterData);
      
      await logAudit(uid, `VOTER_ENTRY_SUCCESS: ${voterRef.id}`, req);

      res.json({ id: voterRef.id, status: "Verified" });
    } catch (error) {
      console.error("Voter registration error:", error);
      res.status(500).json({ error: "Failed to register voter" });
    }
  });

  // 6. Volunteer (Relawan) Profile Management
  // GET /api/volunteers: Fetch all volunteers for the current tenant.
  app.get("/api/volunteers", tenantIsolationMiddleware, async (req, res) => {
    const { tenantId, role: adminRole } = (req as any);

    // Only Admin/Kandidat can view all volunteers
    if (adminRole === "RELAWAN" || adminRole === "DATA_ENTRY") {
      return res.status(403).json({ error: "Unauthorized: Only Admins can view volunteers" });
    }

    try {
      const volunteersSnapshot = await db.collection("users")
        .where("tenantId", "==", tenantId)
        .where("role", "==", "RELAWAN")
        .get();

      const volunteers = volunteersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      res.json(volunteers);
    } catch (error) {
      console.error("Fetch volunteers error:", error);
      res.status(500).json({ error: "Failed to fetch volunteers" });
    }
  });

  // POST /api/register-relawan: Accept all mandatory fields. is_active is false by default.
  app.post("/api/register-relawan", async (req, res) => {
    const tenantId = req.headers["x-tenant-id"] as string;
    if (!tenantId) return res.status(400).json({ error: "X-Tenant-ID header is required" });

    try {
      // Validate input using Zod
      const validatedData = volunteerSchema.parse(req.body);

      const { nik, ...profileData } = validatedData;
      const nik_encrypted = hashNIK(nik);

      // Check for duplicate NIK (Primary Key: NIK)
      const userDoc = await db.collection("users").doc(nik).get();
      if (userDoc.exists) {
        return res.status(409).json({ error: "NIK sudah terdaftar di sistem" });
      }

      // Create new user in Firestore
      const newVolunteer = {
        id: nik, // Primary Key: NIK
        tenantId,
        role: "RELAWAN",
        nik_encrypted,
        ...profileData,
        is_active: false, // Default: false
        isLocked: false,
        reliabilityScore: 100,
        auditStatus: "clean",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      await db.collection("users").doc(nik).set(newVolunteer);
      await logAudit(nik, `REGISTER_RELAWAN_PENDING`, req);

      res.json({ message: "Pendaftaran relawan berhasil. Menunggu validasi admin.", id: nik });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.issues });
      }
      console.error("Relawan registration error:", error);
      res.status(500).json({ error: "Gagal mendaftarkan relawan" });
    }
  });

  // PATCH /api/validate-relawan/:nik: Only accessible by Admin/Kandidat.
  // Toggles is_active to true and triggers generation of unique kode_relawan.
  app.patch("/api/validate-relawan/:nik", async (req, res) => {
    const tenantId = (req as any).tenantId;
    const adminUid = (req as any).uid;
    const adminRole = (req as any).role;
    const { nik } = req.params;

    // Only Admin/Kandidat can validate (Assuming SUPER_ADMIN and ADMIN_KECAMATAN)
    if (adminRole === "RELAWAN" || adminRole === "DATA_ENTRY") {
      return res.status(403).json({ error: "Unauthorized: Only Admins can validate volunteers" });
    }

    try {
      const userDocRef = db.collection("users").doc(nik);
      const userDoc = await userDocRef.get();

      if (!userDoc.exists || userDoc.data()?.tenantId !== tenantId) {
        return res.status(404).json({ error: "Relawan tidak ditemukan" });
      }

      const userData = userDoc.data()!;

      if (userData.is_active) {
        return res.status(400).json({ error: "Relawan sudah aktif" });
      }

      // Generate Kode Relawan: [Prefix-TenantID]-[Short-NIK]
      const kode_relawan = generateRelawanCode(tenantId, nik);

      // Update user
      await userDoc.ref.update({
        is_active: true,
        kode_relawan,
        validatedBy: adminUid,
        validatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      await logAudit(adminUid, `VALIDATE_RELAWAN:${userDoc.id}`, req);

      res.json({ 
        message: "Relawan berhasil divalidasi", 
        id: userDoc.id, 
        kode_relawan 
      });
    } catch (error) {
      console.error("Relawan validation error:", error);
      res.status(500).json({ error: "Gagal memvalidasi relawan" });
    }
  });

  // DELETE /api/users/:id: Delete a user (volunteer) record.
  app.delete("/api/users/:id", tenantIsolationMiddleware, async (req, res) => {
    const { tenantId, role: adminRole, uid: adminUid } = (req as any);
    const { id } = req.params;

    // Only Admin/Kandidat can delete
    if (adminRole === "RELAWAN" || adminRole === "DATA_ENTRY") {
      return res.status(403).json({ error: "Unauthorized: Only Admins can delete users" });
    }

    try {
      const userDocRef = db.collection("users").doc(id);
      const userDoc = await userDocRef.get();

      if (!userDoc.exists || userDoc.data()?.tenantId !== tenantId) {
        return res.status(404).json({ error: "User tidak ditemukan" });
      }

      await userDocRef.delete();
      await logAudit(adminUid, `DELETE_USER:${id}`, req);

      res.json({ message: "User berhasil dihapus" });
    } catch (error) {
      console.error("Delete user error:", error);
      res.status(500).json({ error: "Gagal menghapus user" });
    }
  });

  // 6. Multi-Level Command Hierarchy: GET /voters with ScopeInterceptor
  app.get("/api/voters", async (req, res) => {
    const tenantId = (req as any).tenantId;
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    jwt.verify(token, JWT_SECRET, async (err: any, decoded: any) => {
      if (err) return res.status(403).json({ error: "Invalid token" });

      const { role, accessScope, assignedDistrictCode, assignedVillageCode } = decoded;
      
      let query: any = db.collection("voters").where("tenantId", "==", tenantId);

      // Apply ScopeInterceptor filters
      if (role === "ADMIN_KECAMATAN") {
        query = query.where("districtCode", "==", assignedDistrictCode);
      } else if (role === "ADMIN_DESA") {
        query = query.where("villageCode", "==", assignedVillageCode);
      }

      try {
        const snapshot = await query.get();
        let voters = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));

        // Data Privacy (Blind Entry): Exclude sensitive columns for DATA_ENTRY
        if (role === "DATA_ENTRY") {
          voters = voters.map((v: any) => ({
            id: v.id,
            name: v.name,
            nik_encrypted: v.nik_encrypted,
            address: v.address
          }));
        }

        res.json(voters);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch voters" });
      }
    });
  });

  // 7. Security Constraint: Jurisdiction Check
  app.get("/api/voters/:voterId", async (req, res) => {
    const { voterId } = req.params;
    const tenantId = (req as any).tenantId;
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    jwt.verify(token, JWT_SECRET, async (err: any, decoded: any) => {
      if (err) return res.status(403).json({ error: "Invalid token" });

      const { role, assignedDistrictCode, assignedVillageCode } = decoded;

      try {
        const voterDoc = await db.collection("voters").doc(voterId).get();
        if (!voterDoc.exists || voterDoc.data()?.tenantId !== tenantId) {
          return res.status(404).json({ error: "Voter not found" });
        }

        const voter = voterDoc.data()!;

        // Jurisdiction Check
        if (role === "ADMIN_KECAMATAN" && voter.districtCode !== assignedDistrictCode) {
          return res.status(403).json({ error: "403 Forbidden: Access Denied - Outside of Assigned Jurisdiction" });
        }
        if (role === "ADMIN_DESA" && voter.villageCode !== assignedVillageCode) {
          return res.status(403).json({ error: "403 Forbidden: Access Denied - Outside of Assigned Jurisdiction" });
        }

        res.json({ id: voterDoc.id, ...voter });
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch voter" });
      }
    });
  });

  // 8. Admin Lockdown Endpoints
  app.post("/api/admin/lockdown/:userId", async (req, res) => {
    const { userId } = req.params;
    const requesterUid = (req as any).uid;
    const requesterRole = (req as any).role;
    const tenantId = (req as any).tenantId;

    if (requesterRole !== "SUPER_ADMIN") {
      return res.status(403).json({ error: "Only SUPER_ADMIN can trigger lockdown" });
    }

    try {
      const userDoc = await db.collection("users").doc(userId).get();
      if (!userDoc.exists || userDoc.data()?.tenantId !== tenantId) {
        return res.status(404).json({ error: "User not found" });
      }

      await userDoc.ref.update({
        isLocked: true,
        lockedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      await logAudit(requesterUid, `LOCKDOWN_USER: ${userId}`, req);
      res.json({ message: `User ${userId} has been locked.` });
    } catch (error) {
      res.status(500).json({ error: "Failed to lockdown user" });
    }
  });

  app.post("/api/admin/unlock/:userId", async (req, res) => {
    const { userId } = req.params;
    const requesterUid = (req as any).uid;
    const requesterRole = (req as any).role;
    const tenantId = (req as any).tenantId;

    if (requesterRole !== "SUPER_ADMIN") {
      return res.status(403).json({ error: "Only SUPER_ADMIN can restore access" });
    }

    try {
      const userDoc = await db.collection("users").doc(userId).get();
      if (!userDoc.exists || userDoc.data()?.tenantId !== tenantId) {
        return res.status(404).json({ error: "User not found" });
      }

      await userDoc.ref.update({
        isLocked: false,
        lockedAt: null
      });

      await logAudit(requesterUid, `UNLOCK_USER: ${userId}`, req);
      res.json({ message: `User ${userId} access restored.` });
    } catch (error) {
      res.status(500).json({ error: "Failed to unlock user" });
    }
  });

  app.post("/api/admin/tenant-lockdown/:targetTenantId", async (req, res) => {
    const { targetTenantId } = req.params;
    const { lock } = req.body;
    const requesterUid = (req as any).uid;
    const requesterRole = (req as any).role;
    const tenantId = (req as any).tenantId;

    if (requesterRole !== "SUPER_ADMIN" || tenantId !== targetTenantId) {
      return res.status(403).json({ error: "Unauthorized: Only Tenant Candidate can trigger global lockdown" });
    }

    try {
      await db.collection("tenants").doc(targetTenantId).update({
        emergencyLockdown: lock === undefined ? true : lock
      });

      const status = lock === false ? "RESTORED" : "LOCKED";
      await logAudit(requesterUid, `TENANT_LOCKDOWN_${status}: ${targetTenantId}`, req);
      res.json({ message: `Tenant ${targetTenantId} status: ${status}` });
    } catch (error) {
      res.status(500).json({ error: "Failed to toggle tenant lockdown" });
    }
  });
  app.get("/api/voters/search", async (req, res) => {
    const { lat, lng, radiusKm } = req.query;
    const tenantId = (req as any).tenantId;
    const uid = (req as any).uid;

    if (!lat || !lng) return res.status(400).json({ error: "GPS coordinates (lat, lng) are required" });

    const userLat = parseFloat(lat as string);
    const userLng = parseFloat(lng as string);
    const radius = parseFloat(radiusKm as string) || 5.0;

    try {
      const votersSnapshot = await db.collection("voters")
        .where("tenantId", "==", tenantId)
        .get();

      const nearbyVoters = votersSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as any))
        .filter(voter => {
          if (!voter.lat || !voter.lng) return false;
          
          // Haversine formula
          const R = 6371; // km
          const dLat = (voter.lat - userLat) * Math.PI / 180;
          const dLng = (voter.lng - userLng) * Math.PI / 180;
          const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(userLat * Math.PI / 180) * Math.cos(voter.lat * Math.PI / 180) * 
            Math.sin(dLng/2) * Math.sin(dLng/2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          const distance = R * c;
          
          voter.distanceKm = round(distance, 2);
          return distance <= radius;
        })
        .sort((a, b) => a.distanceKm - b.distanceKm);

      res.json(nearbyVoters);
    } catch (error) {
      res.status(500).json({ error: "Failed to search nearby voters" });
    }
  });

  function round(value: number, precision: number) {
    const multiplier = Math.pow(10, precision || 0);
    return Math.round(value * multiplier) / multiplier;
  }

  // 9. Victory Probability Index (VPI) Engine
  app.get("/api/analytics/vpi", async (req, res) => {
    const tenantId = (req as any).tenantId;
    
    try {
      // 1. Fetch all voters for this tenant
      const votersSnapshot = await db.collection("voters")
        .where("tenantId", "==", tenantId)
        .get();
      
      let voters = votersSnapshot.docs.map(doc => doc.data());

      // 1.1 Safety Check: Exclude Neutral Professions (ASN, TNI, POLRI)
      const neutralProfessions = ["ASN", "TNI", "POLRI"];
      voters = voters.filter(v => !neutralProfessions.includes(v.pekerjaan));

      // 4. Automated Action: Exclude data from low-reliability volunteers
      const usersSnapshot = await db.collection("users")
        .where("tenantId", "==", tenantId)
        .where("reliabilityScore", "<", 40)
        .get();
      
      const untrustedUserIds = new Set(usersSnapshot.docs.map(doc => doc.id));
      voters = voters.filter(v => !untrustedUserIds.has(v.assigned_to_user_id));

      // 2. Mock DPT and Historical Data
      const districtDPT: Record<string, number> = {
        "1": 50000, // Menteng
        "2": 45000, // Gambir
        "3": 60000, // Senen
      };

      const historicalVPI: Record<string, number> = {
        "1": 0.55, // Was Green
        "2": 0.35, // Was Yellow
        "3": 0.25, // Was Red
      };

      // 3. Aggregate data per district
      const districtStats: Record<string, { 
        confirmedSupport: number, 
        swingVoters: number, 
        weightedSentiment: number,
        totalSurveyed: number 
      }> = {};

      voters.forEach(v => {
        const dId = v.districtCode || "1"; // Fallback to 1 for demo
        if (!districtStats[dId]) {
          districtStats[dId] = { confirmedSupport: 0, swingVoters: 0, weightedSentiment: 0, totalSurveyed: 0 };
        }

        districtStats[dId].totalSurveyed++;

        // Weights: Supporter (1.0), Swing (0.4), Opponent (0.0)
        // Note: supportStatusPrediction is mapped from survey status
        if (v.sentiment === "positive") {
          districtStats[dId].confirmedSupport += 1.0;
        } else if (v.sentiment === "neutral") {
          districtStats[dId].swingVoters += 1.0;
          districtStats[dId].weightedSentiment += (v.sentimentScore || 0.5);
        }
      });

      // 4. Calculate VPI per district
      const vpiResults = Object.keys(districtDPT).map(dId => {
        const stats = districtStats[dId] || { confirmedSupport: 0, swingVoters: 0, weightedSentiment: 0, totalSurveyed: 0 };
        const dpt = districtDPT[dId];
        
        // VPI Formula: (Confirmed_Support + (Swing_Voter * Sentiment_Score)) / Total_DPT
        // We multiply by a scaling factor to simulate real-world extrapolation if survey size is small
        const confidenceLevel = stats.totalSurveyed / (dpt * 0.01); // Surveyed vs 1% of DPT as baseline
        
        const rawVpi = (stats.confirmedSupport + (stats.swingVoters * 0.4)) / (stats.totalSurveyed || 1);
        // Extrapolate to DPT
        const estimatedVotes = rawVpi * dpt;
        const vpi = estimatedVotes / dpt;

        const prevVpi = historicalVPI[dId] || 0;
        const status = vpi > 0.5 ? "Green" : vpi > 0.3 ? "Yellow" : "Red";
        const prevStatus = prevVpi > 0.5 ? "Green" : prevVpi > 0.3 ? "Yellow" : "Red";

        const alert = (prevStatus === "Green" && status === "Yellow");

        return {
          districtId: dId,
          districtName: dId === "1" ? "Menteng" : dId === "2" ? "Gambir" : "Senen",
          vpi: Math.min(vpi, 1.0),
          confidenceLevel: Math.min(confidenceLevel, 1.0),
          status,
          alert,
          totalSurveyed: stats.totalSurveyed,
          totalDPT: dpt
        };
      });

      res.json({
        overallVpi: vpiResults.reduce((acc, curr) => acc + curr.vpi, 0) / vpiResults.length,
        districts: vpiResults
      });

    } catch (error) {
      console.error("VPI calculation error:", error);
      res.status(500).json({ error: "Failed to calculate VPI" });
    }
  });

  // 10. Micro-Targeting Map Data
  app.get("/api/analytics/map-data", async (req, res) => {
    const tenantId = (req as any).tenantId;
    
    try {
      const votersSnapshot = await db.collection("voters")
        .where("tenantId", "==", tenantId)
        .get();
      
      const features = votersSnapshot.docs
        .map(doc => {
          const data = doc.data();
          if (!data.lat || !data.lng) return null;
          
          return {
            type: "Feature",
            id: doc.id,
            geometry: {
              type: "Point",
              coordinates: [data.lng, data.lat]
            },
            properties: {
              id: doc.id,
              name: data.name,
              phone: data.phone_number,
              sentiment: data.sentiment,
              sentimentScore: data.sentimentScore,
              isHighInfluence: data.isHighInfluence,
              mainIssue: data.mainIssue,
              competitorActivity: data.competitorActivity,
              supportStatus: data.sentiment === "positive" ? "Loyal" : data.sentiment === "neutral" ? "Swing" : "Opponent"
            }
          };
        })
        .filter(f => f !== null);

      res.json({
        type: "FeatureCollection",
        features
      });
    } catch (error) {
      console.error("Map data error:", error);
      res.status(500).json({ error: "Failed to fetch map data" });
    }
  });

  // 11. Dispatch Volunteer to Voter
  app.post("/api/admin/dispatch", async (req, res) => {
    const { voterId, volunteerId, instruction } = req.body;
    const requesterUid = (req as any).uid;
    const requesterRole = (req as any).role;

    if (requesterRole !== "SUPER_ADMIN" && requesterRole !== "ADMIN_KECAMATAN") {
      return res.status(403).json({ error: "Unauthorized dispatch" });
    }

    try {
      await db.collection("dispatches").add({
        voterId,
        volunteerId,
        instruction,
        status: "pending",
        dispatchedBy: requesterUid,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      await logAudit(requesterUid, `DISPATCH_VOLUNTEER: ${volunteerId} to VOTER: ${voterId}`, req);
      res.json({ message: "Volunteer dispatched successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to dispatch volunteer" });
    }
  });

  // 12. Forensic Audit Engine
  const runVolunteerAudit = async (tenantId: string) => {
    console.log(`[AUDIT] Starting forensic audit for tenant: ${tenantId}`);
    
    try {
      const volunteersSnapshot = await db.collection("users")
        .where("tenantId", "==", tenantId)
        .where("role", "==", "RELAWAN")
        .get();

      for (const volDoc of volunteersSnapshot.docs) {
        const volData = volDoc.data();
        const volId = volDoc.id;

        const reportsSnapshot = await db.collection("voters")
          .where("assigned_to_user_id", "==", volId)
          .orderBy("createdAt", "desc")
          .limit(50)
          .get();

        const reports = reportsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
        if (reports.length === 0) continue;

        let reliabilityScore = 100;
        let flags = [];

        // 1. Anomaly Detection: Rate Limiting (> 5 in 15 mins)
        for (let i = 0; i < reports.length - 5; i++) {
          const t1 = reports[i].createdAt.toDate().getTime();
          const t5 = reports[i + 5].createdAt.toDate().getTime();
          if (Math.abs(t1 - t5) < 15 * 60 * 1000) {
            reliabilityScore -= 30;
            flags.push("RATE_LIMIT_EXCEEDED");
            break;
          }
        }

        // 2. GPS Accuracy Check
        const lowAccuracyCount = reports.filter(r => r.gpsAccuracy > 50).length;
        if (reports.length > 0 && lowAccuracyCount / reports.length > 0.5) {
          reliabilityScore -= 20;
          flags.push("LOW_GPS_ACCURACY");
        }

        // 3. Metadata Verification: EXIF vs Server Time
        const batchUploadCount = reports.filter(r => {
          if (!r.exifTimestamp) return false;
          const exifTime = new Date(r.exifTimestamp).getTime();
          const serverTime = r.createdAt.toDate().getTime();
          return Math.abs(serverTime - exifTime) > 60 * 60 * 1000; // > 1 hour
        }).length;

        if (batchUploadCount > 0) {
          reliabilityScore -= 15;
          flags.push("BATCH_UPLOAD_DETECTED");
        }

        // 4. Quality Scoring: Data Diversity
        const sentiments = reports.map(r => r.sentiment);
        const uniqueSentiments = new Set(sentiments);
        if (uniqueSentiments.size === 1 && reports.length > 5) {
          reliabilityScore -= 25;
          flags.push("UNIFORM_DATA_SUSPICION");
        }

        // 5. Device/IP Collision Check (Simplified)
        const uniqueIps = new Set(reports.map(r => r.ipAddress));
        const uniqueDevices = new Set(reports.map(r => r.deviceId));
        if (uniqueIps.size === 1 && uniqueDevices.size > 1) {
          reliabilityScore -= 20;
          flags.push("MULTI_ACCOUNT_COLLISION");
        }

        reliabilityScore = Math.max(0, reliabilityScore);
        
        await volDoc.ref.update({
          reliabilityScore,
          isFlagged: reliabilityScore < 60,
          auditStatus: reliabilityScore < 40 ? "fraudulent" : reliabilityScore < 70 ? "suspicious" : "clean",
          lastAuditAt: admin.firestore.FieldValue.serverTimestamp()
        });

        if (flags.length > 0) {
          await db.collection("audit_logs").add({
            userId: volId,
            tenantId,
            flags,
            score: reliabilityScore,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
          });
        }
      }
    } catch (error) {
      console.error("Audit engine error:", error);
    }
  };

  // Run audit every 1 hour
  setInterval(async () => {
    const tenants = await db.collection("tenants").get();
    for (const t of tenants.docs) {
      await runVolunteerAudit(t.id);
    }
  }, 3600000);

  app.get("/api/admin/audit-results", async (req, res) => {
    const tenantId = (req as any).tenantId;
    const role = (req as any).role;

    if (role !== "SUPER_ADMIN" && role !== "ADMIN_KECAMATAN") {
      return res.status(403).json({ error: "Unauthorized" });
    }

    try {
      const volunteers = await db.collection("users")
        .where("tenantId", "==", tenantId)
        .where("role", "==", "RELAWAN")
        .get();

      const results = volunteers.docs.map(doc => ({
        id: doc.id,
        email: doc.data().email,
        reliabilityScore: doc.data().reliabilityScore || 100,
        isFlagged: doc.data().isFlagged || false,
        auditStatus: doc.data().auditStatus || "clean"
      }));

      res.json(results);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch audit results" });
    }
  });

  app.post("/api/admin/trigger-audit", async (req, res) => {
    const tenantId = (req as any).tenantId;
    await runVolunteerAudit(tenantId);
    res.json({ message: "Audit triggered successfully" });
  });

  // 13. Daily Executive Summary Engine
  const generateDailySummary = async (tenantId: string) => {
    console.log(`[SUMMARY] Generating daily report for tenant: ${tenantId}`);
    
    try {
      const tenantDoc = await db.collection("tenants").doc(tenantId).get();
      const tenantData = tenantDoc.data();
      if (!tenantData?.isSummaryEnabled) return null;

      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const dayBeforeYesterday = new Date(now.getTime() - 48 * 60 * 60 * 1000);

      const votersSnapshot = await db.collection("voters")
        .where("tenantId", "==", tenantId)
        .get();

      const voters = votersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));

      // 1. Data Extraction
      const todayVoters = voters.filter(v => v.createdAt.toDate() >= yesterday);
      const yesterdayVoters = voters.filter(v => v.createdAt.toDate() >= dayBeforeYesterday && v.createdAt.toDate() < yesterday);

      const totalSupport = voters.filter(v => v.sentiment === "positive").length;
      const todaySupport = todayVoters.filter(v => v.sentiment === "positive").length;
      const yesterdaySupport = yesterdayVoters.filter(v => v.sentiment === "positive").length;
      const delta = todaySupport - yesterdaySupport;

      // Most frequent issue in last 24h
      const issueCounts: Record<string, number> = {};
      todayVoters.forEach(v => {
        const issue = v.mainIssue || "General";
        issueCounts[issue] = (issueCounts[issue] || 0) + 1;
      });
      const topIssue = Object.entries(issueCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "None";

      // Identify Swing Voters for AI Recommendation
      const swingVoters = todayVoters.filter(v => v.sentiment === "neutral");
      const swingIssues = swingVoters.map(v => v.mainIssue).join(", ");

      // 2. AI Strategic Recommendation
      const aiPrompt = `As a political strategist, generate a 2-sentence recommendation for a candidate. 
      Context: We have ${swingVoters.length} swing voters today. 
      Top issues among them: ${swingIssues || "General concerns"}. 
      The most frequent issue overall today is ${topIssue}. 
      Focus on how to convert these "Yellow" (swing) points on the map.`;

      const aiResponse = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: aiPrompt
      });
      const recommendation = aiResponse.text.trim();

      // 3. Formatting (WhatsApp-friendly)
      const dateStr = now.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      
      const message = `*📊 LAPORAN EKSEKUTIF HARIAN - ${tenantData.candidateName}*
_Tanggal: ${dateStr}_

*📈 RINGKASAN DATA*
• *Total Dukungan Terkonfirmasi:* ${totalSupport.toLocaleString()}
• *Pertumbuhan Hari Ini (Delta):* ${delta > 0 ? '+' : ''}${delta.toLocaleString()} pemilih baru
• *Isu Terhangat (24 Jam):* ${topIssue}

*🎯 ANALISIS MIKRO-TARGETING*
• *Swing Voters Terdeteksi:* ${swingVoters.length} titik "Kuning" baru di peta.
• *Rekomendasi Strategis AI:* ${recommendation}

*🚀 TINDAKAN SEGERA*
• Fokuskan relawan ke area dengan isu *${topIssue}* untuk penguatan narasi.
• Segera sapa ${swingVoters.length} swing voters melalui WhatsApp Greeting.

_PoliTrack AI - Strategic Intelligence System_`;

      return {
        recipient: tenantData.summaryRecipientPhone,
        message,
        totalSupport,
        delta,
        topIssue
      };

    } catch (error) {
      console.error("Summary engine error:", error);
      return null;
    }
  };

  // Cron Job Simulation (Trigger at 07:00 AM)
  setInterval(async () => {
    const now = new Date();
    // Check if it's 07:00 AM local time
    if (now.getHours() === 7 && now.getMinutes() === 0) {
      const tenants = await db.collection("tenants").get();
      for (const t of tenants.docs) {
        await generateDailySummary(t.id);
      }
    }
  }, 60000); // Check every minute

  app.post("/api/admin/generate-summary", async (req, res) => {
    const tenantId = (req as any).tenantId;
    const summary = await generateDailySummary(tenantId);
    if (!summary) return res.status(404).json({ error: "Summary disabled or failed" });
    
    res.json({ 
      message: "Summary generated successfully", 
      preview: summary.message,
      recipient: summary.recipient
    });
  });

  // 14. Real-Time Victory Dashboard (War Room)
  app.post("/api/war-room/verify-pin", async (req, res) => {
    const tenantId = (req as any).tenantId;
    const { pin } = req.body;

    try {
      const tenantDoc = await db.collection("tenants").doc(tenantId).get();
      const tenantData = tenantDoc.data();

      if (tenantData?.tpsPin === pin) {
        res.json({ success: true });
      } else {
        res.status(401).json({ error: "Invalid PIN" });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to verify PIN" });
    }
  });

  app.get("/api/war-room/stats", async (req, res) => {
    const tenantId = (req as any).tenantId;

    try {
      const tpsSnapshot = await db.collection("tps_results")
        .where("tenantId", "==", tenantId)
        .get();

      const results = tpsSnapshot.docs.map(doc => doc.data());
      
      const totalVotesCandidate = results.reduce((sum, r) => sum + (r.votesCandidate || 0), 0);
      const totalVotesOthers = results.reduce((sum, r) => sum + (r.votesOthers || 0), 0);
      const totalTPS = results.length;
      const totalVoters = results.reduce((sum, r) => sum + (r.totalVoters || 0), 0);

      const leadMargin = totalVotesCandidate - totalVotesOthers;
      const leadPercentage = (totalVotesCandidate / (totalVotesCandidate + totalVotesOthers || 1)) * 100;
      const turnoutPercentage = (totalVotesCandidate + totalVotesOthers) / (totalVoters || 1) * 100;

      // Group by district for map
      const districtStats: Record<string, any> = {};
      results.forEach(r => {
        if (!districtStats[r.district]) {
          districtStats[r.district] = { votesCandidate: 0, votesOthers: 0, totalVoters: 0, tpsCount: 0 };
        }
        districtStats[r.district].votesCandidate += r.votesCandidate;
        districtStats[r.district].votesOthers += r.votesOthers;
        districtStats[r.district].totalVoters += r.totalVoters;
        districtStats[r.district].tpsCount += 1;
      });

      // Reporting velocity (last 24 hours)
      const now = new Date();
      const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const velocity: Record<string, number> = {};
      
      results.forEach(r => {
        const date = new Date(r.createdAt);
        if (date >= last24h) {
          const hour = date.getHours();
          velocity[hour] = (velocity[hour] || 0) + 1;
        }
      });

      res.json({
        totalVotesCandidate,
        totalVotesOthers,
        totalTPS,
        leadMargin,
        leadPercentage,
        turnoutPercentage,
        districtStats,
        velocity
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch War Room stats" });
    }
  });

  app.post("/api/war-room/report-tps", async (req, res) => {
    const tenantId = (req as any).tenantId;
    const { district, village, tpsNumber, votesCandidate, votesOthers, totalVoters } = req.body;

    try {
      const tpsId = `tps_${tenantId}_${district}_${tpsNumber}`;
      const tpsData = {
        id: tpsId,
        tenantId,
        district,
        village,
        tpsNumber,
        votesCandidate,
        votesOthers,
        totalVoters,
        createdAt: new Date().toISOString()
      };

      await db.collection("tps_results").doc(tpsId).set(tpsData);
      
      // Broadcast update
      broadcast({ type: "TPS_UPDATE", data: tpsData });

      res.json({ message: "TPS result reported successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to report TPS result" });
    }
  });

  // 15. Legal Incident Reporting (Emergency Module)
  app.post("/api/incidents/report", async (req, res) => {
    const tenantId = (req as any).tenantId;
    const userId = (req as any).userId;
    const { category, description, evidenceUrl, location, deviceId } = req.body;

    try {
      const incidentId = `inc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const createdAt = new Date().toISOString();

      // Create Digital Signature for WORM (Write-Once-Read-Many) integrity
      const payload = JSON.stringify({
        tenantId,
        category,
        description,
        evidenceUrl,
        location,
        createdAt
      });
      
      const digitalSignature = crypto
        .createHmac("sha256", JWT_SECRET)
        .update(payload)
        .digest("hex");

      const incidentData = {
        id: incidentId,
        tenantId,
        category,
        description,
        evidenceUrl,
        location,
        reportedBy: userId,
        deviceId: deviceId || "unknown",
        status: "NEW",
        digitalSignature,
        createdAt
      };

      await db.collection("incidents").doc(incidentId).set(incidentData);

      // Broadcast to War Room Crisis Map
      broadcast({ type: "INCIDENT_ALERT", data: incidentData });

      // Log Audit
      await logAudit(userId, `REPORT_INCIDENT:${category}`, req);

      res.json({ 
        message: "Emergency report submitted successfully. Legal team notified.",
        incidentId,
        signature: digitalSignature
      });
    } catch (error) {
      console.error("Incident report error:", error);
      res.status(500).json({ error: "Failed to submit emergency report" });
    }
  });

  app.get("/api/incidents/stats", async (req, res) => {
    const tenantId = (req as any).tenantId;
    try {
      const snapshot = await db.collection("incidents")
        .where("tenantId", "==", tenantId)
        .get();
      
      const incidents = snapshot.docs.map(doc => doc.data());
      res.json(incidents);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch incidents" });
    }
  });

  app.patch("/api/incidents/:id/status", async (req, res) => {
    const { status } = req.body;
    const { id } = req.params;
    const userId = (req as any).userId;

    try {
      await db.collection("incidents").doc(id).update({ status });
      await logAudit(userId, `UPDATE_INCIDENT_STATUS:${id}:${status}`, req);
      res.json({ message: "Status updated successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to update incident status" });
    }
  });

  // API: Sentiment Analysis Background Worker (Simulated via endpoint or interval)
  const runSentimentAnalysis = async () => {
    try {
      const pendingVoters = await db.collection("voters")
        .where("sentiment", "==", "pending")
        .limit(5)
        .get();

      for (const doc of pendingVoters.docs) {
        const voter = doc.data();
        console.log(`Analyzing sentiment for voter: ${voter.name}`);

        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: `Analyze the sentiment of this political comment: "${voter.comment}". 
          Return ONLY a JSON object with "sentiment" (positive, negative, or neutral) and "score" (0 to 1).`,
          config: { responseMimeType: "application/json" }
        });

        const result = JSON.parse(response.text);
        await doc.ref.update({
          sentiment: result.sentiment,
          sentimentScore: result.score,
        });
        console.log(`Updated voter ${voter.name} with sentiment: ${result.sentiment}`);
      }
    } catch (error) {
      console.error("Sentiment analysis worker error:", error);
    }
  };

  // Run worker every 30 seconds
  setInterval(runSentimentAnalysis, 30000);

  // API: Manual trigger for testing
  app.post("/api/analyze-sentiment", async (req, res) => {
    await runSentimentAnalysis();
    res.json({ status: "Worker triggered" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
