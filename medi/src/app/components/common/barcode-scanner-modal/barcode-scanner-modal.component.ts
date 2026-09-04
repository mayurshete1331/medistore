import { Component, EventEmitter, Output, OnInit, OnDestroy, signal, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface QuickScanDrug {
  name: string;
  barcode: string;
  packaging: string;
}

@Component({
  selector: 'app-barcode-scanner-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './barcode-scanner-modal.component.html',
  styleUrls: ['./barcode-scanner-modal.component.scss']
})
export class BarcodeScannerModalComponent implements OnInit, OnDestroy {
  @Output() closed = new EventEmitter<void>();
  @Output() scanned = new EventEmitter<string>();

  @ViewChild('videoElement') videoRef!: ElementRef<HTMLVideoElement>;

  manualCode = signal('');
  isCameraActive = signal(false);
  cameraError = signal<string | null>(null);
  scanSuccess = signal<string | null>(null);
  isScanning = signal(true);

  private mediaStream: MediaStream | null = null;
  private scanIntervalId: any = null;

  readonly quickDrugs: QuickScanDrug[] = [
    { name: 'Augmentin 625 Duo', barcode: '890111700101', packaging: '10 Tabs/Strip' },
    { name: 'Dolo 650', barcode: '890111700102', packaging: '15 Tabs/Strip' },
    { name: 'Pan 40', barcode: '890111700103', packaging: '15 Tabs/Strip' },
    { name: 'Azithral 500', barcode: '890111700104', packaging: '5 Tabs/Strip' },
    { name: 'Telma 40', barcode: '890111700105', packaging: '15 Tabs/Strip' }
  ];

  ngOnInit(): void {
    this.startCamera();
  }

  ngOnDestroy(): void {
    this.stopCamera();
  }

  async startCamera(): Promise<void> {
    this.cameraError.set(null);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        this.mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false
        });

        this.isCameraActive.set(true);

        setTimeout(() => {
          if (this.videoRef && this.videoRef.nativeElement) {
            this.videoRef.nativeElement.srcObject = this.mediaStream;
            this.videoRef.nativeElement.play().catch(e => console.warn('Video play error', e));
            this.startBarcodeDetectorLoop();
          }
        }, 100);
      } else {
        this.cameraError.set('Webcam access not supported on this browser/device.');
      }
    } catch (err: any) {
      console.warn('Camera access error:', err);
      this.cameraError.set(
        err?.name === 'NotAllowedError'
          ? 'Camera permission denied. Click below to simulate scans or use a USB barcode reader.'
          : 'Could not connect to camera. You can scan using USB scanner or quick presets.'
      );
    }
  }

  stopCamera(): void {
    if (this.scanIntervalId) {
      clearInterval(this.scanIntervalId);
      this.scanIntervalId = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    this.isCameraActive.set(false);
  }

  private startBarcodeDetectorLoop(): void {
    // Use standard browser BarcodeDetector API if available
    if ('BarcodeDetector' in window) {
      const barcodeDetector = new (window as any).BarcodeDetector({
        formats: ['ean_13', 'ean_8', 'qr_code', 'code_128', 'upc_a', 'upc_e']
      });

      this.scanIntervalId = setInterval(async () => {
        if (!this.isScanning() || !this.videoRef?.nativeElement) return;
        const video = this.videoRef.nativeElement;
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
          try {
            const barcodes = await barcodeDetector.detect(video);
            if (barcodes && barcodes.length > 0) {
              const detectedValue = barcodes[0].rawValue;
              this.onCodeDetected(detectedValue);
            }
          } catch (e) {
            // Detection error
          }
        }
      }, 300);
    }
  }

  onCodeDetected(code: string): void {
    const trimmed = code.trim();
    if (!trimmed || !this.isScanning()) return;

    this.isScanning.set(false);
    this.scanSuccess.set(trimmed);
    this.playBeepSound();

    setTimeout(() => {
      this.scanned.emit(trimmed);
      this.closed.emit();
    }, 600);
  }

  submitManual(): void {
    const code = this.manualCode().trim();
    if (code) {
      this.onCodeDetected(code);
    }
  }

  simulateScan(drug: QuickScanDrug): void {
    this.onCodeDetected(drug.barcode);
  }

  playBeepSound(): void {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1400, ctx.currentTime); // High pitch retail scanner beep
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch (e) {
      // Audio context restricted or muted
    }
  }

  closeModal(): void {
    this.stopCamera();
    this.closed.emit();
  }
}
