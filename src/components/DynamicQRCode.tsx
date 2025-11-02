import { useState, useEffect, useRef } from "react";
import QRCode from "qrcode";
import { Card, CardContent } from "@/components/ui/card";

interface DynamicQRCodeProps {
  sessionId: string;
}

export default function DynamicQRCode({ sessionId }: DynamicQRCodeProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [currentToken, setCurrentToken] = useState<string>("");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const generateToken = () => {
      const timestamp = Date.now();
      const token = `${sessionId}:${timestamp}`;
      setCurrentToken(token);
      
      // Generate QR code
      if (canvasRef.current) {
        QRCode.toCanvas(
          canvasRef.current,
          token,
          {
            width: 300,
            margin: 2,
            color: {
              dark: "#000000",
              light: "#FFFFFF",
            },
          },
          (error) => {
            if (error) console.error("QR generation error:", error);
          }
        );
      }
    };

    // Generate initial token
    generateToken();

    // Rotate token every 2 seconds to prevent screenshot sharing
    const interval = setInterval(generateToken, 2000);

    return () => clearInterval(interval);
  }, [sessionId]);

  return (
    <Card className="bg-muted/50">
      <CardContent className="flex flex-col items-center p-6">
        <div className="bg-white p-4 rounded-lg">
          <canvas ref={canvasRef} />
        </div>
        <p className="text-sm text-muted-foreground mt-4 text-center">
          QR code updates every 2 seconds. Students must scan continuously for 3-5 seconds to register attendance.
        </p>
      </CardContent>
    </Card>
  );
}
