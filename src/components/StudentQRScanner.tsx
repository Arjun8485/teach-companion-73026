import { useState, useEffect } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { CheckCircle, XCircle } from "lucide-react";

interface StudentQRScannerProps {
  courseId: string;
}

export default function StudentQRScanner({ courseId }: StudentQRScannerProps) {
  const [scanning, setScanning] = useState(false);
  const [scannedTokens, setScannedTokens] = useState<string[]>([]);
  const [verifying, setVerifying] = useState(false);
  const [scanner, setScanner] = useState<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    return () => {
      if (scanner) {
        scanner.clear();
      }
    };
  }, [scanner]);

  const startScanning = () => {
    setScanning(true);
    setScannedTokens([]);

    const html5QrcodeScanner = new Html5QrcodeScanner(
      "qr-reader",
      { 
        fps: 10, 
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
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
    // Ignore scan errors, they're common
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
    } catch (error: any) {
      toast.error(error.message || "Failed to record attendance");
      setScannedTokens([]);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mark Attendance</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!scanning ? (
          <Button onClick={startScanning} className="w-full">
            Start QR Scanner
          </Button>
        ) : (
          <>
            <div id="qr-reader" className="w-full"></div>
            
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground text-center">
                Scanning progress: {scannedTokens.length}/3 codes captured
              </p>
              <div className="flex justify-center gap-2">
                {[1, 2, 3].map((num) => (
                  <div
                    key={num}
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      scannedTokens.length >= num
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    {scannedTokens.length >= num && <CheckCircle className="w-5 h-5" />}
                  </div>
                ))}
              </div>
              {verifying && (
                <p className="text-sm text-primary text-center">
                  Verifying attendance...
                </p>
              )}
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
              Cancel
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

