import { useState, useEffect } from "react";
import { Html5QrcodeScanner, Html5QrcodeScanType } from "html5-qrcode";
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
  const [scannedTokens, setScannedTokens] = useState<string[]>([]);
  const [verifying, setVerifying] = useState(false);
  const [scanner, setScanner] = useState<Html5QrcodeScanner | null>(null);
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

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
    setScanning(true);
    setScannedTokens([]);

    const html5QrcodeScanner = new Html5QrcodeScanner(
      "qr-reader",
      { 
        fps: 10, 
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        rememberLastUsedCamera: true,
        showTorchButtonIfSupported: true,
        supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
        videoConstraints: {
          facingMode: "environment" // Use back camera on mobile
        },
      },
      false
    );

    html5QrcodeScanner.render(onScanSuccess, onScanError);
    setScanner(html5QrcodeScanner);
  };

  const onScanSuccess = (decodedText: string) => {
    // Add token to scanned list
    setScannedTokens((prev) => {
      const newTokens = [...prev, decodedText];
      
      // Keep only last 3 scans (representing 6 seconds of scanning)
      if (newTokens.length > 3) {
        newTokens.shift();
      }

      // If we have 3 consecutive valid scans, verify attendance
      if (newTokens.length === 3) {
        verifyAttendance(newTokens);
      }

      return newTokens;
    });
  };

  const onScanError = (error: any) => {
    // Ignore scan errors, they're common during scanning
    console.log("Scan error (normal):", error);
  };

  const verifyAttendance = async (tokens: string[]) => {
    if (verifying) return;
    
    setVerifying(true);
    
    try {
      // Parse tokens
      const parsedTokens = tokens.map((token) => {
        const [sessionId, timestamp] = token.split(":");
        return { sessionId, timestamp: parseInt(timestamp) };
      });

      // Verify all tokens are from the same session
      const sessionId = parsedTokens[0].sessionId;
      const allSameSession = parsedTokens.every((t) => t.sessionId === sessionId);
      
      if (!allSameSession) {
        throw new Error("Invalid QR codes detected");
      }

      // Verify tokens are sequential (within 10 seconds of each other)
      const timestamps = parsedTokens.map((t) => t.timestamp).sort();
      const timeDiff = timestamps[timestamps.length - 1] - timestamps[0];
      
      if (timeDiff > 10000) {
        throw new Error("QR codes are too old. Please scan again.");
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
          verification_token: tokens.join(","),
        });

      if (error) {
        if (error.code === "23505") {
          throw new Error("You have already checked in to this session");
        }
        throw error;
      }

      toast.success("Attendance recorded successfully!");
      
      // Stop scanning
      if (scanner) {
        scanner.clear();
      }
      setScanning(false);
      setScannedTokens([]);
      
      // Reload attendance history
      loadAttendanceHistory();
    } catch (error: any) {
      toast.error(error.message || "Failed to record attendance");
      setScannedTokens([]);
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
            Hold your phone steady and keep scanning for a few seconds.
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
              
              <div className="space-y-3 rounded-lg border bg-muted/50 p-4">
                <p className="text-sm font-medium text-center">
                  Scanning progress
                </p>
                <div className="flex justify-center gap-3">
                  {[1, 2, 3].map((num) => (
                    <div
                      key={num}
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                        scannedTokens.length >= num
                          ? "bg-primary text-primary-foreground scale-110"
                          : "bg-background border-2 border-muted-foreground/20"
                      }`}
                    >
                      {scannedTokens.length >= num ? (
                        <CheckCircle className="w-6 h-6" />
                      ) : (
                        <span className="text-sm font-medium text-muted-foreground">{num}</span>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  {scannedTokens.length === 0 && "Point your camera at the QR code"}
                  {scannedTokens.length > 0 && scannedTokens.length < 3 && "Keep scanning..."}
                  {scannedTokens.length === 3 && verifying && "Verifying attendance..."}
                </p>
              </div>

              <Button
                variant="outline"
                onClick={() => {
                  if (scanner) scanner.clear();
                  setScanning(false);
                  setScannedTokens([]);
                }}
                className="w-full"
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

