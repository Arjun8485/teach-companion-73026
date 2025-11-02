import { useState, useEffect, useRef } from "react";
import { Html5Qrcode, Html5QrcodeScanType } from "html5-qrcode";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CheckCircle, Camera, Calendar, Clock } from "lucide-react";
import { format } from "date-fns";

interface StudentQRScannerProps {
  courseId: string;
}

interface AttendanceRecord {
  id: string;
  checked_in_at: string;
  session: {
    title: string;
    scheduled_at: string;
  };
}

export default function StudentQRScanner({ courseId }: StudentQRScannerProps) {
  const [scanning, setScanning] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verifyingAI, setVerifyingAI] = useState(false);
  const [scanner, setScanner] = useState<Html5Qrcode | null>(null);
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    loadAttendanceHistory();
  }, [courseId]);

  useEffect(() => {
    return () => {
      if (scanner) {
        scanner.clear();
      }
    };
  }, [scanner]);

  useEffect(() => {
    if (scanning && !scanner) {
      initializeScanner();
    }
  }, [scanning]);

  const loadAttendanceHistory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: sessions } = await supabase
        .from("exercise_sessions")
        .select("id")
        .eq("course_id", courseId);

      const sessionIds = sessions?.map(s => s.id) || [];

      if (sessionIds.length > 0) {
        const { data, error } = await supabase
          .from("session_attendance")
          .select(`
            id,
            checked_in_at,
            session:exercise_sessions(title, scheduled_at)
          `)
          .eq("student_id", user.id)
          .in("session_id", sessionIds)
          .order("checked_in_at", { ascending: false })
          .limit(10);

        if (error) throw error;
        setAttendanceHistory(data as any || []);
      }
    } catch (error) {
      console.error("Error loading attendance history:", error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const startScanning = () => {
    console.log("Activating camera...");
    setScanning(true);
  };

  const initializeScanner = async () => {
    try {
      // Check if mediaDevices is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera not supported on this device");
      }

      // Wait a bit for the DOM to render
      await new Promise(resolve => setTimeout(resolve, 100));

      // Check if the qr-reader element exists
      const readerElement = document.getElementById("qr-reader");
      if (!readerElement) {
        console.error("QR reader element not found");
        throw new Error("Camera viewer not ready");
      }

      console.log("Initializing Html5Qrcode...");
      const html5Qrcode = new Html5Qrcode("qr-reader");
      
      console.log("Starting camera stream...");
      await html5Qrcode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        onScanSuccess,
        onScanError
      );
      
      console.log("Camera started successfully");
      setScanner(html5Qrcode);
    } catch (error: any) {
      console.error("Camera start error:", error);
      console.error("Error details:", { name: error?.name, message: error?.message, stack: error?.stack });
      
      // Provide specific error messages
      if (error?.name === 'NotAllowedError' || error?.message?.includes('Permission')) {
        toast.error("Camera access denied. Please allow camera permissions in your browser settings.");
      } else if (error?.name === 'NotFoundError' || error?.message?.includes('not found')) {
        toast.error("No camera found on this device.");
      } else if (error?.name === 'NotReadableError') {
        toast.error("Camera is already in use by another application.");
      } else if (error?.message?.includes('not supported')) {
        toast.error("Camera is not supported on this device.");
      } else {
        toast.error(`Failed to start camera: ${error?.message || 'Unknown error'}`);
      }
      
      setScanning(false);
      setScanner(null);
    }
  };

  const onScanSuccess = async (decodedText: string) => {
    if (verifying || verifyingAI) return; // Prevent multiple simultaneous verifications
    
    try {
      // Capture the current video frame
      const canvas = document.createElement('canvas');
      const video = document.querySelector('#qr-reader video') as HTMLVideoElement;
      
      if (!video) {
        toast.error("Camera feed not available");
        return;
      }
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        toast.error("Failed to capture image");
        return;
      }
      
      ctx.drawImage(video, 0, 0);
      const imageData = canvas.toDataURL('image/jpeg', 0.8);
      
      // Verify with AI that it's a physical QR code
      setVerifyingAI(true);
      toast.info("Verifying QR code authenticity...");
      
      const { data: aiResult, error: aiError } = await supabase.functions.invoke('verify-physical-qr', {
        body: { imageData }
      });
      
      setVerifyingAI(false);
      
      if (aiError) {
        console.error("AI verification error:", aiError);
        toast.error("Verification failed. Please try again.");
        return;
      }
      
      if (!aiResult.isPhysical) {
        toast.error("Screenshot detected! Please scan the QR code from the actual display.");
        return;
      }
      
      // If AI confirms it's physical, proceed with attendance
      await verifyAttendance(decodedText);
      
    } catch (error) {
      console.error("Scan processing error:", error);
      toast.error("Failed to process scan");
      setVerifyingAI(false);
    }
  };

  const onScanError = (error: any) => {
    // Silently ignore scan errors - they're normal during the scanning process
    // Only actual QR codes will trigger onScanSuccess
  };

  const verifyAttendance = async (token: string) => {
    if (verifying) return;
    
    setVerifying(true);
    
    try {
      // Parse token
      const [sessionId, timestamp] = token.split(":");
      const tokenTimestamp = parseInt(timestamp);

      // Verify token is recent (within 10 seconds)
      const now = Date.now();
      const timeDiff = now - tokenTimestamp;
      
      if (timeDiff > 10000) {
        throw new Error("QR code expired. Please scan again.");
      }

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Record attendance
      const { error } = await supabase
        .from("session_attendance")
        .insert({
          session_id: sessionId,
          student_id: user.id,
          verification_token: token,
        });

      if (error) {
        if (error.code === "23505") {
          throw new Error("You have already checked in to this session");
        }
        throw error;
      }

      toast.success("✅ Attendance recorded successfully!");
      
      // Stop scanning
      if (scanner) {
        await scanner.stop();
      }
      setScanning(false);
      
      // Reload attendance history
      loadAttendanceHistory();
    } catch (error: any) {
      toast.error(error.message || "Failed to record attendance");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Mark Attendance
          </CardTitle>
          <CardDescription>
            Scan the QR code displayed by your instructor to mark your attendance. 
            Make sure to scan from the actual display - screenshots will be detected and rejected.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!scanning ? (
            <>
              <div className="rounded-lg border border-dashed border-muted-foreground/25 p-6 text-center space-y-3">
                <Camera className="w-12 h-12 mx-auto text-muted-foreground" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">Ready to scan</p>
                  <p className="text-xs text-muted-foreground">
                    Make sure to allow camera access when prompted
                  </p>
                </div>
              </div>
              <Button onClick={startScanning} className="w-full" size="lg">
                <Camera className="w-4 h-4 mr-2" />
                Open Camera to Scan
              </Button>
            </>
          ) : (
            <>
              <div id="qr-reader" className="w-full rounded-lg overflow-hidden"></div>
              
              {(verifying || verifyingAI) && (
                <div className="space-y-3 rounded-lg border bg-primary/5 p-4">
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                    <p className="text-sm font-medium">
                      {verifyingAI ? "Verifying QR authenticity with AI..." : "Recording attendance..."}
                    </p>
                  </div>
                </div>
              )}

              <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
                <p className="text-xs text-muted-foreground text-center">
                  📱 Point your camera at the QR code on the instructor's screen
                </p>
                <p className="text-xs text-muted-foreground text-center">
                  🚫 Screenshots and photos will be automatically detected and rejected
                </p>
              </div>

              <Button
                variant="outline"
                onClick={async () => {
                  if (scanner) {
                    await scanner.stop();
                  }
                  setScanning(false);
                }}
                className="w-full"
                disabled={verifying || verifyingAI}
              >
                Cancel Scanning
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Your Attendance History
          </CardTitle>
          <CardDescription>
            Recent exercise sessions you've attended in this course
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingHistory ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : attendanceHistory.length === 0 ? (
            <div className="text-center py-8 space-y-2">
              <p className="text-sm text-muted-foreground">No attendance records yet</p>
              <p className="text-xs text-muted-foreground">
                Scan a QR code to mark your first attendance
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {attendanceHistory.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{record.session.title}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(record.session.scheduled_at), "MMM d, yyyy")}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Checked in {format(new Date(record.checked_in_at), "HH:mm")}
                      </span>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-success/10 text-success border-success/20">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Present
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

