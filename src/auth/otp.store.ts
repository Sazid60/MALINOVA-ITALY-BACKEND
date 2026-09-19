import { Injectable } from '@nestjs/common';

interface OtpEntry {
  otp: string;
  expiresAt: number; // unix ms
}

/**
 * Simple in-memory OTP store.
 * Replace with Redis (ioredis) for production multi-instance deployments.
 */
@Injectable()
export class OtpStore {
  private store = new Map<string, OtpEntry>();

  generate(email: string): string {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    this.store.set(email.toLowerCase(), {
      otp,
      expiresAt: Date.now() + 15 * 60 * 1000, // 15 min
    });
    return otp;
  }

  verify(email: string, otp: string): boolean {
    const entry = this.store.get(email.toLowerCase());
    if (!entry) return false;
    if (Date.now() > entry.expiresAt) { this.store.delete(email.toLowerCase()); return false; }
    if (entry.otp !== otp) return false;
    this.store.delete(email.toLowerCase()); // one-time use
    return true;
  }

  peek(email: string): string | null {
    return this.store.get(email.toLowerCase())?.otp ?? null;
  }
}
